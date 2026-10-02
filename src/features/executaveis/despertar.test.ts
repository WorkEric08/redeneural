import { describe, expect, it } from 'vitest'

import { textoDoDespertar } from './despertar'

describe('textoDoDespertar', () => {
  it('ninguém acordou, nada a dizer', () => {
    expect(textoDoDespertar([])).toBeNull()
  })

  it('um ou dois nomes, por extenso', () => {
    expect(textoDoDespertar(['Vídeo sobre memória'])).toBe('Isso acordou “Vídeo sobre memória”.')
    expect(textoDoDespertar(['A', 'B'])).toBe('Isso acordou “A” e “B”.')
  })

  it('mais de dois: dois nomes e a contagem do resto', () => {
    expect(textoDoDespertar(['A', 'B', 'C', 'D'])).toBe('Isso acordou “A”, “B” e mais 2.')
  })
})
