import { describe, expect, it } from 'vitest'

import { medidaReduzida } from './imagem'

describe('medidaReduzida', () => {
  it('não amplia o que já cabe', () => {
    expect(medidaReduzida(800, 600, 1600)).toEqual({ largura: 800, altura: 600 })
    expect(medidaReduzida(1600, 900, 1600)).toEqual({ largura: 1600, altura: 900 })
  })

  it('reduz pelo lado maior, na mesma proporção — em pé ou deitada', () => {
    expect(medidaReduzida(4000, 3000, 1600)).toEqual({ largura: 1600, altura: 1200 })
    expect(medidaReduzida(3000, 4000, 320)).toEqual({ largura: 240, altura: 320 })
  })

  it('uma faixa fininha não vira zero pixel', () => {
    expect(medidaReduzida(10000, 2, 320)).toEqual({ largura: 320, altura: 1 })
  })
})
