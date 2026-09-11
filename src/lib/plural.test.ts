import { describe, expect, it } from 'vitest'

import { contar, listar } from './plural'

describe('contar', () => {
  it('usa o singular só no um', () => {
    expect(contar(0, 'conexão', 'conexões')).toBe('0 conexões')
    expect(contar(1, 'conexão', 'conexões')).toBe('1 conexão')
    expect(contar(2, 'conexão', 'conexões')).toBe('2 conexões')
  })
})

describe('listar', () => {
  it('põe "e" antes do último e vírgula no resto', () => {
    expect(listar([])).toBe('')
    expect(listar(['Cache'])).toBe('Cache')
    expect(listar(['Cache', 'Recursão'])).toBe('Cache e Recursão')
    expect(listar(['Cache', 'Recursão', 'Timbre'])).toBe('Cache, Recursão e Timbre')
  })
})
