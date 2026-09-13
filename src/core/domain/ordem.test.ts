import { describe, expect, it } from 'vitest'

import { aplicarOrdem, inserirNaOrdem, trocarNaOrdem } from './ordem'

describe('trocarNaOrdem', () => {
  it('troca só os dois, e o resto fica onde estava', () => {
    expect(trocarNaOrdem(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['c', 'b', 'a', 'd'])
  })

  it('não inventa troca com livro que não está na estante', () => {
    expect(trocarNaOrdem(['a', 'b'], 'a', 'fantasma')).toEqual(['a', 'b'])
    expect(trocarNaOrdem(['a', 'b'], 'a', 'a')).toEqual(['a', 'b'])
  })

  it('não mexe na lista de entrada', () => {
    const ids = ['a', 'b']
    trocarNaOrdem(ids, 'a', 'b')
    expect(ids).toEqual(['a', 'b'])
  })
})

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

describe('aplicarOrdem', () => {
  const livro = (id: string, ordem: number) => ({ id, ordem })

  it('cada livro passa a valer o próprio índice na lista', () => {
    const livros = [livro('a', 0), livro('b', 1), livro('c', 2)]
    expect(aplicarOrdem(livros, ['c', 'a', 'b'])).toEqual([
      livro('c', 0),
      livro('a', 1),
      livro('b', 2),
    ])
  })

  it('quem ficou fora da lista vai para o fim em vez de sumir', () => {
    const livros = [livro('a', 0), livro('b', 1), livro('c', 2)]
    expect(aplicarOrdem(livros, ['b']).map((l) => l.id)).toEqual(['b', 'a', 'c'])
  })
})
