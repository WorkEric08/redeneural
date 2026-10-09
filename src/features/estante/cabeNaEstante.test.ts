import { describe, expect, it } from 'vitest'

import type { Livro } from '@/core'

import {
  cabeDepoisDeMudar,
  extensaoDoLivroGravado,
  larguraDaPrateleira,
  type MedidasDaEstante,
} from './cabeNaEstante'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function livro(id: string, ordem: number, o: Partial<Livro> = {}): Livro {
  return {
    id,
    tipo: 'conceitos',
    titulo: id,
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira: 0,
    ordem,
    orientacao: 'em-pe',
    nivel: 0,
    emblema: null,
    larguraLombada: 38,
    comprimentoLombada: 72,
    executavel: false,
    diasParaAdormecer: 30,
    createdAt: T0,
    ...o,
  }
}

const SEM_ALTURAS = new Map<string, number>()
const medidas = (larguraUtil: number, alturaDaFileira = 100): MedidasDaEstante => ({
  larguraUtil,
  alturaDaFileira,
})

describe('extensaoDoLivroGravado', () => {
  it('o comprimento escolhido, em % da fileira medida', () => {
    expect(extensaoDoLivroGravado({ comprimentoLombada: 98 }, 0, 100)).toBe(98)
    expect(extensaoDoLivroGravado({ comprimentoLombada: 55 }, 0, 132)).toBe(73)
  })

  it('sem comprimento escolhido, a altura automática decide (63% a 93,5%)', () => {
    expect(extensaoDoLivroGravado({ comprimentoLombada: null }, 0, 100)).toBe(63)
    expect(extensaoDoLivroGravado({ comprimentoLombada: null }, 1, 100)).toBe(94)
  })
})

describe('larguraDaPrateleira', () => {
  it('soma um lugar por vez: a pilha vale o livro deitado mais comprido', () => {
    const livros = [
      livro('x', 0, { larguraLombada: 38 }),
      livro('a', 3, { orientacao: 'deitado', larguraLombada: 24, comprimentoLombada: 98 }),
      livro('b', 3, {
        orientacao: 'deitado',
        nivel: 1,
        larguraLombada: 24,
        comprimentoLombada: 55,
      }),
    ]
    expect(larguraDaPrateleira(livros, 0, SEM_ALTURAS, 100)).toBe(38 + 1 + 98)
  })

  it('só conta a prateleira pedida', () => {
    const livros = [livro('x', 0), livro('y', 0, { prateleira: 1, larguraLombada: 52 })]
    expect(larguraDaPrateleira(livros, 1, SEM_ALTURAS, 100)).toBe(52)
  })

  it('usa a altura automática de cada livro deitado sem comprimento escolhido', () => {
    const livros = [livro('a', 0, { orientacao: 'deitado', comprimentoLombada: null })]
    expect(larguraDaPrateleira(livros, 0, new Map([['a', 1]]), 100)).toBe(94)
    expect(larguraDaPrateleira(livros, 0, new Map([['a', 0]]), 100)).toBe(63)
  })
})

describe('cabeDepoisDeMudar', () => {
  it('um livro deitado novo que passa das laterais não cabe', () => {
    const antes = [livro('x', 0)] // 38
    const depois = [...antes, livro('n', 1, { orientacao: 'deitado', comprimentoLombada: 98 })]
    // 38 + 1 + 98 = 137
    expect(cabeDepoisDeMudar(antes, depois, 0, SEM_ALTURAS, medidas(130))).toBe(false)
    expect(cabeDepoisDeMudar(antes, depois, 0, SEM_ALTURAS, medidas(137))).toBe(true)
  })

  it('o mesmo livro cabe numa fileira mais baixa, onde ele é menos comprido', () => {
    const antes = [livro('x', 0)]
    const depois = [...antes, livro('n', 1, { orientacao: 'deitado', comprimentoLombada: 98 })]
    // 98% de 92 px = 90: 38 + 1 + 90 = 129.
    expect(cabeDepoisDeMudar(antes, depois, 0, SEM_ALTURAS, medidas(130, 92))).toBe(true)
  })

  it('subir numa pilha que já existe não alarga o lugar, e cabe', () => {
    const antes = [
      livro('a', 3, { orientacao: 'deitado', larguraLombada: 24, comprimentoLombada: 98 }),
    ]
    const depois = [
      ...antes,
      livro('b', 3, {
        orientacao: 'deitado',
        nivel: 1,
        larguraLombada: 24,
        comprimentoLombada: 55,
      }),
    ]
    expect(cabeDepoisDeMudar(antes, depois, 0, SEM_ALTURAS, medidas(98))).toBe(true)
  })

  it('quem já passava do limite pode ser mexido, desde que não piore', () => {
    const antes = [livro('a', 0, { orientacao: 'deitado', comprimentoLombada: 98 })] // 98
    const mesmo = [livro('a', 0, { orientacao: 'deitado', comprimentoLombada: 98, cor: '#1B2A6B' })]
    const pior = [...antes, livro('n', 1)]
    expect(cabeDepoisDeMudar(antes, mesmo, 0, SEM_ALTURAS, medidas(80))).toBe(true)
    expect(cabeDepoisDeMudar(antes, pior, 0, SEM_ALTURAS, medidas(80))).toBe(false)
  })

  it('virar um livro de pé em deitado alarga o lugar dele', () => {
    const antes = [livro('a', 0, { larguraLombada: 38 })]
    const depois = [livro('a', 0, { orientacao: 'deitado', comprimentoLombada: 88 })]
    expect(cabeDepoisDeMudar(antes, depois, 0, SEM_ALTURAS, medidas(60))).toBe(false)
    expect(cabeDepoisDeMudar(antes, depois, 0, SEM_ALTURAS, medidas(88))).toBe(true)
  })
})
