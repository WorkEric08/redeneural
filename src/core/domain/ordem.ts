import type { Id } from './types'

/**
 * A ordem da estante, como lista de ids do primeiro ao último livro.
 *
 * Puras de propósito: a store usa para mostrar a troca antes de o banco
 * confirmar, e o worker usa para gravar — os dois precisam chegar exatamente na
 * mesma lista, ou a estante pisca para um lado e volta para o outro.
 */

/** Os dois livros trocam de lugar; nenhum outro se mexe. */
export function trocarNaOrdem(ids: readonly Id[], a: Id, b: Id): Id[] {
  const i = ids.indexOf(a)
  const j = ids.indexOf(b)
  const nova = [...ids]
  if (i === -1 || j === -1 || i === j) return nova

  nova[i] = b
  nova[j] = a
  return nova
}

/**
 * Põe `id` na posição pedida e empurra quem estava dali em diante. Uma posição
 * fora da estante vai para a ponta mais próxima, em vez de abrir buraco.
 */
export function inserirNaOrdem(ids: readonly Id[], id: Id, posicao: number): Id[] {
  const sem = ids.filter((x) => x !== id)
  const onde = Math.min(Math.max(0, Math.trunc(posicao)), sem.length)
  return [...sem.slice(0, onde), id, ...sem.slice(onde)]
}

/**
 * Reescreve `ordem` a partir da lista: cada livro passa a valer o próprio
 * índice. Quem não está na lista vai para o fim, na ordem em que já estava —
 * perder um livro da estante por causa de uma lista incompleta seria pior do
 * que deixá-lo no fim.
 */
export function aplicarOrdem<T extends { id: Id; ordem: number }>(
  livros: readonly T[],
  ids: readonly Id[],
): T[] {
  const posicao = new Map(ids.map((id, i) => [id, i]))
  const dentro = livros.filter((l) => posicao.has(l.id))
  const fora = livros.filter((l) => !posicao.has(l.id)).sort((a, b) => a.ordem - b.ordem)

  dentro.sort((a, b) => (posicao.get(a.id) ?? 0) - (posicao.get(b.id) ?? 0))
  return [...dentro, ...fora].map((l, ordem) => ({ ...l, ordem }))
}
