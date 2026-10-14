import { describe, expect, it } from 'vitest'

import { letrasVisiveis, type Medidor } from './tituloVisivel'

/** Cada letra vale 0,5 do corpo, e as reticências também: uma conta fácil de conferir. */
const MEDIDOR: Medidor = (texto, corpo) => texto.length * corpo * 0.5

// Com corpo 10, cada letra ocupa 5 + 0,6 de espaçamento = 5,6 px; as reticências, 5,6 px.
describe('letrasVisiveis', () => {
  it('todas as letras, quando o título cabe na zona', () => {
    expect(letrasVisiveis('Arte', 10, 56, MEDIDOR)).toBe(4)
    expect(letrasVisiveis('Dez letras', 10, 56, MEDIDOR)).toBe(10)
  })

  it('só as que cabem junto das reticências, quando não cabe', () => {
    // 11 letras = 61,6 px > 56: sobram 9 letras (50,4) mais as reticências (5,6) = 56.
    expect(letrasVisiveis('Programação', 10, 56, MEDIDOR)).toBe(9)
    expect(letrasVisiveis('Programação', 10, 40, MEDIDOR)).toBe(6)
  })

  it('zona minúscula não deixa letra nenhuma, e título vazio é zero', () => {
    expect(letrasVisiveis('Programação', 10, 3, MEDIDOR)).toBe(0)
    expect(letrasVisiveis('', 10, 56, MEDIDOR)).toBe(0)
  })

  it('mede em caixa alta, como a lombada', () => {
    const medidas: string[] = []
    letrasVisiveis('ão', 10, 99, (t, c) => {
      medidas.push(t)
      return t.length * c * 0.5
    })
    expect(medidas[0]).toBe('ÃO')
  })

  it('corpo maior corta mais cedo, na mesma zona', () => {
    const pequeno = letrasVisiveis('Programação', 8, 56, MEDIDOR)
    const grande = letrasVisiveis('Programação', 12, 56, MEDIDOR)
    expect(pequeno).toBeGreaterThan(grande)
  })
})
