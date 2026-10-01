import { describe, expect, it } from 'vitest'

import { RECORTE_DA_COSTA, type MapaDoPalacio } from '@/core'

import {
  bordasDoMapa,
  contornoDaIlha,
  ESCALA_DE_PERTO,
  ilhaEm,
  neuronioNoMapaEm,
  pontosAbsolutos,
  presencaDePerto,
  raioDaCosta,
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

  it('o raio da costa num ângulo é o do contorno nesse ângulo', () => {
    const costa = contornoDaIlha('psi', 80, 8)
    costa.forEach((p, i) => {
      expect(raioDaCosta('psi', 80, (i / 8) * 2 * Math.PI)).toBeCloseTo(Math.hypot(p.x, p.y))
    })
  })
})

describe('ilhaEm', () => {
  it('a terra é a da costa de verdade, e o mar não é de ninguém', () => {
    expect(ilhaEm({ x: 100, y: 0 }, MAPA)).toBe('psi')
    expect(ilhaEm({ x: -300, y: 50 }, MAPA)).toBe('mus')
    expect(ilhaEm({ x: 0, y: 400 }, MAPA)).toBeNull()
  })

  it('entre o recorte e o raio, decide a costa daquele ângulo', () => {
    const angulo = 1
    const r = raioDaCosta('psi', 80, angulo)
    const em = (d: number) => ({ x: 100 + Math.cos(angulo) * d, y: Math.sin(angulo) * d })
    expect(ilhaEm(em(r - 0.5), MAPA)).toBe('psi')
    expect(ilhaEm(em(r + 0.5), MAPA)).toBeNull()
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
