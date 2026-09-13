import { describe, expect, it } from 'vitest'

import { inserirNaOrdem, moverLivroNaEstante } from './ordem'

describe('inserirNaOrdem', () => {
  it('empurra quem estava da posição em diante', () => {
    expect(inserirNaOrdem(['a', 'b', 'c'], 'n', 1)).toEqual(['a', 'n', 'b', 'c'])
  })

  it('posição fora da estante vai para a ponta, sem abrir buraco', () => {
    expect(inserirNaOrdem(['a', 'b'], 'n', 99)).toEqual(['a', 'b', 'n'])
    expect(inserirNaOrdem(['a', 'b'], 'n', -3)).toEqual(['n', 'a', 'b'])
  })

  it('reinserir o mesmo id move em vez de duplicar', () => {
    expect(inserirNaOrdem(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b'])
  })
})

describe('moverLivroNaEstante', () => {
  interface L {
    id: string
    prateleira: number
    ordem: number
  }

  const l = (id: string, prateleira: number, ordem: number): L => ({ id, prateleira, ordem })

  function posicoes(livros: readonly L[]): Record<string, [number, number]> {
    return Object.fromEntries(livros.map((x) => [x.id, [x.prateleira, x.ordem]]))
  }

  it('dentro da mesma prateleira, empurra quem está na posição em diante', () => {
    const estante = [l('a', 0, 0), l('b', 0, 1), l('c', 0, 2)]
    const depois = moverLivroNaEstante(estante, 'c', 0, 0)

    expect(posicoes(depois)).toEqual({ c: [0, 0], a: [0, 1], b: [0, 2] })
  })

  it('move para outra prateleira: fecha o buraco na origem e empurra no destino', () => {
    const estante = [l('a', 0, 0), l('b', 0, 1), l('x', 1, 0), l('y', 1, 1)]
    const depois = moverLivroNaEstante(estante, 'a', 1, 1)

    expect(posicoes(depois)).toEqual({
      b: [0, 0], // fechou o buraco que 'a' deixou
      x: [1, 0],
      a: [1, 1], // entrou antes de 'y'
      y: [1, 2],
    })
  })

  it('soltar numa prateleira vazia não mexe em mais ninguém', () => {
    const estante = [l('a', 0, 0), l('b', 0, 1)]
    const depois = moverLivroNaEstante(estante, 'a', 3, 0)

    expect(posicoes(depois)).toEqual({ b: [0, 0], a: [3, 0] })
  })

  it('mover o próprio livro para o fim onde já está é idempotente', () => {
    const estante = [l('a', 0, 0), l('b', 0, 1)]
    const depois = moverLivroNaEstante(estante, 'b', 0, 1)

    expect(posicoes(depois)).toEqual({ a: [0, 0], b: [0, 1] })
  })

  it('id inexistente não muda nada', () => {
    const estante = [l('a', 0, 0)]
    expect(moverLivroNaEstante(estante, 'fantasma', 0, 0)).toEqual(estante)
  })
})
