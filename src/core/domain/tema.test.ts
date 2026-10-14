import { describe, expect, it } from 'vitest'

import {
  TEMAS,
  TEMAS_ESCOLHIVEIS,
  TEMA_PADRAO,
  ehTemaPadrao,
  ehTituloDoClassico,
  temaEmUso,
  temaEscolhidoOuPadrao,
  temaOuPadrao,
} from './tema'

describe('tema', () => {
  it('o padrão é o Padrão escuro: o clássico não é mais uma escolha', () => {
    expect(TEMA_PADRAO).toBe('padrao-escuro')
    expect(TEMAS_ESCOLHIVEIS).toEqual(['padrao-claro', 'padrao-escuro'])
  })

  it('o tema em uso reconhece os três', () => {
    for (const tema of TEMAS) expect(temaOuPadrao(tema)).toBe(tema)
    expect(temaOuPadrao('noite')).toBe('padrao-escuro')
  })

  it('a preferência só aceita os dois do Padrão: "classico" gravado antes e lixo viram o padrão', () => {
    expect(temaEscolhidoOuPadrao('padrao-claro')).toBe('padrao-claro')
    expect(temaEscolhidoOuPadrao('padrao-escuro')).toBe('padrao-escuro')
    expect(temaEscolhidoOuPadrao('classico')).toBe('padrao-escuro')
    expect(temaEscolhidoOuPadrao('')).toBe('padrao-escuro')
    expect(temaEscolhidoOuPadrao(undefined)).toBe('padrao-escuro')
    expect(temaEscolhidoOuPadrao(null)).toBe('padrao-escuro')
    expect(temaEscolhidoOuPadrao(3)).toBe('padrao-escuro')
  })

  it('só as duas versões do Padrão são "Padrão"', () => {
    expect(ehTemaPadrao('classico')).toBe(false)
    expect(ehTemaPadrao('padrao-claro')).toBe(true)
    expect(ehTemaPadrao('padrao-escuro')).toBe(true)
  })
})

describe('ehTituloDoClassico (o easter egg)', () => {
  it.each([
    'Clássico',
    'Tema clássico',
    'classico',
    'tema classico',
    'CLÁSSICO',
    'TEMA CLÁSSICO',
    'clássico',
    'Tema Clássico',
    'tema-clássico',
    'Tema_Classico',
    'temaclassico',
    'TemaClássico',
    '  Tema   clássico  ',
    'Tema clássico.',
    'Clássico!',
    '"Clássico"',
    '🎨 Clássico',
    'Classíco',
    // "Clássico" decomposto (a + acento combinante), como alguns teclados e colagens mandam.
    'Cla\u0301ssico',
    'Tema\u00a0cl\u00e1ssico',
  ])('%j liga', (titulo) => {
    expect(ehTituloDoClassico(titulo)).toBe(true)
  })

  it.each([
    '',
    '   ',
    'Tema',
    'Clássico 2',
    'Tema clássico do trabalho',
    'O clássico',
    'Clássicos',
    'Música clássica',
    'Tema moderno',
    'Programação',
  ])('%j não liga', (titulo) => {
    expect(ehTituloDoClassico(titulo)).toBe(false)
  })
})

describe('temaEmUso', () => {
  const livros = (...titulos: string[]) => titulos.map((titulo) => ({ titulo }))

  it('sem livro chamado "Clássico", vale o tema escolhido', () => {
    expect(temaEmUso('padrao-claro', livros('Música', 'Programação'))).toBe('padrao-claro')
    expect(temaEmUso('padrao-escuro', [])).toBe('padrao-escuro')
  })

  it('com um livro chamado "Clássico" (qualquer um dos títulos), vale o clássico', () => {
    expect(temaEmUso('padrao-claro', livros('Música', 'Clássico'))).toBe('classico')
    expect(temaEmUso('padrao-escuro', livros('tema CLASSICO'))).toBe('classico')
  })

  it('o clássico desliga quando o livro deixa de existir', () => {
    const antes = livros('Música', 'Clássico')
    const depois = antes.filter((l) => l.titulo !== 'Clássico')
    expect(temaEmUso('padrao-escuro', antes)).toBe('classico')
    expect(temaEmUso('padrao-escuro', depois)).toBe('padrao-escuro')
  })
})
