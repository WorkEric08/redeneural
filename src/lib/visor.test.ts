import { describe, expect, it } from 'vitest'

import {
  deslocamentoDaPista,
  DESLOCAMENTO_PARA_TROCAR_PX,
  indiceDepoisDoGesto,
  VELOCIDADE_PARA_TROCAR,
} from './visor'

const gesto = (indice: number, total: number, deslocamento: number, velocidade = 0) =>
  indiceDepoisDoGesto({ indice, total, deslocamento, velocidade })

describe('indiceDepoisDoGesto', () => {
  it('arrastar para a esquerda mostra a próxima, para a direita a anterior', () => {
    expect(gesto(2, 8, -DESLOCAMENTO_PARA_TROCAR_PX)).toBe(3)
    expect(gesto(2, 8, DESLOCAMENTO_PARA_TROCAR_PX)).toBe(1)
  })

  it('um arrasto curto e devagar volta para a mesma imagem', () => {
    expect(gesto(2, 8, -(DESLOCAMENTO_PARA_TROCAR_PX - 1))).toBe(2)
    expect(gesto(2, 8, 20)).toBe(2)
  })

  it('um gesto rápido troca mesmo curto, pela direção da velocidade', () => {
    expect(gesto(2, 8, -10, -VELOCIDADE_PARA_TROCAR)).toBe(3)
    expect(gesto(2, 8, 10, VELOCIDADE_PARA_TROCAR)).toBe(1)
  })

  it('nunca passa do começo nem do fim', () => {
    expect(gesto(0, 8, 200)).toBe(0)
    expect(gesto(7, 8, -200)).toBe(7)
    expect(gesto(0, 8, 0, 2)).toBe(0)
  })

  it('com uma imagem só, não há para onde ir', () => {
    expect(gesto(0, 1, -300, -2)).toBe(0)
    expect(gesto(0, 1, 300, 2)).toBe(0)
  })

  it('um índice fora da fila é trazido para dentro', () => {
    expect(gesto(9, 8, 0)).toBe(7)
    expect(gesto(-3, 8, 0)).toBe(0)
  })
})

describe('deslocamentoDaPista', () => {
  it('no meio da fila a pista acompanha o dedo inteiro', () => {
    expect(deslocamentoDaPista({ indice: 3, total: 8, deslocamento: -120 })).toBe(-120)
    expect(deslocamentoDaPista({ indice: 3, total: 8, deslocamento: 90 })).toBe(90)
  })

  it('tentando passar do começo ou do fim, segue só uma fração', () => {
    expect(deslocamentoDaPista({ indice: 0, total: 8, deslocamento: 100 })).toBeCloseTo(30)
    expect(deslocamentoDaPista({ indice: 7, total: 8, deslocamento: -100 })).toBeCloseTo(-30)
  })

  it('no começo, arrastar para o lado que existe segue inteiro', () => {
    expect(deslocamentoDaPista({ indice: 0, total: 8, deslocamento: -100 })).toBe(-100)
    expect(deslocamentoDaPista({ indice: 7, total: 8, deslocamento: 100 })).toBe(100)
  })
})
