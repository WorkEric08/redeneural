import { describe, expect, it } from 'vitest'

import {
  LUGARES_POR_PRATELEIRA,
  moverLivroNaEstante,
  primeiroLugarLivre,
  vagasDepoisDeMover,
} from './ordem'

interface L {
  id: string
  prateleira: number
  ordem: number
}

const l = (id: string, prateleira: number, ordem: number): L => ({ id, prateleira, ordem })

function lugares(livros: readonly L[] | null): Record<string, [number, number]> {
  if (!livros) throw new Error('esperava uma estante, veio recusa')
  return Object.fromEntries(livros.map((x) => [x.id, [x.prateleira, x.ordem]]))
}

describe('primeiroLugarLivre', () => {
  it('o próprio lugar pedido, quando não tem livro', () => {
    expect(primeiroLugarLivre([l('a', 0, 0)], 0, 5)).toBe(5)
  })

  it('com livro no lugar, o primeiro buraco à direita', () => {
    const estante = [l('a', 0, 2), l('b', 0, 3), l('c', 0, 5)]
    expect(primeiroLugarLivre(estante, 0, 2)).toBe(4)
  })

  it('sem buraco à direita, o mais perto à esquerda', () => {
    const cheiaDoMeioAoFim = Array.from({ length: 6 }, (_, i) =>
      l(`x${String(i)}`, 0, LUGARES_POR_PRATELEIRA - 6 + i),
    )
    expect(primeiroLugarLivre(cheiaDoMeioAoFim, 0, LUGARES_POR_PRATELEIRA - 3)).toBe(
      LUGARES_POR_PRATELEIRA - 7,
    )
  })

  it('só olha a prateleira pedida', () => {
    expect(primeiroLugarLivre([l('a', 1, 0)], 0, 0)).toBe(0)
  })

  it('prateleira cheia de livros não tem lugar', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 0, i))
    expect(primeiroLugarLivre(cheia, 0, 4)).toBeNull()
  })
})

describe('moverLivroNaEstante', () => {
  it('para um lugar sem livro, só o livro se move — nem a origem fecha', () => {
    const estante = [l('a', 0, 0), l('b', 0, 1), l('c', 0, 2)]
    expect(lugares(moverLivroNaEstante(estante, 'a', 0, 9))).toEqual({
      a: [0, 9],
      b: [0, 1],
      c: [0, 2],
    })
  })

  it('para o meio de uma prateleira vazia, fica no meio', () => {
    expect(lugares(moverLivroNaEstante([l('a', 0, 0)], 'a', 3, 7))).toEqual({ a: [3, 7] })
  })

  it('para um lugar com livro, empurra a fila até o primeiro buraco à direita', () => {
    const estante = [l('a', 0, 2), l('b', 0, 3), l('c', 0, 6), l('n', 1, 0)]
    expect(lugares(moverLivroNaEstante(estante, 'n', 0, 2))).toEqual({
      n: [0, 2],
      a: [0, 3],
      b: [0, 4], // o buraco no 4 absorveu o empurrão
      c: [0, 6], // depois do buraco, ninguém anda
    })
  })

  it('sem buraco à direita, empurra para a esquerda', () => {
    const ultimo = LUGARES_POR_PRATELEIRA - 1
    const estante = [l('a', 0, ultimo - 1), l('b', 0, ultimo), l('n', 1, 0)]
    expect(lugares(moverLivroNaEstante(estante, 'n', 0, ultimo))).toEqual({
      a: [0, ultimo - 2],
      b: [0, ultimo - 1],
      n: [0, ultimo],
    })
  })

  it('dentro da mesma prateleira, o lugar que o livro deixa conta como buraco', () => {
    const estante = [l('a', 0, 3), l('b', 0, 4), l('c', 0, 5)]
    expect(lugares(moverLivroNaEstante(estante, 'c', 0, 3))).toEqual({
      c: [0, 3],
      a: [0, 4],
      b: [0, 5],
    })
  })

  it('soltar no próprio lugar não muda nada', () => {
    const estante = [l('a', 0, 0), l('b', 0, 4)]
    expect(lugares(moverLivroNaEstante(estante, 'b', 0, 4))).toEqual({ a: [0, 0], b: [0, 4] })
  })

  it('lugar fora da prateleira vai para a ponta mais próxima', () => {
    expect(lugares(moverLivroNaEstante([l('a', 0, 0)], 'a', 0, 999))).toEqual({
      a: [0, LUGARES_POR_PRATELEIRA - 1],
    })
    expect(lugares(moverLivroNaEstante([l('a', 0, 5)], 'a', 0, -3))).toEqual({ a: [0, 0] })
  })

  it('recusa uma prateleira cheia de livros, sem mexer em nada', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 0, i))
    expect(moverLivroNaEstante([...cheia, l('n', 1, 0)], 'n', 0, 3)).toBeNull()
  })

  it('id inexistente não muda nada', () => {
    const estante = [l('a', 0, 0)]
    expect(moverLivroNaEstante(estante, 'fantasma', 0, 0)).toEqual(estante)
  })
})

describe('vagasDepoisDeMover', () => {
  it('abre a vaga de onde o livro saiu e fecha a de onde chegou', () => {
    const antes = [l('a', 0, 1)]
    const depois = [l('a', 0, 8)]
    expect(vagasDepoisDeMover([{ prateleira: 0, ordem: 8 }], antes, depois, 'a')).toEqual([
      { prateleira: 0, ordem: 1 },
    ])
  })

  it('não abre vaga na origem que o empurrão ocupou', () => {
    const antes = [l('a', 0, 3), l('b', 0, 4), l('c', 0, 5)]
    const depois = moverLivroNaEstante(antes, 'c', 0, 3)
    expect(vagasDepoisDeMover([], antes, depois ?? [], 'c')).toEqual([])
  })

  it('mantém as vagas que ninguém tocou, sem duplicar a da origem', () => {
    const vagas = [
      { prateleira: 2, ordem: 0 },
      { prateleira: 0, ordem: 1 },
    ]
    const antes = [l('a', 0, 1)]
    const depois = [l('a', 1, 0)]
    expect(vagasDepoisDeMover(vagas, antes, depois, 'a')).toEqual(vagas)
  })
})
