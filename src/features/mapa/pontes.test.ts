import { describe, expect, it } from 'vitest'

import type { Conexao, MapaDoPalacio } from '@/core'

import { ESCALA_DE_PERTO } from './ilha'
import {
  agruparPontes,
  distanciaAoSegmento,
  ESPESSURA_MAXIMA_DA_PONTE,
  espessuraDaPonte,
  controleDoArco,
  ponteEm,
  pontesAMostra,
  pontoNoArco,
  pontesVisiveis,
  type PonteAgrupada,
} from './pontes'

const T0 = new Date('2026-10-01T00:00:00Z')

function conexao(aId: string, bId: string, score: number): Conexao {
  return {
    id: `${aId}::${bId}`,
    aId,
    bId,
    score,
    emb: score,
    rr: null,
    cross: true,
    mantidaPorA: true,
    mantidaPorB: true,
    updatedAt: T0,
  }
}

const LIVRO_DE = new Map<string, string | null>([
  ['p1', 'psi'],
  ['p2', 'psi'],
  ['m1', 'mus'],
  ['m2', 'mus'],
  ['v1', 'vida'],
  ['solto', null],
])

describe('agruparPontes', () => {
  const pontes = agruparPontes(
    [
      conexao('p1', 'm1', 0.4),
      conexao('m2', 'p2', 0.9), // a mesma ponte, na outra direção
      conexao('p1', 'p2', 1), // dentro do livro: é trilha
      conexao('v1', 'p1', 0.5),
      conexao('solto', 'm1', 1), // no porto: não tem ilha
    ],
    LIVRO_DE,
  )

  it('uma ponte por par de livros, em qualquer direção', () => {
    expect(pontes.map((p) => p.chave)).toEqual(['mus::psi', 'psi::vida'])
    const [musPsi] = pontes
    expect(musPsi?.quantidade).toBe(2)
    expect(musPsi?.soma).toBeCloseTo(1.3)
  })

  it('cada par sai do livro A para o livro B, do mais parecido para o menos', () => {
    expect(pontes[0]?.pares).toEqual([
      { aId: 'm2', bId: 'p2', score: 0.9 },
      { aId: 'm1', bId: 'p1', score: 0.4 },
    ])
  })

  it('a ordem não depende da ordem de entrada', () => {
    const invertidas = agruparPontes(
      [conexao('v1', 'p1', 0.5), conexao('p2', 'm2', 0.9), conexao('m1', 'p1', 0.4)],
      LIVRO_DE,
    )
    expect(invertidas).toEqual(pontes)
  })
})

function ponte(livroA: string, livroB: string, quantidade: number): PonteAgrupada {
  return { chave: `${livroA}::${livroB}`, livroA, livroB, quantidade, soma: quantidade, pares: [] }
}

describe('pontesAMostra', () => {
  it('cada ilha mostra só as mais fortes dela', () => {
    // O hub tem cinco pontes; cada uma das outras ilhas tem só uma, para ele.
    const pontes = [
      ponte('a', 'hub', 9),
      ponte('b', 'hub', 8),
      ponte('c', 'hub', 7),
      ponte('d', 'hub', 6),
      ponte('e', 'hub', 5),
    ]
    // Todas aparecem: cada uma é a mais forte da ilha pequena.
    expect(pontesAMostra(pontes, 3)).toHaveLength(5)
  })

  it('esconde a que não é das mais fortes de nenhum dos dois lados', () => {
    const pontes = [
      ponte('a', 'b', 9),
      ponte('a', 'c', 8),
      ponte('b', 'c', 7),
      ponte('a', 'd', 6),
      ponte('b', 'd', 5),
      ponte('c', 'd', 4),
      ponte('a', 'e', 1),
      ponte('b', 'e', 1),
    ]
    const vistas = pontesAMostra(pontes, 2).map((p) => p.chave)
    expect(vistas).toEqual(['a::b', 'a::c', 'b::c', 'a::d', 'b::d', 'a::e', 'b::e'])
    expect(vistas).not.toContain('c::d')
  })

  it('de perto, ou com "Ver todas as pontes", nenhuma fica escondida', () => {
    // Cinco livros todos ligados entre si: d–e é a 4ª ponte dos dois lados.
    const tudo = [
      ponte('a', 'b', 10),
      ponte('a', 'c', 9),
      ponte('a', 'd', 8),
      ponte('b', 'c', 7),
      ponte('b', 'd', 6),
      ponte('c', 'd', 5),
      ponte('a', 'e', 4),
      ponte('b', 'e', 3),
      ponte('c', 'e', 2),
      ponte('d', 'e', 1),
    ]
    expect(pontesVisiveis(tudo, 0.3, false).map((p) => p.chave)).not.toContain('d::e')
    expect(pontesVisiveis(tudo, 0.3, false)).toHaveLength(tudo.length - 1)
    expect(pontesVisiveis(tudo, 0.3, true)).toHaveLength(tudo.length)
    expect(pontesVisiveis(tudo, ESCALA_DE_PERTO, false)).toHaveLength(tudo.length)
  })
})

describe('espessuraDaPonte', () => {
  it('cresce com a quantidade e para no teto', () => {
    expect(espessuraDaPonte(1)).toBe(1.5)
    expect(espessuraDaPonte(3)).toBeGreaterThan(espessuraDaPonte(2))
    expect(espessuraDaPonte(1000)).toBe(ESPESSURA_MAXIMA_DA_PONTE)
  })
})

describe('distanciaAoSegmento e ponteEm', () => {
  it('a distância ao segmento, e às pontas fora dele', () => {
    expect(distanciaAoSegmento({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3)
    expect(distanciaAoSegmento({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5)
  })

  it('a ponte é um arco: o toque acha a curva, não a reta entre os centros', () => {
    const mapa: MapaDoPalacio = {
      ilhas: {
        a: { centro: { x: 0, y: 0 }, raio: 70, pontos: {} },
        b: { centro: { x: 400, y: 0 }, raio: 70, pontos: {} },
        c: { centro: { x: 0, y: 400 }, raio: 70, pontos: {} },
      },
    }
    const pontes = [ponte('a', 'b', 2), ponte('a', 'c', 1)]
    const meioAB = pontoNoArco(
      { x: 0, y: 0 },
      controleDoArco({ x: 0, y: 0 }, { x: 400, y: 0 }),
      { x: 400, y: 0 },
      0.5,
    )
    const meioAC = pontoNoArco(
      { x: 0, y: 0 },
      controleDoArco({ x: 0, y: 0 }, { x: 0, y: 400 }),
      { x: 0, y: 400 },
      0.5,
    )
    expect(meioAB.y).not.toBeCloseTo(0)
    expect(ponteEm({ x: meioAB.x, y: meioAB.y + 4 }, pontes, mapa, 10)?.chave).toBe('a::b')
    expect(ponteEm({ x: meioAC.x + 4, y: meioAC.y }, pontes, mapa, 10)?.chave).toBe('a::c')
    // Na reta entre os centros, longe da curva, não há ponte.
    expect(ponteEm({ x: 200, y: 0 }, pontes, mapa, 10)).toBeNull()
    expect(ponteEm({ x: 200, y: 200 }, pontes, mapa, 10)).toBeNull()
  })
})
