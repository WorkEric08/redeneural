import { afterEach, describe, expect, it } from 'vitest'

import { aplicarTema, temaLembrado } from './tema'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.tema
})

describe('tema na tela', () => {
  it('sem nada lembrado, o tema é o clássico', () => {
    expect(temaLembrado()).toBe('classico')
  })

  it('aplicar liga o tema na página e o lembra', () => {
    aplicarTema('padrao-escuro')
    expect(document.documentElement.dataset.tema).toBe('padrao-escuro')
    expect(temaLembrado()).toBe('padrao-escuro')
  })

  it('trocar de volta ao clássico também fica lembrado', () => {
    aplicarTema('padrao-claro')
    aplicarTema('classico')
    expect(document.documentElement.dataset.tema).toBe('classico')
    expect(temaLembrado()).toBe('classico')
  })

  it('um valor guardado que não é tema vale o clássico', () => {
    localStorage.setItem('locus-tema', 'noite')
    expect(temaLembrado()).toBe('classico')
  })
})
