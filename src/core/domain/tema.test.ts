import { describe, expect, it } from 'vitest'

import { TEMAS, TEMA_PADRAO, ehTemaPadrao, temaOuPadrao } from './tema'

describe('tema', () => {
  it('o padrão é o clássico', () => {
    expect(TEMA_PADRAO).toBe('classico')
  })

  it('reconhece os três temas', () => {
    for (const tema of TEMAS) expect(temaOuPadrao(tema)).toBe(tema)
  })

  it('valor desconhecido, vazio ou de outro tipo vira o padrão', () => {
    expect(temaOuPadrao('noite')).toBe('classico')
    expect(temaOuPadrao('')).toBe('classico')
    expect(temaOuPadrao(undefined)).toBe('classico')
    expect(temaOuPadrao(null)).toBe('classico')
    expect(temaOuPadrao(3)).toBe('classico')
  })

  it('só as duas versões do Padrão são "Padrão"', () => {
    expect(ehTemaPadrao('classico')).toBe(false)
    expect(ehTemaPadrao('padrao-claro')).toBe(true)
    expect(ehTemaPadrao('padrao-escuro')).toBe(true)
  })
})
