import { describe, expect, it } from 'vitest'

import { especieDoLivro, ICONES_NOS_LIVROS_PADRAO } from './icones'

describe('especieDoLivro', () => {
  it('pasta de acervo é pasta, mesmo que o dado diga executável', () => {
    expect(especieDoLivro({ tipo: 'acervo', executavel: false })).toBe('pasta')
    expect(especieDoLivro({ tipo: 'acervo', executavel: true })).toBe('pasta')
  })

  it('livro de conceitos é executável ou livro', () => {
    expect(especieDoLivro({ tipo: 'conceitos', executavel: true })).toBe('executavel')
    expect(especieDoLivro({ tipo: 'conceitos', executavel: false })).toBe('livro')
  })

  it('os ícones começam ligados', () => {
    expect(ICONES_NOS_LIVROS_PADRAO).toBe(true)
  })
})
