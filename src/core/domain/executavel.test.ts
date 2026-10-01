import { describe, expect, it } from 'vitest'

import {
  clampDiasParaAdormecer,
  DIAS_PARA_ADORMECER_MAXIMO,
  DIAS_PARA_ADORMECER_PADRAO,
  entraEmExecutavel,
  estadoAoGuardar,
  estadoVisivel,
} from './executavel'

const EXECUTAVEL = { id: 'exe', executavel: true }
const OUTRO_EXECUTAVEL = { id: 'exe-2', executavel: true }
const PENSAMENTOS = { id: 'psi', executavel: false }

describe('entraEmExecutavel', () => {
  it('nascer, sair do porto ou de outro livro para um executável é entrar', () => {
    expect(entraEmExecutavel(undefined, EXECUTAVEL)).toBe(true)
    expect(entraEmExecutavel(null, EXECUTAVEL)).toBe(true)
    expect(entraEmExecutavel('psi', EXECUTAVEL)).toBe(true)
    expect(entraEmExecutavel('exe-2', EXECUTAVEL)).toBe(true)
  })

  it('continuar no mesmo livro, ou ir para um que não é executável, não é', () => {
    expect(entraEmExecutavel('exe', EXECUTAVEL)).toBe(false)
    expect(entraEmExecutavel('exe', PENSAMENTOS)).toBe(false)
    expect(entraEmExecutavel(undefined, undefined)).toBe(false)
  })
})

describe('estadoAoGuardar', () => {
  it('entrar num executável começa em "para fazer", seja qual for o estado de antes', () => {
    expect(estadoAoGuardar(undefined, EXECUTAVEL)).toBe('para_fazer')
    expect(estadoAoGuardar({ livroId: 'psi', estado: null }, EXECUTAVEL)).toBe('para_fazer')
    expect(estadoAoGuardar({ livroId: 'exe-2', estado: 'feita' }, EXECUTAVEL)).toBe('para_fazer')
  })

  it('continuar no mesmo executável mantém o que tinha', () => {
    expect(estadoAoGuardar({ livroId: 'exe', estado: 'fazendo' }, EXECUTAVEL)).toBe('fazendo')
    expect(estadoAoGuardar({ livroId: 'exe', estado: null }, EXECUTAVEL)).toBe('para_fazer')
  })

  it('sair para um livro de pensamentos guarda o estado, sem perder nada', () => {
    expect(estadoAoGuardar({ livroId: 'exe', estado: 'feita' }, PENSAMENTOS)).toBe('feita')
    expect(estadoAoGuardar(undefined, PENSAMENTOS)).toBeNull()
  })

  it('trocar de um executável para outro também é entrar', () => {
    expect(estadoAoGuardar({ livroId: 'exe', estado: 'fazendo' }, OUTRO_EXECUTAVEL)).toBe(
      'para_fazer',
    )
  })
})

describe('estadoVisivel', () => {
  it('só aparece num livro executável', () => {
    expect(estadoVisivel({ estado: 'feita' }, EXECUTAVEL)).toBe('feita')
    expect(estadoVisivel({ estado: null }, EXECUTAVEL)).toBe('para_fazer')
    expect(estadoVisivel({ estado: 'feita' }, PENSAMENTOS)).toBeNull()
    expect(estadoVisivel({ estado: 'feita' }, undefined)).toBeNull()
  })
})

describe('clampDiasParaAdormecer', () => {
  it('dias inteiros entre zero e um ano', () => {
    expect(clampDiasParaAdormecer(0)).toBe(0)
    expect(clampDiasParaAdormecer(7.6)).toBe(8)
    expect(clampDiasParaAdormecer(-3)).toBe(0)
    expect(clampDiasParaAdormecer(9999)).toBe(DIAS_PARA_ADORMECER_MAXIMO)
    expect(clampDiasParaAdormecer(Number.NaN)).toBe(DIAS_PARA_ADORMECER_PADRAO)
  })
})
