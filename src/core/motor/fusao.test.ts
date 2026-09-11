import { describe, expect, it } from 'vitest'

import { escalaEmbedding, fundir, sigmoid } from './fusao'

describe('fusão', () => {
  it('sigmoid mapeia o logit para 0..1', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 9)
    expect(sigmoid(10)).toBeGreaterThan(0.99)
    expect(sigmoid(-10)).toBeLessThan(0.01)
  })

  it('a escala do embedding satura em 1 e corta o negativo em 0', () => {
    expect(escalaEmbedding(0.45, 0.45)).toBeCloseTo(1, 9)
    expect(escalaEmbedding(0.9, 0.45)).toBe(1)
    expect(escalaEmbedding(-0.3, 0.45)).toBe(0)
    expect(escalaEmbedding(0.225, 0.45)).toBeCloseTo(0.5, 9)
  })

  it('a escala é fixa: o mesmo cosseno dá o mesmo score em qualquer conjunto', () => {
    expect(escalaEmbedding(0.3, 0.45)).toBe(escalaEmbedding(0.3, 0.45))
  })

  it('recusa escala inválida em vez de devolver Infinity', () => {
    expect(() => escalaEmbedding(0.3, 0)).toThrow(/escalaEmb/)
  })

  it('sem reranker o embedding decide sozinho', () => {
    expect(fundir(0.8, null, 0.5)).toBe(0.8)
  })

  it('com reranker os dois votos pesam igual', () => {
    expect(fundir(0.8, 0.4, 0.5)).toBeCloseTo(0.6, 9)
    expect(fundir(1, 0, 0.5)).toBeCloseTo(0.5, 9)
  })
})
