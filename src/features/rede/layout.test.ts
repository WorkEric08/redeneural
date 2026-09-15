import { describe, expect, it } from 'vitest'

import type { Conexao, NeuronioNaTela } from '@/core'

import { grausDoMapa, neuronioEm } from './layout'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function neuronio(id: string, livroId: string): NeuronioNaTela {
  return {
    id,
    livroId,
    titulo: id,
    conteudo: '',
    processando: false,
    createdAt: T0,
    updatedAt: T0,
  }
}

function conexao(aId: string, bId: string, cross: boolean, score = 0.6): Conexao {
  return {
    id: `${aId}::${bId}`,
    aId,
    bId,
    score,
    emb: score,
    rr: null,
    cross,
    mantidaPorA: true,
    mantidaPorB: true,
    updatedAt: T0,
  }
}

const CONEXOES = [
  conexao('p1', 'p2', false, 0.9),
  conexao('p2', 'p3', false, 0.4),
  conexao('g1', 'g2', false, 0.7),
  conexao('p1', 'g1', true, 0.8),
]

describe('grausDoMapa', () => {
  it('conta os dois lados de cada aresta', () => {
    const grau = grausDoMapa(CONEXOES)

    expect(grau.get('p1')).toBe(2)
    expect(grau.get('p3')).toBe(1)
    expect(grau.get('m1')).toBeUndefined()
  })
})

describe('neuronioEm', () => {
  const posicoes = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 100, y: 0 }],
  ])
  const ordem = [neuronio('a', 'psi'), neuronio('b', 'psi')]

  it('acha quem está debaixo do dedo dentro do raio de toque', () => {
    expect(neuronioEm({ x: 8, y: 6 }, posicoes, ordem, 22)).toBe('a')
  })

  it('devolve null quando o toque cai no vazio', () => {
    expect(neuronioEm({ x: 50, y: 50 }, posicoes, ordem, 22)).toBeNull()
  })

  it('o de cima ganha quando dois se sobrepõem', () => {
    const juntos = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 2, y: 0 }],
    ])
    expect(neuronioEm({ x: 1, y: 0 }, juntos, ordem, 22)).toBe('b')
  })
})
