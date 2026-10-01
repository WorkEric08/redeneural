import { describe, expect, it } from 'vitest'

import { RECORTE_DA_COSTA, type MapaDoPalacio } from '@/core'

import { bordasDoMapa, contornoDaIlha, neuronioNoMapaEm, pontosAbsolutos } from './ilha'

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

describe('contornoDaIlha', () => {
  it('a costa fica entre o recorte e o raio, nunca passa dele', () => {
    for (const p of contornoDaIlha('psi', 80)) {
      const r = Math.hypot(p.x, p.y)
      expect(r).toBeLessThanOrEqual(80 + 1e-9)
      expect(r).toBeGreaterThanOrEqual(80 * (1 - RECORTE_DA_COSTA) - 1e-9)
    }
  })

  it('cada livro tem a sua costa, e é sempre a mesma', () => {
    expect(contornoDaIlha('psi', 80)).toEqual(contornoDaIlha('psi', 80))
    expect(contornoDaIlha('psi', 80)).not.toEqual(contornoDaIlha('mus', 80))
  })
})

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

describe('bordasDoMapa', () => {
  it('as bordas de cada ilha, para o enquadramento', () => {
    expect(bordasDoMapa(MAPA)).toContainEqual({ x: 180, y: 80 })
    expect(bordasDoMapa(MAPA)).toContainEqual({ x: -370, y: -20 })
  })
})
