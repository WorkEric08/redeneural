import { afterEach, describe, expect, it } from 'vitest'

import { aplicarTema } from './tema'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.tema
})

describe('tema na tela', () => {
  it('aplicar liga o tema na página e o espelha para a primeira pintura', () => {
    aplicarTema('padrao-escuro')
    expect(document.documentElement.dataset.tema).toBe('padrao-escuro')
    expect(localStorage.getItem('locus-tema')).toBe('padrao-escuro')
  })

  it('o clássico também fica espelhado, para o app abrir nele quando ainda houver o livro', () => {
    aplicarTema('padrao-claro')
    aplicarTema('classico')
    expect(document.documentElement.dataset.tema).toBe('classico')
    expect(localStorage.getItem('locus-tema')).toBe('classico')
  })
})
