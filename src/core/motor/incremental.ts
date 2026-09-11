import type { Conexao, Id } from '../domain/types'

import { OPCOES_PADRAO, type OpcoesMotor } from './config'
import { escalaEmbedding, fundir } from './fusao'
import {
  SEM_RERANK,
  type ArestaCalculada,
  type NoDoGrafo,
  type PerfilDoPalacio,
  type PontuarPar,
} from './grafo'
import { centralizar, produtoInterno } from './vetores'

/** Uma aresta do ponto de vista do nó que a mantém. */
export interface ArestaMantida {
  outroId: Id
  score: number
}

/** O que cada nó mantém hoje, em ordem decrescente de score. */
export type EstadoDosNos = ReadonlyMap<Id, readonly ArestaMantida[]>

/**
 * Reconstrói, a partir das conexões gravadas, o que cada nó mantém.
 *
 * É para isso que a aresta guarda `mantidaPorA` e `mantidaPorB`: sem esses
 * flags, uma aresta que só o vizinho quer entraria na conta como se fosse do nó,
 * inflando o melhor score dele e fazendo o corte relativo recusar vizinhos
 * legítimos.
 */
export function estadoDosVizinhos(conexoes: readonly Conexao[]): Map<Id, ArestaMantida[]> {
  const estado = new Map<Id, ArestaMantida[]>()

  const empurrar = (no: Id, outroId: Id, score: number): void => {
    const lista = estado.get(no)
    if (lista) lista.push({ outroId, score })
    else estado.set(no, [{ outroId, score }])
  }

  for (const c of conexoes) {
    if (c.mantidaPorA) empurrar(c.aId, c.bId, c.score)
    if (c.mantidaPorB) empurrar(c.bId, c.aId, c.score)
  }

  for (const lista of estado.values()) lista.sort((x, y) => y.score - x.score)
  return estado
}

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

interface Candidato {
  j: number
  cos: number
  emb: number
  rr: number | null
  score: number
  /** O par entrou porque está no top-K do alvo (e não só porque o vizinho o aceitaria). */
  noTopDoAlvo: boolean
}

/** Uma aresta que não toca o alvo e que um dos lados deixou de sustentar. */
export interface MarcaPerdida {
  noId: Id
  outroId: Id
}

export interface ResultadoIncremental {
  /** Arestas que tocam o alvo, prontas para substituir as antigas dele. */
  arestas: ArestaCalculada[]
  /**
   * Efeito colateral legítimo: ao entrar numa vizinhança, o alvo pode empurrar
   * para fora o último vizinho daquele nó — ou, se chegar muito mais perto que
   * todos, levantar o corte e empurrar vários. Essas arestas não tocam o alvo,
   * então quem grava precisa saber delas por fora.
   */
  marcasPerdidas: MarcaPerdida[]
}

/**
 * Recalcula só a vizinhança de um neurônio — o caminho de criar e editar.
 *
 * Custa uma passada de cosseno sobre todos os nós e algumas chamadas do
 * reranker, contra `N * candK` chamadas do grafo inteiro.
 *
 * Os candidatos vêm de dois lados, e os dois importam:
 *
 * - o top-K do próprio alvo;
 * - todo nó cujo limiar o alvo supera, isto é, quem *o consideraria* vizinho.
 *   Sem essa segunda metade, um nó de região esparsa que escolhesse o alvo
 *   ficaria sem a aresta, porque o alvo não o escolheu de volta.
 *
 * O resultado é igual ao que `construirGrafo` produziria para as arestas que
 * tocam o alvo — desde que `marcasPerdidas` também seja aplicado.
 */
export async function recalcularVizinhanca(
  alvoId: Id,
  nos: readonly NoDoGrafo[],
  estado: EstadoDosNos,
  perfil: PerfilDoPalacio,
  pontuar: PontuarPar = SEM_RERANK,
  opcoes: OpcoesMotor = OPCOES_PADRAO,
): Promise<ResultadoIncremental> {
  const alvoIdx = nos.findIndex((n) => n.id === alvoId)
  if (alvoIdx === -1) throw new Error(`neurônio ${alvoId} não está na lista de nós`)
  if (nos.length < 2) return { arestas: [], marcasPerdidas: [] }

  const centrados = nos.map((no) => centralizar(no.embedding, perfil.centroide))
  const alvo = nos[alvoIdx]!
  const centradoAlvo = centrados[alvoIdx]!

  const cossenos = nos.map((_, j) => produtoInterno(centradoAlvo, centrados[j]!))
  const k = Math.max(1, Math.min(opcoes.candK, nos.length - 1))

  const topDoAlvo = new Set(
    nos
      .map((_, j) => j)
      .filter((j) => j !== alvoIdx)
      .sort((x, y) => cossenos[y]! - cossenos[x]! || comparar(nos[x]!.id, nos[y]!.id))
      .slice(0, k),
  )

  const reciprocos = nos
    .map((_, j) => j)
    .filter((j) => j !== alvoIdx && !topDoAlvo.has(j))
    .filter((j) => cossenos[j]! >= (perfil.limiarPorNo.get(nos[j]!.id) ?? Number.POSITIVE_INFINITY))

  const candidatos: Candidato[] = []
  for (const j of [...topDoAlvo, ...reciprocos]) {
    const cos = cossenos[j]!
    const emb = escalaEmbedding(cos, perfil.escalaEmb)
    const rr = await pontuar(alvo, nos[j]!)
    candidatos.push({
      j,
      cos,
      emb,
      rr,
      score: fundir(emb, rr, opcoes.pesoEmb),
      noTopDoAlvo: topDoAlvo.has(j),
    })
  }

  const mantidosPeloAlvo = escolherMantidos(
    candidatos.filter((c) => c.noTopDoAlvo),
    nos,
    opcoes,
  )

  const arestas: ArestaCalculada[] = []
  const marcasPerdidas: MarcaPerdida[] = []

  for (const c of candidatos) {
    const vizinho = nos[c.j]!
    const jaMantidas = (estado.get(vizinho.id) ?? []).filter((m) => m.outroId !== alvoId)
    const novaLista = listaDoVizinhoCom(jaMantidas, alvoId, c.score, opcoes)

    for (const m of jaMantidas) {
      if (!novaLista.has(m.outroId)) marcasPerdidas.push({ noId: vizinho.id, outroId: m.outroId })
    }

    const alvoMantem = mantidosPeloAlvo.has(c.j)
    const vizinhoMantem = novaLista.has(alvoId)
    if (!alvoMantem && !vizinhoMantem) continue

    const alvoEhLadoA = comparar(alvo.id, vizinho.id) < 0
    arestas.push({
      aId: alvoEhLadoA ? alvo.id : vizinho.id,
      bId: alvoEhLadoA ? vizinho.id : alvo.id,
      score: c.score,
      emb: c.emb,
      rr: c.rr,
      cross: alvo.livroId !== vizinho.livroId,
      mantidaPorA: alvoEhLadoA ? alvoMantem : vizinhoMantem,
      mantidaPorB: alvoEhLadoA ? vizinhoMantem : alvoMantem,
    })
  }

  arestas.sort((x, y) => y.score - x.score || comparar(x.aId, y.aId) || comparar(x.bId, y.bId))
  return { arestas, marcasPerdidas }
}

/**
 * Aplica um recálculo incremental sobre o grafo que já existia.
 *
 * Mora aqui, e não no repositório, porque é regra do algoritmo: a aresta some
 * quando nenhum dos dois lados a sustenta mais. O repositório só executa.
 */
export function aplicarIncremental(
  antes: readonly ArestaCalculada[],
  alvoId: Id,
  resultado: ResultadoIncremental,
): ArestaCalculada[] {
  const perdidas = new Set(resultado.marcasPerdidas.map((m) => `${m.noId}::${m.outroId}`))

  const sobreviventes = antes
    .filter((a) => a.aId !== alvoId && a.bId !== alvoId)
    .map((a) => ({
      ...a,
      mantidaPorA: a.mantidaPorA && !perdidas.has(`${a.aId}::${a.bId}`),
      mantidaPorB: a.mantidaPorB && !perdidas.has(`${a.bId}::${a.aId}`),
    }))
    .filter((a) => a.mantidaPorA || a.mantidaPorB)

  return [...sobreviventes, ...resultado.arestas].sort(
    (x, y) => y.score - x.score || comparar(x.aId, y.aId) || comparar(x.bId, y.bId),
  )
}

/** A mesma regra do grafo inteiro: prefixo que passa do corte, entre o mínimo e o teto. */
function escolherMantidos(
  candidatos: readonly Candidato[],
  nos: readonly NoDoGrafo[],
  opcoes: OpcoesMotor,
): Set<number> {
  const ordenados = [...candidatos].sort(
    (x, y) => y.score - x.score || comparar(nos[x.j]!.id, nos[y.j]!.id),
  )

  const melhor = ordenados[0]?.score ?? 0
  const limite = melhor > 0 ? opcoes.razaoCorte * melhor : Number.POSITIVE_INFINITY

  const abaixo = ordenados.findIndex((c) => c.score < limite)
  let quantos = abaixo === -1 ? ordenados.length : abaixo
  quantos = Math.max(quantos, opcoes.minVizinhos)
  quantos = Math.min(quantos, opcoes.maxVizinhos, ordenados.length)

  return new Set(ordenados.slice(0, quantos).map((c) => c.j))
}

/**
 * Como fica a lista do vizinho depois que o alvo se apresenta.
 *
 * Dá para responder sem recalcular o vizinho inteiro porque o que ele já mantém
 * é, por construção, o topo do ranking dele: basta reinserir o alvo na ordem e
 * reaplicar o corte. Um alvo que chega muito mais perto que todos levanta o
 * corte e derruba vários de uma vez — daí as marcas perdidas.
 */
function listaDoVizinhoCom(
  jaMantidas: readonly ArestaMantida[],
  alvoId: Id,
  scoreDoAlvo: number,
  opcoes: OpcoesMotor,
): Set<Id> {
  const todas = [...jaMantidas, { outroId: alvoId, score: scoreDoAlvo }].sort(
    (x, y) => y.score - x.score || comparar(x.outroId, y.outroId),
  )

  const melhor = todas[0]?.score ?? 0
  const limite = melhor > 0 ? opcoes.razaoCorte * melhor : Number.POSITIVE_INFINITY

  const abaixo = todas.findIndex((m) => m.score < limite)
  let quantos = abaixo === -1 ? todas.length : abaixo
  quantos = Math.max(quantos, opcoes.minVizinhos)
  quantos = Math.min(quantos, opcoes.maxVizinhos, todas.length)

  return new Set(todas.slice(0, quantos).map((m) => m.outroId))
}
