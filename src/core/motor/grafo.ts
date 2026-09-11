import { conexaoId } from '../domain/conexaoId'
import type { Conexao, Id, Neuronio } from '../domain/types'

import { OPCOES_PADRAO, type OpcoesMotor } from './config'
import { escalaEmbedding, fundir } from './fusao'
import { centralizar, centroide, produtoInterno } from './vetores'

/** O que o motor precisa saber de um neurônio. Nada além disso. */
export interface NoDoGrafo {
  id: Id
  livroId: Id
  /** Título e conteúdo juntos — é o que o reranker lê. */
  texto: string
  /** Vetor normalizado, ainda **não** centralizado. */
  embedding: Float32Array
}

export interface ArestaCalculada {
  aId: Id
  bId: Id
  score: number
  emb: number
  rr: number | null
  cross: boolean
  /** O lado `aId` mantém esta aresta na sua vizinhança. */
  mantidaPorA: boolean
  /** O lado `bId` mantém esta aresta na sua vizinhança. */
  mantidaPorB: boolean
}

/**
 * Pontua um par com o reranker. Devolve `null` quando o reranker não está
 * disponível — o motor então roda só com o embedding, em vez de falhar.
 *
 * Recebe os nós inteiros (e não só os textos) para que o adapter possa cachear
 * por id: numa recontagem, um par já pontuado não precisa passar pelo modelo.
 */
export type PontuarPar = (a: NoDoGrafo, b: NoDoGrafo) => Promise<number | null>

export const SEM_RERANK: PontuarPar = () => Promise.resolve(null)

// --- conversões -------------------------------------------------------------

/**
 * Texto canônico de um neurônio.
 *
 * O prefixo que o e5 exige NÃO entra aqui: ele é detalhe daquele modelo e mora
 * no adapter de embedding, não no algoritmo.
 */
export function textoDoNeuronio(n: Pick<Neuronio, 'titulo' | 'conteudo'>): string {
  const titulo = n.titulo.trim()
  const conteudo = n.conteudo.trim()
  return conteudo ? `${titulo}. ${conteudo}` : titulo
}

/** `null` para neurônio ainda sem embedding — ele fica de fora do grafo. */
export function neuronioParaNo(n: Neuronio): NoDoGrafo | null {
  if (!n.embedding) return null
  return { id: n.id, livroId: n.livroId, texto: textoDoNeuronio(n), embedding: n.embedding }
}

export function nosDeNeuronios(neuronios: readonly Neuronio[]): NoDoGrafo[] {
  return neuronios.map(neuronioParaNo).filter((n): n is NoDoGrafo => n !== null)
}

export function arestaParaConexao(a: ArestaCalculada, agora: Date): Conexao {
  return {
    id: conexaoId(a.aId, a.bId),
    aId: a.aId,
    bId: a.bId,
    score: a.score,
    emb: a.emb,
    rr: a.rr,
    cross: a.cross,
    mantidaPorA: a.mantidaPorA,
    mantidaPorB: a.mantidaPorB,
    updatedAt: agora,
  }
}

export function centroideDeNos(nos: readonly NoDoGrafo[]): Float32Array {
  return centroide(nos.map((n) => n.embedding))
}

/**
 * O estado derivado que só o grafo inteiro sabe calcular.
 *
 * - `centroide`: fica congelado entre reprocessamentos, senão cada inserção
 *   deslocaria todos os vetores centralizados e o grafo inteiro tremeria.
 * - `limiarPorNo`: o cosseno do último candidato que coube na lista de cada nó.
 *   É o que permite descobrir, em uma passada, quem consideraria o recém-chegado
 *   um vizinho — sem recalcular o ranking de todo mundo.
 * - `escalaEmb`: o divisor da escala do embedding, derivado do próprio corpus —
 *   ver `escalaDoCorpus`.
 */
export interface PerfilDoPalacio {
  centroide: Float32Array
  limiarPorNo: ReadonlyMap<Id, number>
  escalaEmb: number
}

export function perfilDoPalacio(
  nos: readonly NoDoGrafo[],
  opcoes: OpcoesMotor = OPCOES_PADRAO,
  centro: Float32Array = centroideDeNos(nos),
): PerfilDoPalacio {
  const n = nos.length
  const centrados = nos.map((no) => centralizar(no.embedding, centro))
  const limiarPorNo = new Map<Id, number>()
  const melhores: number[] = []
  const k = Math.max(1, Math.min(opcoes.candK, n - 1))

  for (let i = 0; i < n; i++) {
    const cossenos: number[] = []
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      cossenos.push(produtoInterno(centrados[i]!, centrados[j]!))
    }
    cossenos.sort((a, b) => b - a)
    limiarPorNo.set(nos[i]!.id, cossenos[k - 1] ?? Number.NEGATIVE_INFINITY)
    if (cossenos.length > 0) melhores.push(cossenos[0]!)
  }

  return { centroide: centro, limiarPorNo, escalaEmb: escalaDoCorpus(melhores, opcoes) }
}

/**
 * O divisor da escala do embedding, tirado do próprio corpus.
 *
 * Percentil 90 do melhor cosseno de cada nó. Não o máximo — um único par de
 * textos quase idênticos não pode achatar a escala do palácio inteiro. Não a
 * mediana — aí metade dos nós teria a melhor conexão saturada em 1, e a UI
 * perderia a diferença entre uma conexão boa e uma excepcional.
 *
 * Por que derivado e não constante: o spike da Fase 3 mediu cosseno centralizado
 * máximo de 0,070 num palácio de 9 neurônios, contra o 0,45 fixo que o plano
 * previa — o voto do embedding saía zerado. E o valor certo depende do tamanho
 * do corpus, porque o centroide se afasta dos vetores conforme eles aumentam.
 *
 * Isto **não** muda quais arestas existem: sem reranker a seleção é por corte
 * relativo, invariante a escala. Muda o que o score significa, que é o que a UI
 * vai desenhar como conexão forte ou fraca.
 */
function escalaDoCorpus(melhoresCossenos: readonly number[], opcoes: OpcoesMotor): number {
  if (melhoresCossenos.length === 0) return opcoes.escalaEmbMinima

  const ordenado = [...melhoresCossenos].sort((a, b) => a - b)
  const p90 = ordenado[Math.min(ordenado.length - 1, Math.floor(0.9 * ordenado.length))] ?? 0

  return Math.max(p90, opcoes.escalaEmbMinima)
}

// --- pipeline ---------------------------------------------------------------

interface DadosDoPar {
  cos: number
  emb: number
  rr: number | null
  score: number
}

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Chave numérica do par não-ordenado, para não alocar strings no laço quente. */
function chavePar(i: number, j: number, n: number): number {
  return i < j ? i * n + j : j * n + i
}

/**
 * Passo 3 — para cada nó, os `candK` mais próximos por cosseno centralizado.
 * Empate resolvido por id para que o resultado não dependa da ordem de entrada.
 */
function candidatosPorNo(
  nos: readonly NoDoGrafo[],
  centrados: readonly Float32Array[],
  opcoes: OpcoesMotor,
): number[][] {
  const n = nos.length
  const k = Math.max(1, Math.min(opcoes.candK, n - 1))
  const saida: number[][] = []

  for (let i = 0; i < n; i++) {
    const linha: { j: number; cos: number }[] = []
    for (let j = 0; j < n; j++) {
      if (i === j) continue
      linha.push({ j, cos: produtoInterno(centrados[i]!, centrados[j]!) })
    }
    linha.sort((x, y) => y.cos - x.cos || comparar(nos[x.j]!.id, nos[y.j]!.id))
    saida.push(linha.slice(0, k).map((e) => e.j))
  }

  return saida
}

function paresUnicos(candidatos: readonly number[][], n: number): Map<number, [number, number]> {
  const pares = new Map<number, [number, number]>()
  for (let i = 0; i < candidatos.length; i++) {
    for (const j of candidatos[i]!) {
      const chave = chavePar(i, j, n)
      if (!pares.has(chave)) pares.set(chave, i < j ? [i, j] : [j, i])
    }
  }
  return pares
}

/** Passos 4 e 5 — reranker e fusão, um par por vez (o modelo é um só). */
async function pontuarPares(
  nos: readonly NoDoGrafo[],
  centrados: readonly Float32Array[],
  pares: ReadonlyMap<number, [number, number]>,
  pontuar: PontuarPar,
  opcoes: OpcoesMotor,
  escalaEmb: number,
): Promise<Map<number, DadosDoPar>> {
  const dados = new Map<number, DadosDoPar>()

  for (const [chave, [i, j]] of pares) {
    const cos = produtoInterno(centrados[i]!, centrados[j]!)
    const emb = escalaEmbedding(cos, escalaEmb)
    const rr = await pontuar(nos[i]!, nos[j]!)
    dados.set(chave, { cos, emb, rr, score: fundir(emb, rr, opcoes.pesoEmb) })
  }

  return dados
}

/**
 * Passo 6 — o que cada nó mantém: o prefixo do seu ranking que passa do corte,
 * limitado a `maxVizinhos` e nunca menor que `minVizinhos`.
 *
 * Quando o melhor score do nó é zero (nada se parece com ele), o corte relativo
 * não significa nada — aí vale só o mínimo, e ele fica com o vizinho menos ruim
 * em vez de com seis.
 */
function mantidosPorNo(
  nos: readonly NoDoGrafo[],
  candidatos: readonly number[][],
  dados: ReadonlyMap<number, DadosDoPar>,
  n: number,
  opcoes: OpcoesMotor,
): Set<number>[] {
  return candidatos.map((vizinhos, i) => {
    const scoreDe = (j: number): number => dados.get(chavePar(i, j, n))!.score

    // Empate desempatado por id, igual ao caminho incremental: com a escala
    // derivada do corpus vários pares saturam em 1, e ordem de array não é ordem.
    const ordenados = [...vizinhos].sort(
      (x, y) => scoreDe(y) - scoreDe(x) || comparar(nos[x]!.id, nos[y]!.id),
    )
    const melhor = ordenados.length > 0 ? scoreDe(ordenados[0]!) : 0
    const limite = melhor > 0 ? opcoes.razaoCorte * melhor : Number.POSITIVE_INFINITY

    const abaixo = ordenados.findIndex((j) => scoreDe(j) < limite)
    let quantos = abaixo === -1 ? ordenados.length : abaixo
    quantos = Math.max(quantos, opcoes.minVizinhos)
    quantos = Math.min(quantos, opcoes.maxVizinhos, ordenados.length)

    return new Set(ordenados.slice(0, quantos))
  })
}

/** Passo 6 (fim) e 7 — a aresta existe se qualquer um dos dois lados a mantém. */
function montarArestas(
  nos: readonly NoDoGrafo[],
  pares: ReadonlyMap<number, [number, number]>,
  dados: ReadonlyMap<number, DadosDoPar>,
  mantidos: readonly Set<number>[],
): ArestaCalculada[] {
  const arestas: ArestaCalculada[] = []

  for (const [chave, [i, j]] of pares) {
    const iMantem = mantidos[i]!.has(j)
    const jMantem = mantidos[j]!.has(i)
    if (!iMantem && !jMantem) continue

    const d = dados.get(chave)!
    const iEhLadoA = comparar(nos[i]!.id, nos[j]!.id) < 0
    const a = iEhLadoA ? i : j
    const b = iEhLadoA ? j : i

    arestas.push({
      aId: nos[a]!.id,
      bId: nos[b]!.id,
      score: d.score,
      emb: d.emb,
      rr: d.rr,
      cross: nos[a]!.livroId !== nos[b]!.livroId,
      mantidaPorA: iEhLadoA ? iMantem : jMantem,
      mantidaPorB: iEhLadoA ? jMantem : iMantem,
    })
  }

  arestas.sort((x, y) => y.score - x.score || comparar(x.aId, y.aId) || comparar(x.bId, y.bId))
  return arestas
}

/**
 * O grafo inteiro, exato.
 *
 * `perfil` é parâmetro de propósito: passar o perfil do último reprocessamento é
 * o que faz valer a promessa "adicionar um neurônio não mexe nas conexões dos
 * outros". Se o centroide fosse recalculado a cada inserção, todo vetor
 * centralizado mudaria um pouco e o grafo inteiro tremeria.
 */
export async function construirGrafo(
  nos: readonly NoDoGrafo[],
  pontuar: PontuarPar = SEM_RERANK,
  opcoes: OpcoesMotor = OPCOES_PADRAO,
  perfil: PerfilDoPalacio = perfilDoPalacio(nos, opcoes),
): Promise<ArestaCalculada[]> {
  if (nos.length < 2) return []

  const centrados = nos.map((no) => centralizar(no.embedding, perfil.centroide))
  const candidatos = candidatosPorNo(nos, centrados, opcoes)
  const pares = paresUnicos(candidatos, nos.length)
  const dados = await pontuarPares(nos, centrados, pares, pontuar, opcoes, perfil.escalaEmb)
  const mantidos = mantidosPorNo(nos, candidatos, dados, nos.length, opcoes)

  return montarArestas(nos, pares, dados, mantidos)
}
