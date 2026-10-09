import { describe, expect, it } from 'vitest'

import { bordasDaFaixa } from './faixa'

describe('bordasDaFaixa', () => {
  it('uma fileira que cabe inteira não tem nada escondido', () => {
    expect(bordasDaFaixa(0, 300, 300)).toEqual({ esquerda: false, direita: false })
  })

  it('no começo de uma fileira comprida só há mais à direita', () => {
    expect(bordasDaFaixa(0, 300, 700)).toEqual({ esquerda: false, direita: true })
  })

  it('no meio há dos dois lados', () => {
    expect(bordasDaFaixa(150, 300, 700)).toEqual({ esquerda: true, direita: true })
  })

  it('no fim só há mais à esquerda', () => {
    expect(bordasDaFaixa(400, 300, 700)).toEqual({ esquerda: true, direita: false })
  })

  it('um ou dois pixels de sobra (arredondamento) não contam', () => {
    expect(bordasDaFaixa(1, 300, 301)).toEqual({ esquerda: false, direita: false })
    expect(bordasDaFaixa(398.5, 300, 700)).toEqual({ esquerda: true, direita: false })
  })
})
