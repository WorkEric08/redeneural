import type { Id } from './types'

/**
 * A ordem da estante, como lista de ids do primeiro ao último livro de uma
 * prateleira.
 *
 * Puras de propósito: a store usa para mostrar o movimento antes de o banco
 * confirmar, e o repositório usa para gravar — os dois precisam chegar
 * exatamente na mesma lista, ou a estante pisca para um lado e volta para o
 * outro.
 */

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
 * Move um livro para `(prateleira, posicao)` — a "bandeja de apps do Android":
 * empurra quem está naquela posição em diante (`inserirNaOrdem` já faz isso),
 * fechando o buraco que ele deixa na prateleira de origem. Soltar numa
 * prateleira vazia (ou depois do último livro dela) não empurra nada, porque
 * a posição pedida já é o fim da lista.
 *
 * Só livros de UMA prateleira por vez são tocados de cada lado — mover nunca
 * redistribui a estante inteira.
 */
export function moverLivroNaEstante<T extends { id: Id; ordem: number; prateleira: number }>(
  livros: readonly T[],
  id: Id,
  prateleiraDestino: number,
  posicao: number,
): T[] {
  const movido = livros.find((l) => l.id === id)
  if (!movido) return [...livros]

  const naPrateleira = (p: number): Id[] =>
    livros
      .filter((l) => l.prateleira === p && l.id !== id)
      .sort((a, b) => a.ordem - b.ordem)
      .map((l) => l.id)

  const novaOrdem = new Map<Id, number>()
  inserirNaOrdem(naPrateleira(prateleiraDestino), id, posicao).forEach((lid, i) => {
    novaOrdem.set(lid, i)
  })
  if (movido.prateleira !== prateleiraDestino) {
    naPrateleira(movido.prateleira).forEach((lid, i) => {
      novaOrdem.set(lid, i)
    })
  }

  return livros.map((l) => {
    if (l.id === id) return { ...l, prateleira: prateleiraDestino, ordem: novaOrdem.get(id) ?? 0 }
    const ordem = novaOrdem.get(l.id)
    return ordem === undefined ? l : { ...l, ordem }
  })
}
