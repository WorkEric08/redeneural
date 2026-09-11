/**
 * Protocolo entre a página do spike e o worker que carrega os modelos.
 *
 * O spike é deliberadamente separado do app: ele existe para produzir números
 * num aparelho de verdade e decidir se o reranker entra no produto. Nada aqui é
 * importado pelo app, e o bundle dele não vai para o precache do service worker.
 */

export interface OpcoesSpike {
  comReranker: boolean
  /** Quantos textos passar pelo embedding para medir o regime estável. */
  repeticoesEmbedding: number
  /** Quantos pares passar pelo reranker. */
  paresReranker: number
  /** Tamanho de palácio a projetar no cenário de reprocessamento. */
  tamanhoPalacio: number
  /** Rodar o núcleo de verdade sobre o seed e mostrar as conexões que saem. */
  medirQualidade: boolean
}

export const OPCOES_SPIKE_PADRAO: OpcoesSpike = {
  comReranker: true,
  repeticoesEmbedding: 12,
  paresReranker: 12,
  tamanhoPalacio: 300,
  medirQualidade: true,
}

export interface Medicao {
  amostras: number[]
  mediana: number
  p95: number
  min: number
  max: number
}

export interface CargaDeModelo {
  modelo: string
  dtype: string
  /** Tempo de parede do `from_pretrained`, incluindo rede quando não há cache. */
  ms: number
  /**
   * Bytes vistos pelo `progress_callback`. **Não** distingue rede de cache: o
   * transformers.js emite progresso nos dois casos.
   */
  bytesLidos: number
  arquivos: number
  /** Os pesos já estavam no cache do navegador antes desta carga? */
  cacheadoAntes: boolean
  /**
   * E depois? `false` aqui após uma carga significa que o navegador **recusou**
   * guardar o arquivo — ele vai ser rebaixado a cada início a frio.
   */
  cacheadoDepois: boolean
}

export interface ResultadoEmbedding {
  carga: CargaDeModelo
  dim: number
  /** A primeira inferência paga o aquecimento do grafo — é sempre a mais cara. */
  primeiraMs: number
  curto: Medicao
  longo: Medicao
}

export interface ResultadoReranker {
  carga: CargaDeModelo
  primeiraMs: number
  porPar: Medicao
  exemploScore: number
}

export interface Ambiente {
  userAgent: string
  nucleos: number
  memoriaGb: number | null
  crossOriginIsolated: boolean
  webgpu: boolean
  contextoSeguro: boolean
  cacheDisponivel: boolean
  threadsWasm: number | null
}

export interface Cenario {
  /** Criar um neurônio: 1 embedding + candK pares no reranker. */
  criarNeuronioMs: number
  /** Reprocessar tudo num palácio deste tamanho. */
  tamanhoPalacio: number
  reprocessarTudoMs: number
}

export interface Memoria {
  antesMb: number
  picoMb: number
  depoisMb: number
}

/**
 * O grafo que os modelos de verdade produzem sobre os neurônios do seed.
 *
 * Velocidade não decide sozinha: se as conexões forem ruins, o reranker não vale
 * o custo nem que fosse instantâneo. Isto roda o núcleo da Fase 2 com os
 * providers da Fase 4 — e é também a prova de que os dois encaixam.
 */
export interface ArestaDoSeed {
  a: string
  b: string
  livroA: string
  livroB: string
  cross: boolean
  emb: number
  rr: number | null
  score: number
}

export interface ParDiagnostico {
  a: string
  b: string
  cross: boolean
  cosBruto: number
  cosCentralizado: number
}

export interface Distribuicao {
  p50: number
  p90: number
  p99: number
  max: number
}

export interface Qualidade {
  arestas: ArestaDoSeed[]
  orfaos: string[]
  /**
   * Os melhores pares por cosseno bruto e por cosseno centralizado.
   * Se as duas listas discordarem muito, a centralização está atrapalhando em
   * vez de ajudar neste tamanho de corpus.
   */
  topBruto: ParDiagnostico[]
  topCentralizado: ParDiagnostico[]
  /** O divisor que o núcleo derivou deste corpus. */
  escalaEmb: number
  /** Para conferir a calibração: o divisor tem que ficar perto do topo real. */
  distribuicaoBruto: Distribuicao
  distribuicaoCentralizado: Distribuicao
  msTotal: number
}

export function distribuir(valores: number[]): Distribuicao {
  const o = [...valores].sort((a, b) => a - b)
  const em = (q: number): number => o[Math.min(o.length - 1, Math.floor(q * o.length))] ?? 0
  return { p50: em(0.5), p90: em(0.9), p99: em(0.99), max: o[o.length - 1] ?? 0 }
}

export interface ResultadoSpike {
  quando: string
  ambiente: Ambiente
  embedding: ResultadoEmbedding
  reranker: ResultadoReranker | null
  rerankerErro: string | null
  cenario: Cenario
  qualidade: Qualidade | null
  memoria: Memoria | null
  totalMs: number
}

export type MensagemParaWorker = { tipo: 'rodar'; opcoes: OpcoesSpike } | { tipo: 'limparCache' }

export type MensagemDoWorker =
  | { tipo: 'passo'; texto: string }
  | { tipo: 'progresso'; arquivo: string; pct: number }
  | { tipo: 'pronto'; resultado: ResultadoSpike }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'cacheLimpo'; chaves: string[] }

export function medir(amostras: number[]): Medicao {
  const ordenado = [...amostras].sort((a, b) => a - b)
  const em = (q: number): number =>
    ordenado[Math.min(ordenado.length - 1, Math.floor(q * ordenado.length))] ?? 0

  return {
    amostras,
    mediana: em(0.5),
    p95: em(0.95),
    min: ordenado[0] ?? 0,
    max: ordenado[ordenado.length - 1] ?? 0,
  }
}
