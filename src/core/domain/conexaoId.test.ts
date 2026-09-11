import { describe, expect, it } from 'vitest'

import { conexaoId, ordenarPar, outroLado, tocaNeuronio } from './conexaoId'
import type { Conexao } from './types'

const aresta: Conexao = {
  id: conexaoId('a', 'b'),
  aId: 'a',
  bId: 'b',
  score: 0.8,
  emb: 0.7,
  rr: 0.9,
  cross: true,
  mantidaPorA: true,
  mantidaPorB: false,
  updatedAt: new Date(0),
}

describe('id canônico de aresta', () => {
  it('dá o mesmo id nas duas direções', () => {
    expect(conexaoId('b', 'a')).toBe(conexaoId('a', 'b'))
  })

  it('ordena o par de forma estável', () => {
    expect(ordenarPar('z', 'a')).toEqual(['a', 'z'])
    expect(ordenarPar('a', 'z')).toEqual(['a', 'z'])
  })

  it('sabe quem a aresta toca e o que está do outro lado', () => {
    expect(tocaNeuronio(aresta, 'a')).toBe(true)
    expect(tocaNeuronio(aresta, 'c')).toBe(false)
    expect(outroLado(aresta, 'a')).toBe('b')
    expect(outroLado(aresta, 'b')).toBe('a')
  })
})
