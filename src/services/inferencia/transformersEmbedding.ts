import { env, pipeline, type ProgressInfo } from '@huggingface/transformers'
import fabricaOrt from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'
import binarioOrt from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'

import type { EmbeddingProvider } from '@/core'

export const MODELO_EMBEDDING = 'Xenova/multilingual-e5-small'

/** Sempre quantizado: em celular não é opcional. */
const DTYPE = 'q8'

/** Dimensão do multilingual-e5-small. Conferida na primeira inferência. */
const DIM = 384

/**
 * O prefixo é exigência do e5 e mora aqui, no adapter — não no algoritmo.
 * Trocar de modelo troca este arquivo, e o núcleo não fica sabendo.
 */
const PREFIXO = 'query: '

/**
 * Truncamento simples.
 *
 * Neurônios viraram texto livre e potencialmente longo (um roteiro, um
 * pensamento desenvolvido), mas o e5 tem um limite prático de ~512 tokens e
 * corta o final em silêncio se deixarmos passar disso. Em vez de chunking
 * (fatiar e combinar embeddings — fica para depois, só se sentirmos ideia de
 * meio/fim de texto "esquecida" nas conexões), v1 usa só os primeiros ~2500
 * caracteres: a essência de um pensamento costuma aparecer no começo.
 *
 * Mora aqui e não no núcleo porque é detalhe deste modelo, como o prefixo do e5.
 */
const LIMITE_CARACTERES = 2500

/**
 * Tira o runtime ONNX do CDN.
 *
 * Por padrão o transformers.js aponta `wasmPaths` para o jsdelivr, então a
 * primeira execução do app depende de um terceiro. Um produto que promete
 * funcionar offline não pode começar precisando de rede — e dentro da WebView
 * do Android isso seria download em cima de download, com o APK já carregando
 * o arquivo.
 *
 * Não custa bytes novos: o Vite já emitia esses dois arquivos no `dist` (23,5
 * MB) porque o bundle do ORT os referencia, e ninguém os usava. Apontar para
 * eles só faz o que já estava lá servir para alguma coisa.
 *
 * O Safari carrega o par não-asyncify e continua no caminho padrão: embutir os
 * dois pares dobraria o peso por um navegador que não é o alvo deste app.
 */
function hospedarRuntimeLocalmente(): void {
  const wasm = env.backends.onnx.wasm
  const padrao = wasm?.wasmPaths
  if (!wasm || typeof padrao !== 'object') return
  if (!String(padrao.wasm).includes('asyncify')) return

  wasm.wasmPaths = { mjs: fabricaOrt, wasm: binarioOrt }
}

/**
 * Tira o HuggingFace do caminho, no build que vira APK.
 *
 * `scripts/build-android.mjs` põe os 129 MB do modelo dentro do pacote. Aqui só
 * se diz onde procurar. `allowRemoteModels = false` é de propósito: se um
 * arquivo faltar, é melhor quebrar na hora do que o aparelho puxar 129 MB por
 * dados móveis sem ninguém pedir.
 *
 * `useBrowserCache = false` pelo mesmo motivo — o modelo já está em disco,
 * dentro do APK; copiá-lo para o cache da WebView seria pagar 129 MB de novo.
 *
 * É decisão de build, não de execução: o adapter roda dentro de um Worker, onde
 * a ponte do Capacitor não existe e `isNativePlatform()` mentiria. E o build do
 * Android já é outro comando de qualquer forma, porque precisa baixar o modelo.
 */
function apontarParaOModeloEmbutido(): void {
  if (import.meta.env.VITE_ANDROID !== '1') return

  env.allowLocalModels = true
  env.localModelPath = '/modelos/'
  env.allowRemoteModels = false
  env.useBrowserCache = false
}

export interface OpcoesEmbedding {
  aoBaixar?: (arquivo: string, pct: number) => void
}

type Extrator = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>

/**
 * `EmbeddingProvider` sobre transformers.js.
 *
 * Feito para viver dentro de um Web Worker: `embed` é sequencial e bloqueante,
 * e não pode segurar a thread da interface. No nativo isto vira
 * `OnnxNativeEmbedding` — um arquivo novo, sem tocar no núcleo.
 */
export function criarTransformersEmbedding(opcoes: OpcoesEmbedding = {}): EmbeddingProvider {
  let carregando: Promise<Extrator> | null = null

  // Idempotente: chamar duas vezes não baixa duas vezes. As duas configurações
  // acima ficam dentro da guarda de propósito — depois da primeira carga o
  // transformers.js troca `wasmPaths.mjs` por um blob, e reescrever por cima
  // desfaria isso.
  const carregar = (): Promise<Extrator> => {
    if (carregando) return carregando

    hospedarRuntimeLocalmente()
    apontarParaOModeloEmbutido()

    carregando = pipeline('feature-extraction', MODELO_EMBEDDING, {
      dtype: DTYPE,
      progress_callback: (info: ProgressInfo) => {
        if (info.status !== 'progress' || info.total <= 0) return
        opcoes.aoBaixar?.(info.file, Math.min(100, Math.round((info.loaded / info.total) * 100)))
      },
    })
    return carregando
  }

  return {
    dim: DIM,

    async ready() {
      await carregar()
    },

    async embed(text: string): Promise<Float32Array> {
      const extrator = await carregar()
      const truncado = text.slice(0, LIMITE_CARACTERES)
      const saida = await extrator(PREFIXO + truncado, { pooling: 'mean', normalize: true })

      const vetor = saida.data as Float32Array
      if (vetor.length !== DIM) {
        throw new Error(`${MODELO_EMBEDDING} devolveu ${vetor.length} dimensões, esperava ${DIM}`)
      }

      // Cópia: o tensor é reaproveitado pela lib entre chamadas.
      return Float32Array.from(vetor)
    },
  }
}
