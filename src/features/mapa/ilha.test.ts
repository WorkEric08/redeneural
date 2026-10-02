import { describe, expect, it } from 'vitest'

import type { MapaDoPalacio } from '@/core'

import {
  bordasDoMapa,
  ESCALA_DE_PERTO,
  ilhaEm,
  neuronioNoMapaEm,
  pontosAbsolutos,
  presencaDePerto,
} from './ilha'

const MAPA: MapaDoPalacio = {
  ilhas: {
    psi: {
      centro: { x: 100, y: 0 },
      raio: 80,
      pontos: { a: { x: 10, y: -5 }, b: { x: -20, y: 0 } },
    },
    mus: { centro: { x: -300, y: 50 }, raio: 70, pontos: { c: { x: 0, y: 0 } } },
  },
}

describe('pontosAbsolutos e neuronioNoMapaEm', () => {
  const absolutos = pontosAbsolutos(MAPA)

  it('o lugar no mundo é o centro da ilha mais o lugar do neurônio nela', () => {
    expect(absolutos.get('a')).toEqual({ x: 110, y: -5 })
    expect(absolutos.get('c')).toEqual({ x: -300, y: 50 })
  })

  it('o toque acha o mais perto dentro do raio, e nada no mar', () => {
    expect(neuronioNoMapaEm({ x: 108, y: -4 }, absolutos, 10)).toBe('a')
    expect(neuronioNoMapaEm({ x: 0, y: 400 }, absolutos, 10)).toBeNull()
  })
})

describe('ilhaEm', () => {
  it('a terra de cada ilha, e o mar não é de ninguém', () => {
    expect(ilhaEm({ x: 100, y: 0 }, MAPA)).toBe('psi')
    expect(ilhaEm({ x: -300, y: 50 }, MAPA)).toBe('mus')
    expect(ilhaEm({ x: 0, y: 400 }, MAPA)).toBeNull()
  })

  it('a costa é o círculo: dentro do raio é terra, fora é mar', () => {
    expect(ilhaEm({ x: 100 + 79.9, y: 0 }, MAPA)).toBe('psi')
    expect(ilhaEm({ x: 100 + 80.1, y: 0 }, MAPA)).toBeNull()
  })
})

describe('presencaDePerto', () => {
  it('nada de longe, tudo de perto, e sobe sem pular', () => {
    expect(presencaDePerto(0.3)).toBe(0)
    expect(presencaDePerto(ESCALA_DE_PERTO)).toBe(1)
    expect(presencaDePerto(3)).toBe(1)
    let anterior = 0
    for (let e = 0.3; e <= ESCALA_DE_PERTO; e += 0.01) {
      const p = presencaDePerto(e)
      expect(p).toBeGreaterThanOrEqual(anterior)
      anterior = p
    }
  })
})

describe('bordasDoMapa', () => {
  it('as bordas de cada ilha, para o enquadramento', () => {
    expect(bordasDoMapa(MAPA)).toContainEqual({ x: 180, y: 80 })
    expect(bordasDoMapa(MAPA)).toContainEqual({ x: -370, y: -20 })
  })
})
