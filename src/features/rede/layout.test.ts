import { describe, expect, it } from 'vitest'

import type { Conexao, NeuronioNaTela } from '@/core'

import {
  camaraParaEnquadrar,
  easeOutCubic,
  grausDoMapa,
  neuronioEm,
  posicoesDoArrasto,
  quadroDoAssentamento,
  vizinhancaDe,
  type NoArrastado,
} from './layout'

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

describe('vizinhancaDe', () => {
  it('sem seleção, não tem vizinhança — ninguém apaga', () => {
    expect(vizinhancaDe(null, CONEXOES)).toBeNull()
  })

  it('inclui o próprio selecionado e os vizinhos diretos, só isso', () => {
    const vizinhanca = vizinhancaDe('p1', CONEXOES)
    expect(vizinhanca).not.toBeNull()
    expect([...vizinhanca!].sort()).toEqual(['g1', 'p1', 'p2'])
  })

  it('não inclui vizinho de vizinho — só um salto', () => {
    // g1 é vizinho de p1, mas g2 (vizinho de g1) não deve aparecer.
    expect(vizinhancaDe('p1', CONEXOES)!.has('g2')).toBe(false)
  })

  it('quem não tem aresta nenhuma fica sozinho no próprio conjunto', () => {
    expect([...vizinhancaDe('m1', CONEXOES)!]).toEqual(['m1'])
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

describe('posicoesDoArrasto', () => {
  const alvo: NoArrastado = {
    id: 'p1',
    origem: { x: 0, y: 0 },
    vizinhos: [
      { id: 'forte', score: 1, origem: { x: 100, y: 0 } },
      { id: 'fraco', score: 0, origem: { x: 0, y: 100 } },
    ],
  }

  it('o nó arrastado segue o delta exatamente', () => {
    const quadro = posicoesDoArrasto(alvo, { x: 10, y: 20 })
    expect(quadro.get('p1')).toEqual({ x: 10, y: 20 })
  })

  it('um vizinho de conexão forte acompanha mais que um de conexão fraca', () => {
    const quadro = posicoesDoArrasto(alvo, { x: 100, y: 0 })
    const forte = quadro.get('forte')!
    const fraco = quadro.get('fraco')!
    expect(forte.x).toBeGreaterThan(100)
    expect(fraco.x).toBe(0)
  })

  it('score zero não move o vizinho nem um pouco', () => {
    const quadro = posicoesDoArrasto(alvo, { x: 50, y: 50 })
    expect(quadro.get('fraco')).toEqual({ x: 0, y: 100 })
  })
})

describe('quadroDoAssentamento', () => {
  const inicio = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 10, y: 10 }],
  ])
  const alvo = { a: { x: 100, y: 0 }, b: { x: 10, y: 110 } }

  it('em k=0 fica exatamente no início', () => {
    const quadro = quadroDoAssentamento(inicio, alvo, 0)
    expect(quadro.get('a')).toEqual({ x: 0, y: 0 })
    expect(quadro.get('b')).toEqual({ x: 10, y: 10 })
  })

  it('em k=1 fica exatamente no alvo', () => {
    const quadro = quadroDoAssentamento(inicio, alvo, 1)
    expect(quadro.get('a')).toEqual({ x: 100, y: 0 })
    expect(quadro.get('b')).toEqual({ x: 10, y: 110 })
  })

  it('em k=0.5 fica na metade do caminho', () => {
    const quadro = quadroDoAssentamento(inicio, alvo, 0.5)
    expect(quadro.get('a')).toEqual({ x: 50, y: 0 })
  })

  it('um id que o alvo não conhece fica parado onde estava', () => {
    const quadro = quadroDoAssentamento(new Map([['sumido', { x: 5, y: 5 }]]), {}, 0.8)
    expect(quadro.get('sumido')).toEqual({ x: 5, y: 5 })
  })
})

describe('easeOutCubic', () => {
  it('começa em 0 e termina em 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('é mais rápido no início que no fim — passou de metade do caminho antes de t=0,5', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('camaraParaEnquadrar', () => {
  const FOLGAS = { topo: 100, base: 100, lados: 20 }

  it('sem pontos válidos, devolve a câmera neutra', () => {
    expect(camaraParaEnquadrar([], 800, 600, FOLGAS, 0.1, 6)).toEqual({
      x: 0,
      y: 0,
      escala: 1,
    })
  })

  it('centraliza um único ponto', () => {
    const c = camaraParaEnquadrar([{ x: 50, y: 50 }], 800, 600, FOLGAS, 0.1, 6)
    expect(c.x).toBeCloseTo(-50 * c.escala)
  })

  it('encaixa a escala pelo lado que mais aperta', () => {
    // 400 de largura por 40 de altura: a altura útil (400) sobra, a largura
    // útil (760) aperta primeiro.
    const c = camaraParaEnquadrar(
      [
        { x: -200, y: -20 },
        { x: 200, y: 20 },
      ],
      800,
      600,
      FOLGAS,
      0.1,
      6,
    )
    expect(c.escala).toBeCloseTo(760 / 400)
  })

  it('nunca passa do teto de escala, mesmo com os pontos colados', () => {
    const c = camaraParaEnquadrar(
      [
        { x: 0, y: 0 },
        { x: 0.001, y: 0.001 },
      ],
      800,
      600,
      FOLGAS,
      0.1,
      3,
    )
    expect(c.escala).toBe(3)
  })

  it('ignora pontos não-finitos sem quebrar', () => {
    const c = camaraParaEnquadrar(
      [
        { x: NaN, y: NaN },
        { x: 10, y: 10 },
      ],
      800,
      600,
      FOLGAS,
      0.1,
      6,
    )
    expect(c.x).toBeCloseTo(-10 * c.escala)
  })
})
