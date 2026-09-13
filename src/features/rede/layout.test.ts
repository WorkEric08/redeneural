import { describe, expect, it } from 'vitest'

import type { Conexao, Livro, NeuronioNaTela } from '@/core'

import { grausDoMapa, montarMapa, neuronioEm } from './layout'

const T0 = new Date('2026-01-01T12:00:00.000Z')

const LIVROS: Livro[] = [
  { id: 'psi', titulo: 'Psicologia', cor: '#7b6ae0', prateleira: 0, ordem: 0, createdAt: T0 },
  {
    id: 'prog',
    titulo: 'Programação',
    cor: '#3e9a93',
    prateleira: 0,
    ordem: 1,
    createdAt: new Date(T0.getTime() + 1000),
  },
  {
    id: 'mus',
    titulo: 'Música',
    cor: '#c8734a',
    prateleira: 0,
    ordem: 2,
    createdAt: new Date(T0.getTime() + 2000),
  },
]

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

const NEURONIOS = [
  neuronio('p1', 'psi'),
  neuronio('p2', 'psi'),
  neuronio('p3', 'psi'),
  neuronio('g1', 'prog'),
  neuronio('g2', 'prog'),
  neuronio('m1', 'mus'),
]

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

function distancia(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

describe('montarMapa', () => {
  it('dá sempre o mesmo desenho para o mesmo palácio', () => {
    // A promessa central: um palácio da memória cuja mobília anda não serve.
    const a = montarMapa(LIVROS, NEURONIOS, CONEXOES)
    const b = montarMapa(LIVROS, NEURONIOS, CONEXOES)

    for (const n of NEURONIOS) {
      expect(a.posicoes.get(n.id)).toEqual(b.posicoes.get(n.id))
    }
  })

  it('não depende da ordem em que os neurônios chegam', () => {
    const a = montarMapa(LIVROS, NEURONIOS, CONEXOES)
    const b = montarMapa(LIVROS, [...NEURONIOS].reverse(), CONEXOES)

    for (const n of NEURONIOS) {
      const pa = a.posicoes.get(n.id)!
      const pb = b.posicoes.get(n.id)!
      expect(distancia(pa, pb)).toBeLessThan(1)
    }
  })

  it('posiciona todo neurônio, e nenhum em NaN', () => {
    const mapa = montarMapa(LIVROS, NEURONIOS, CONEXOES)

    expect(mapa.posicoes.size).toBe(NEURONIOS.length)
    for (const p of mapa.posicoes.values()) {
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })

  it('mantém o livro como região: os seus ficam mais perto entre si que dos outros', () => {
    const { posicoes } = montarMapa(LIVROS, NEURONIOS, CONEXOES)

    const dentro = distancia(posicoes.get('p1')!, posicoes.get('p3')!)
    const fora = distancia(posicoes.get('p1')!, posicoes.get('m1')!)

    expect(dentro).toBeLessThan(fora)
  })

  it('dá uma âncora por livro, todas à mesma distância do centro', () => {
    const { ancoras } = montarMapa(LIVROS, NEURONIOS, CONEXOES)
    const distancias = [...ancoras.values()].map((a) => Math.hypot(a.x, a.y))

    expect(ancoras.size).toBe(3)
    for (const d of distancias) expect(d).toBeCloseTo(distancias[0]!, 6)
  })

  it('o rótulo do livro fica para fora, longe dos neurônios dele', () => {
    const { ancoras, rotulos, posicoes } = montarMapa(LIVROS, NEURONIOS, CONEXOES)

    expect(rotulos.size).toBe(3)
    for (const [livroId, rotulo] of rotulos) {
      const ancora = ancoras.get(livroId)!
      expect(Math.hypot(rotulo.x, rotulo.y)).toBeGreaterThan(Math.hypot(ancora.x, ancora.y))
    }

    // E nenhum neurônio encosta num rótulo.
    for (const p of posicoes.values()) {
      for (const r of rotulos.values()) {
        expect(Math.hypot(p.x - r.x, p.y - r.y)).toBeGreaterThan(20)
      }
    }
  })

  it('um palácio maior abre mais espaço, em vez de virar novelo', () => {
    const muitos = Array.from({ length: 40 }, (_, i) => neuronio(`x${String(i)}`, 'psi'))

    const pequeno = [...montarMapa(LIVROS, NEURONIOS, []).ancoras.values()][0]!
    const grande = [...montarMapa(LIVROS, muitos, []).ancoras.values()][0]!

    expect(Math.hypot(grande.x, grande.y)).toBeGreaterThan(Math.hypot(pequeno.x, pequeno.y))
  })

  it('não empilha dois neurônios exatamente no mesmo ponto', () => {
    const mapa = montarMapa(LIVROS, NEURONIOS, CONEXOES)
    const pontos = [...mapa.posicoes.values()]

    for (let i = 0; i < pontos.length; i++) {
      for (let j = i + 1; j < pontos.length; j++) {
        expect(distancia(pontos[i]!, pontos[j]!)).toBeGreaterThan(1)
      }
    }
  })

  it('aguenta um palácio vazio e um livro sem neurônio', () => {
    expect(montarMapa([], [], []).posicoes.size).toBe(0)
    expect(montarMapa(LIVROS, [], []).ancoras.size).toBe(3)
  })

  it('não quebra com conexão apontando para neurônio que não está no mapa', () => {
    const mapa = montarMapa(LIVROS, NEURONIOS, [...CONEXOES, conexao('p1', 'fantasma', false)])
    expect(Number.isFinite(mapa.posicoes.get('p1')!.x)).toBe(true)
  })

  it('os limites cobrem tudo que foi desenhado', () => {
    const { posicoes, limites } = montarMapa(LIVROS, NEURONIOS, CONEXOES)

    for (const p of posicoes.values()) {
      expect(p.x).toBeGreaterThanOrEqual(limites.minX)
      expect(p.x).toBeLessThanOrEqual(limites.maxX)
      expect(p.y).toBeGreaterThanOrEqual(limites.minY)
      expect(p.y).toBeLessThanOrEqual(limites.maxY)
    }
  })
})

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
