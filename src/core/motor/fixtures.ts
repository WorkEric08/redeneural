/**
 * Embeddings falsos para os testes do motor — vetores fixos, nenhum modelo
 * carregado. Fica dentro de `core` porque é TypeScript puro como o resto, e
 * nenhum código de aplicação importa daqui.
 *
 * A geometria imita o que um encoder produz: um conceito central com vários
 * conceitos que se parecem com ele mas não entre si (a estrela), um par quase
 * idêntico, e um conceito solto sem parente nenhum.
 */
import type { ArestaCalculada, NoDoGrafo } from './grafo'
import { normalizar } from './vetores'

export const DIM = 16

export function vetor(pares: Record<number, number>): Float32Array {
  const v = new Float32Array(DIM)
  for (const [i, x] of Object.entries(pares)) v[Number(i)] = x
  return normalizar(v)
}

export function no(id: string, livroId: string, pares: Record<number, number>): NoDoGrafo {
  return { id, livroId, texto: id, embedding: vetor(pares) }
}

/** Um centro e `qtd` satélites que só se parecem com o centro. */
export function estrela(prefixo: string, livroId: string, qtd: number, base: number): NoDoGrafo[] {
  const nos = [no(`${prefixo}-hub`, livroId, { [base]: 1 })]
  for (let k = 1; k <= qtd; k++) {
    nos.push(no(`${prefixo}-s${k}`, livroId, { [base]: 1, [base + k]: 1.4 }))
  }
  return nos
}

export const PALACIO: NoDoGrafo[] = [
  ...estrela('psi', 'psi', 6, 0),
  no('prog-p1', 'prog', { 9: 1, 10: 0.3 }),
  no('prog-p2', 'prog', { 9: 1, 10: -0.3 }),
  no('mus-iso', 'mus', { 13: 1 }),
]

/** O mesmo palácio, com a estrela mais povoada que o teto de vizinhos. */
export const PALACIO_GRANDE: NoDoGrafo[] = [
  ...estrela('psi', 'psi', 8, 0),
  no('prog-p1', 'prog', { 10: 1, 11: 0.3 }),
  no('prog-p2', 'prog', { 10: 1, 11: -0.3 }),
  no('mus-iso', 'mus', { 14: 1 }),
]

export const HUB = 'psi-hub'
export const PERIFERICO = 'psi-s1'

// --- leitura de resultado ---------------------------------------------------

export function grausDe(arestas: readonly ArestaCalculada[]): Map<string, number> {
  const grau = new Map<string, number>()
  for (const a of arestas) {
    grau.set(a.aId, (grau.get(a.aId) ?? 0) + 1)
    grau.set(a.bId, (grau.get(a.bId) ?? 0) + 1)
  }
  return grau
}

export function mantidasPorNo(arestas: readonly ArestaCalculada[]): Map<string, number> {
  const conta = new Map<string, number>()
  for (const a of arestas) {
    if (a.mantidaPorA) conta.set(a.aId, (conta.get(a.aId) ?? 0) + 1)
    if (a.mantidaPorB) conta.set(a.bId, (conta.get(a.bId) ?? 0) + 1)
  }
  return conta
}

export function porPar(arestas: readonly ArestaCalculada[]): Map<string, ArestaCalculada> {
  return new Map(arestas.map((a) => [`${a.aId}::${a.bId}`, a]))
}

export function vizinhosDe(arestas: readonly ArestaCalculada[], id: string): string[] {
  return arestas
    .filter((a) => a.aId === id || a.bId === id)
    .map((a) => (a.aId === id ? a.bId : a.aId))
    .sort()
}
