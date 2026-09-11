/// <reference lib="webworker" />
import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  env,
  pipeline,
  type ProgressInfo,
} from '@huggingface/transformers'

import {
  centralizar,
  perfilDoPalacio,
  construirGrafo,
  OPCOES_PADRAO,
  produtoInterno,
  textoDoNeuronio,
  type NoDoGrafo,
  type PontuarPar,
} from '@/core'
import { SEED_LIVROS, SEED_NEURONIOS } from '@/features/palacio/seed'

import {
  distribuir,
  medir,
  type Ambiente,
  type CargaDeModelo,
  type MensagemDoWorker,
  type MensagemParaWorker,
  type OpcoesSpike,
  type ParDiagnostico,
  type Qualidade,
  type ResultadoEmbedding,
  type ResultadoReranker,
  type ResultadoSpike,
} from './protocolo'

const MODELO_EMBEDDING = 'Xenova/multilingual-e5-small'
const MODELO_RERANKER = 'Xenova/bge-reranker-base'
const DTYPE = 'q8'

/** O prefixo é exigência do e5 e mora aqui, no adapter — não no algoritmo. */
const PREFIXO_E5 = 'query: '

const escopo = self as unknown as DedicatedWorkerGlobalScope

function avisar(m: MensagemDoWorker): void {
  escopo.postMessage(m)
}

function passo(texto: string): void {
  avisar({ tipo: 'passo', texto })
}

/** Conta bytes que vieram mesmo da rede: cache quente não emite progresso. */
function contadorDeDownload(): {
  callback: (info: ProgressInfo) => void
  resumo: () => { bytes: number; arquivos: number }
} {
  const porArquivo = new Map<string, number>()

  return {
    callback: (info: ProgressInfo) => {
      if (info.status !== 'progress') return
      const arquivo = info.file
      porArquivo.set(arquivo, Math.max(porArquivo.get(arquivo) ?? 0, info.loaded))
      if (info.total > 0) {
        avisar({
          tipo: 'progresso',
          arquivo,
          pct: Math.min(100, Math.round((info.loaded / info.total) * 100)),
        })
      }
    },
    resumo: () => ({
      bytes: [...porArquivo.values()].reduce((a, b) => a + b, 0),
      arquivos: porArquivo.size,
    }),
  }
}

/**
 * Os pesos deste modelo estão guardados no navegador?
 *
 * O `progress_callback` não serve para isso: ele dispara igual lendo do cache.
 * Perguntar ao Cache API é a única resposta confiável — e é como se descobre
 * que um arquivo grande demais simplesmente não foi aceito.
 */
async function pesosNoCache(modelo: string): Promise<boolean> {
  try {
    const cache = await caches.open('transformers-cache')
    const chaves = await cache.keys()
    return chaves.some((k) => k.url.includes(modelo) && k.url.endsWith('.onnx'))
  } catch {
    return false
  }
}

async function carga(
  modelo: string,
  ms: number,
  resumo: { bytes: number; arquivos: number },
  cacheadoAntes: boolean,
): Promise<CargaDeModelo> {
  return {
    modelo,
    dtype: DTYPE,
    ms,
    bytesLidos: resumo.bytes,
    arquivos: resumo.arquivos,
    cacheadoAntes,
    cacheadoDepois: await pesosNoCache(modelo),
  }
}

async function lerAmbiente(): Promise<Ambiente> {
  const nav = escopo.navigator as Navigator & { deviceMemory?: number; gpu?: unknown }

  const cacheDisponivel = await caches
    .keys()
    .then(() => true)
    .catch(() => false)

  return {
    userAgent: nav.userAgent,
    nucleos: nav.hardwareConcurrency,
    memoriaGb: nav.deviceMemory ?? null,
    crossOriginIsolated: escopo.crossOriginIsolated,
    webgpu: 'gpu' in nav && nav.gpu !== undefined,
    contextoSeguro: escopo.isSecureContext,
    cacheDisponivel,
    threadsWasm: env.backends.onnx?.wasm?.numThreads ?? null,
  }
}

const TEXTOS_CURTOS = SEED_NEURONIOS.map(textoDoNeuronio)

/** Um neurônio de verdade pode ser bem maior que os do seed. */
const TEXTOS_LONGOS = TEXTOS_CURTOS.map((t) => [t, t, t, t, t].join(' '))

function ciclo(fonte: readonly string[], quantos: number): string[] {
  return Array.from({ length: quantos }, (_, i) => fonte[i % fonte.length]!)
}

type Extrator = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>

async function medirEmbedding(opcoes: OpcoesSpike): Promise<{
  resultado: ResultadoEmbedding
  extrator: Extrator
}> {
  const cacheadoAntes = await pesosNoCache(MODELO_EMBEDDING)
  passo(`Carregando ${MODELO_EMBEDDING} (${DTYPE})…`)
  const contador = contadorDeDownload()
  const t0 = performance.now()
  const extrator = await pipeline('feature-extraction', MODELO_EMBEDDING, {
    dtype: DTYPE,
    progress_callback: contador.callback,
  })
  const msCarga = performance.now() - t0

  const embutir = async (texto: string): Promise<number> => {
    const t = performance.now()
    await extrator(PREFIXO_E5 + texto, { pooling: 'mean', normalize: true })
    return performance.now() - t
  }

  passo('Primeira inferência (aquecimento do grafo)…')
  const primeiraMs = await embutir(TEXTOS_CURTOS[0]!)

  passo(`Embedding: ${opcoes.repeticoesEmbedding} textos curtos…`)
  const curto: number[] = []
  for (const t of ciclo(TEXTOS_CURTOS, opcoes.repeticoesEmbedding)) curto.push(await embutir(t))

  passo(`Embedding: ${opcoes.repeticoesEmbedding} textos longos…`)
  const longo: number[] = []
  for (const t of ciclo(TEXTOS_LONGOS, opcoes.repeticoesEmbedding)) longo.push(await embutir(t))

  const amostra = await extrator(PREFIXO_E5 + TEXTOS_CURTOS[0]!, {
    pooling: 'mean',
    normalize: true,
  })

  return {
    extrator,
    resultado: {
      carga: await carga(MODELO_EMBEDDING, msCarga, contador.resumo(), cacheadoAntes),
      dim: amostra.dims[amostra.dims.length - 1] ?? 0,
      primeiraMs,
      curto: medir(curto),
      longo: medir(longo),
    },
  }
}

type Pontuador = (a: string, b: string) => Promise<number>

async function medirReranker(
  opcoes: OpcoesSpike,
): Promise<{ resultado: ResultadoReranker; pontuador: Pontuador }> {
  const cacheadoAntes = await pesosNoCache(MODELO_RERANKER)
  passo(`Carregando ${MODELO_RERANKER} (${DTYPE})…`)
  const contador = contadorDeDownload()
  const t0 = performance.now()

  const [tokenizer, modelo] = await Promise.all([
    AutoTokenizer.from_pretrained(MODELO_RERANKER, { progress_callback: contador.callback }),
    AutoModelForSequenceClassification.from_pretrained(MODELO_RERANKER, {
      dtype: DTYPE,
      progress_callback: contador.callback,
    }),
  ])
  const msCarga = performance.now() - t0

  // O cross-encoder devolve um logit só; o tipo da lib é genérico demais para isso.
  interface SaidaDoCrossEncoder {
    logits: { data: ArrayLike<number> }
  }

  const pontuar = async (a: string, b: string): Promise<{ ms: number; score: number }> => {
    const t = performance.now()
    const entradas = tokenizer(a, { text_pair: b, padding: true, truncation: true })
    const saida = (await modelo(entradas)) as SaidaDoCrossEncoder
    const logit = Number(saida.logits.data[0])
    return { ms: performance.now() - t, score: 1 / (1 + Math.exp(-logit)) }
  }

  passo('Reranker: primeira inferência…')
  const primeira = await pontuar(TEXTOS_CURTOS[0]!, TEXTOS_CURTOS[1]!)

  passo(`Reranker: ${opcoes.paresReranker} pares…`)
  const amostras: number[] = []
  let ultimoScore = primeira.score
  for (let i = 0; i < opcoes.paresReranker; i++) {
    const a = TEXTOS_CURTOS[i % TEXTOS_CURTOS.length]!
    const b = TEXTOS_CURTOS[(i + 3) % TEXTOS_CURTOS.length]!
    const r = await pontuar(a, b)
    amostras.push(r.ms)
    ultimoScore = r.score
  }

  return {
    pontuador: async (a, b) => (await pontuar(a, b)).score,
    resultado: {
      carga: await carga(MODELO_RERANKER, msCarga, contador.resumo(), cacheadoAntes),
      primeiraMs: primeira.ms,
      porPar: medir(amostras),
      exemploScore: ultimoScore,
    },
  }
}

/**
 * Roda o núcleo da Fase 2 com os modelos da Fase 4 sobre os neurônios do seed.
 *
 * É a única parte do spike que responde "as conexões prestam?" — e, de quebra,
 * prova que o núcleo puro e os providers encaixam antes de escrever a Fase 4.
 */
async function medirQualidade(extrator: Extrator, pontuador: Pontuador | null): Promise<Qualidade> {
  const t0 = performance.now()
  passo('Construindo o grafo do seed com os modelos de verdade…')

  const nos: NoDoGrafo[] = []
  for (const n of SEED_NEURONIOS) {
    const texto = textoDoNeuronio(n)
    const saida = await extrator(PREFIXO_E5 + texto, { pooling: 'mean', normalize: true })
    nos.push({
      id: n.id,
      livroId: n.livroId,
      texto,
      embedding: Float32Array.from(saida.data as Float32Array),
    })
  }

  const pontuar: PontuarPar = pontuador
    ? async (a, b) => pontuador(a.texto, b.texto)
    : () => Promise.resolve(null)

  const perfil = perfilDoPalacio(nos)
  const arestas = await construirGrafo(nos, pontuar, OPCOES_PADRAO, perfil)

  const titulo = new Map(SEED_NEURONIOS.map((n) => [n.id, n.titulo]))
  const livroDoNeuronio = new Map(SEED_NEURONIOS.map((n) => [n.id, n.livroId]))
  const nomeLivro = new Map(SEED_LIVROS.map((l) => [l.id, l.titulo]))
  const nomeDoLivroDe = (id: string): string => nomeLivro.get(livroDoNeuronio.get(id) ?? '') ?? '?'

  const comAresta = new Set(arestas.flatMap((a) => [a.aId, a.bId]))

  // Diagnóstico de calibração: todo par, bruto e centralizado.
  const centrados = nos.map((n) => centralizar(n.embedding, perfil.centroide))
  const pares: ParDiagnostico[] = []
  for (let i = 0; i < nos.length; i++) {
    for (let j = i + 1; j < nos.length; j++) {
      pares.push({
        a: titulo.get(nos[i]!.id) ?? '',
        b: titulo.get(nos[j]!.id) ?? '',
        cross: nos[i]!.livroId !== nos[j]!.livroId,
        cosBruto: produtoInterno(nos[i]!.embedding, nos[j]!.embedding),
        cosCentralizado: produtoInterno(centrados[i]!, centrados[j]!),
      })
    }
  }

  const topN = 6
  return {
    msTotal: performance.now() - t0,
    escalaEmb: perfil.escalaEmb,
    orfaos: SEED_NEURONIOS.filter((n) => !comAresta.has(n.id)).map((n) => n.titulo),
    topBruto: [...pares].sort((x, y) => y.cosBruto - x.cosBruto).slice(0, topN),
    topCentralizado: [...pares]
      .sort((x, y) => y.cosCentralizado - x.cosCentralizado)
      .slice(0, topN),
    distribuicaoBruto: distribuir(pares.map((p) => p.cosBruto)),
    distribuicaoCentralizado: distribuir(pares.map((p) => p.cosCentralizado)),
    arestas: arestas.map((a) => ({
      a: titulo.get(a.aId) ?? a.aId,
      b: titulo.get(a.bId) ?? a.bId,
      livroA: nomeDoLivroDe(a.aId),
      livroB: nomeDoLivroDe(a.bId),
      cross: a.cross,
      emb: a.emb,
      rr: a.rr,
      score: a.score,
    })),
  }
}

async function rodar(opcoes: OpcoesSpike): Promise<ResultadoSpike> {
  const inicio = performance.now()
  const ambiente = await lerAmbiente()

  const { resultado: embedding, extrator } = await medirEmbedding(opcoes)

  let reranker: ResultadoReranker | null = null
  let rerankerErro: string | null = null
  let pontuador: Pontuador | null = null
  if (opcoes.comReranker) {
    try {
      const r = await medirReranker(opcoes)
      reranker = r.resultado
      pontuador = r.pontuador
    } catch (e) {
      rerankerErro = e instanceof Error ? e.message : String(e)
      passo(`Reranker falhou: ${rerankerErro}`)
    }
  }

  const qualidade = opcoes.medirQualidade ? await medirQualidade(extrator, pontuador) : null

  const msEmbedding = embedding.curto.mediana
  const msPar = reranker?.porPar.mediana ?? 0
  const criarNeuronioMs = msEmbedding + OPCOES_PADRAO.candK * msPar

  return {
    quando: new Date().toISOString(),
    ambiente,
    embedding,
    reranker,
    rerankerErro,
    cenario: {
      criarNeuronioMs,
      tamanhoPalacio: opcoes.tamanhoPalacio,
      // Reprocessar tudo: um embedding por neurônio e um par por candidato.
      reprocessarTudoMs:
        opcoes.tamanhoPalacio * msEmbedding +
        ((opcoes.tamanhoPalacio * OPCOES_PADRAO.candK) / 2) * msPar,
    },
    qualidade,
    memoria: null,
    totalMs: performance.now() - inicio,
  }
}

escopo.addEventListener('message', (evento: MessageEvent<MensagemParaWorker>) => {
  const msg = evento.data

  if (msg.tipo === 'limparCache') {
    void (async () => {
      try {
        const chaves = await caches.keys()
        await Promise.all(
          chaves.filter((c) => c.includes('transformers')).map((c) => caches.delete(c)),
        )
        avisar({ tipo: 'cacheLimpo', chaves })
      } catch (e) {
        avisar({ tipo: 'erro', mensagem: e instanceof Error ? e.message : String(e) })
      }
    })()
    return
  }

  void (async () => {
    try {
      avisar({ tipo: 'pronto', resultado: await rodar(msg.opcoes) })
    } catch (e) {
      avisar({
        tipo: 'erro',
        mensagem: e instanceof Error ? `${e.message}\n${e.stack ?? ''}` : String(e),
      })
    }
  })()
})
