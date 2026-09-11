import { describe, expect, it } from 'vitest'

import { base64ToEmbedding, embeddingToBase64 } from './base64'

describe('codec de embedding', () => {
  it('sobrevive a uma ida e volta preservando os bits', () => {
    const original = new Float32Array([0, 1, -1, 0.5, -0.123456789, 3.4e38, 1.2e-38])
    const voltou = base64ToEmbedding(embeddingToBase64(original))

    expect(Array.from(voltou)).toEqual(Array.from(original))
  })

  it('é mais compacto que o array JSON equivalente', () => {
    const v = new Float32Array(384).map((_, i) => Math.sin(i) / 20)

    expect(embeddingToBase64(v).length).toBeLessThan(JSON.stringify(Array.from(v)).length / 3)
  })

  it('funciona com uma view sobre um buffer maior e desalinhado', () => {
    const buffer = new ArrayBuffer(4 + 8)
    const view = new Float32Array(buffer, 4, 2)
    view.set([1.5, -2.25])

    expect(Array.from(base64ToEmbedding(embeddingToBase64(view)))).toEqual([1.5, -2.25])
  })

  it('recusa base64 com lixo dentro', () => {
    expect(() => base64ToEmbedding('não é base64!')).toThrow()
  })

  it('recusa um payload que não fecha em floats de 4 bytes', () => {
    expect(() => base64ToEmbedding('AAA=')).toThrow(/múltiplos de 4/)
  })
})
