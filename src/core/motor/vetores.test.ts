import { describe, expect, it } from 'vitest'

import { centralizar, centroide, cosseno, norma, normalizar, produtoInterno } from './vetores'

const v = (...xs: number[]): Float32Array => new Float32Array(xs)

describe('vetores', () => {
  it('normaliza para norma 1', () => {
    expect(norma(normalizar(v(3, 4)))).toBeCloseTo(1, 6)
  })

  it('devolve o vetor nulo em vez de NaN ao normalizar zero', () => {
    expect(Array.from(normalizar(v(0, 0, 0)))).toEqual([0, 0, 0])
  })

  it('calcula o cosseno independente da escala', () => {
    expect(cosseno(v(1, 0), v(5, 0))).toBeCloseTo(1, 6)
    expect(cosseno(v(1, 0), v(0, 1))).toBeCloseTo(0, 6)
    expect(cosseno(v(1, 0), v(-1, 0))).toBeCloseTo(-1, 6)
  })

  it('recusa dimensões diferentes', () => {
    expect(() => produtoInterno(v(1, 2), v(1, 2, 3))).toThrow(/dimensões/)
  })

  it('tira a média do conjunto', () => {
    const [x, y] = centroide([v(1, 0), v(-1, 0), v(0, 2)])
    expect(x).toBe(0)
    expect(y).toBeCloseTo(2 / 3, 6)
  })

  it('centralizar afasta vetores que só pareciam próximos pelo fundo comum', () => {
    // Dois textos "curtos" que compartilham um fundo forte em e0 e divergem em e1/e2.
    const a = normalizar(v(1, 0.2, 0))
    const b = normalizar(v(1, 0, 0.2))
    const centro = centroide([a, b])

    const antes = produtoInterno(a, b)
    const depois = produtoInterno(centralizar(a, centro), centralizar(b, centro))

    expect(antes).toBeGreaterThan(0.9)
    expect(depois).toBeLessThan(antes)
  })

  it('um vetor igual ao centroide vira nulo, com cosseno 0 para todo mundo', () => {
    const a = v(1, 0)
    expect(Array.from(centralizar(a, a))).toEqual([0, 0])
    expect(produtoInterno(centralizar(a, a), normalizar(v(0, 1)))).toBe(0)
  })
})
