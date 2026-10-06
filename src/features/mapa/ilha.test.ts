import { describe, expect, it } from 'vitest'

import type { MapaDoPalacio } from '@/core'

import {
  bordasDoMapa,
  ESCALA_DE_PERTO,
  dentroDoHexagono,
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

  it('a costa é o hexágono: o raio é o apótema, de cima e de baixo', () => {
    expect(ilhaEm({ x: 100, y: -79.9 }, MAPA)).toBe('psi')
    expect(ilhaEm({ x: 100, y: -80.1 }, MAPA)).toBeNull()
    expect(ilhaEm({ x: 100, y: 79.9 }, MAPA)).toBe('psi')
  })

  it('o vértice vai além do raio: o hexágono contém o círculo, e os cantos são terra', () => {
    // O vértice fica a raio / cos 30° ≈ 92,4 do centro, à esquerda e à direita.
    expect(ilhaEm({ x: 100 + 92, y: 0 }, MAPA)).toBe('psi')
    expect(ilhaEm({ x: 100 + 92.6, y: 0 }, MAPA)).toBeNull()
    // Um ponto de qualquer direção dentro do círculo do raio é terra.
    for (let a = 0; a < 360; a += 15) {
      const r = (a * Math.PI) / 180
      expect(ilhaEm({ x: 100 + Math.cos(r) * 79.9, y: Math.sin(r) * 79.9 }, MAPA)).toBe('psi')
    }
  })
})

describe('dentroDoHexagono', () => {
  it('os lados inclinados cortam o canto: a 45° o limite é mais perto que o do círculo do vértice', () => {
    const centro = { x: 0, y: 0 }
    // Na direção de 45° a borda do hexágono de apótema 100 está a 100 / cos(15°).
    const limite = 100 / Math.cos((15 * Math.PI) / 180)
    const c = Math.cos(Math.PI / 4)
    expect(dentroDoHexagono({ x: c * (limite - 0.5), y: c * (limite - 0.5) }, centro, 100)).toBe(
      true,
    )
    expect(dentroDoHexagono({ x: c * (limite + 0.5), y: c * (limite + 0.5) }, centro, 100)).toBe(
      false,
    )
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
    // Em cima e embaixo, o apótema; dos lados, o vértice (raio / cos 30°).
    const lado = 80 * (2 / Math.sqrt(3))
    expect(bordasDoMapa(MAPA)).toContainEqual({ x: 100 + lado, y: 80 })
    expect(bordasDoMapa(MAPA)).toContainEqual({ x: -300 - 70 * (2 / Math.sqrt(3)), y: -20 })
  })
})
