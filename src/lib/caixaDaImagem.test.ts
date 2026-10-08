import { describe, expect, it } from 'vitest'

import { caixaDaImagem } from './caixaDaImagem'

describe('caixaDaImagem', () => {
  it('a caixa tem a proporção da imagem', () => {
    expect(caixaDaImagem(800, 500, '24rem').aspectRatio).toBe('800 / 500')
    expect(caixaDaImagem(500, 800, '24rem').aspectRatio).toBe('500 / 800')
  })

  it('a largura é limitada por altura máxima × proporção, e nunca passa do lugar', () => {
    expect(caixaDaImagem(800, 500, '24rem').width).toBe('min(100%, calc(24rem * 1.6))')
    expect(caixaDaImagem(500, 800, '70dvh').width).toBe('min(100%, calc(70dvh * 0.625))')
  })

  it('uma imagem sem medida cai numa caixa quadrada, sem dividir por zero', () => {
    expect(caixaDaImagem(0, 0, '18rem').width).toBe('min(100%, calc(18rem * 1))')
  })
})
