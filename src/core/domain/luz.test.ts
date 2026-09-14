import { describe, expect, it } from 'vitest'

import { clampIntensidadeDaLuz } from './luz'

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
