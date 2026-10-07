import { describe, expect, it } from 'vitest'

import { brilhoDaLuz, clampIntensidadeDaLuz, INTENSIDADE_DA_LUZ_PADRAO, sombraDaLuz } from './luz'

describe('sombra e brilho da luz', () => {
  it('o padrão é 50, e ali não há nem sombra nem brilho (as cores reais)', () => {
    expect(INTENSIDADE_DA_LUZ_PADRAO).toBe(50)
    expect(sombraDaLuz(50)).toBe(0)
    expect(brilhoDaLuz(50)).toBe(0)
  })

  it('abaixo de 50 só há sombra, e ela cresce até 1 no 0', () => {
    expect(sombraDaLuz(25)).toBe(0.5)
    expect(sombraDaLuz(0)).toBe(1)
    expect(brilhoDaLuz(25)).toBe(0)
  })

  it('acima de 50 só há brilho, e ele cresce até 1 no 100', () => {
    expect(brilhoDaLuz(75)).toBe(0.5)
    expect(brilhoDaLuz(100)).toBe(1)
    expect(sombraDaLuz(75)).toBe(0)
  })

  it('fora da faixa não passa de 1', () => {
    expect(sombraDaLuz(-40)).toBe(1)
    expect(brilhoDaLuz(400)).toBe(1)
  })
})

describe('clampIntensidadeDaLuz', () => {
  it('deixa passar o que já está na faixa', () => {
    expect(clampIntensidadeDaLuz(42)).toBe(42)
    expect(clampIntensidadeDaLuz(0)).toBe(0)
    expect(clampIntensidadeDaLuz(100)).toBe(100)
  })

  it('recorta o que sai da faixa', () => {
    expect(clampIntensidadeDaLuz(150)).toBe(100)
    expect(clampIntensidadeDaLuz(-10)).toBe(0)
  })

  it('arredonda fração', () => {
    expect(clampIntensidadeDaLuz(41.6)).toBe(42)
  })
})
