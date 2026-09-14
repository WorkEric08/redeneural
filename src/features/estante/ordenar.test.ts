import { describe, expect, it } from 'vitest'

import type { Livro } from '@/core'

import { aplicarMudancasDeOrdem, ordenarPorCriterio } from './ordenar'

function livro(id: string, titulo: string, prateleira: number, ordem: number, dias = 0): Livro {
  return {
    id,
    titulo,
    cor: '#7b6ae0',
    prateleira,
    ordem,
    emblema: null,
    createdAt: new Date(2026, 0, 1 + dias),
  }
}

describe('ordenarPorCriterio', () => {
  it('por nome, ordena alfabeticamente dentro da prateleira', () => {
    const livros = [livro('c', 'Zebra', 0, 0), livro('a', 'Abelha', 0, 1), livro('b', 'Maçã', 0, 2)]
    const mudancas = ordenarPorCriterio(livros, [], 'nome')

    expect(mudancas.sort((x, y) => (x.id < y.id ? -1 : 1))).toEqual([
      { id: 'a', ordem: 0 },
      { id: 'b', ordem: 1 },
      { id: 'c', ordem: 2 },
    ])
  })

  it('por criação, mais recente primeiro', () => {
    const livros = [
      livro('velho', 'Velho', 0, 0, 0),
      livro('novo', 'Novo', 0, 1, 5),
      livro('meio', 'Meio', 0, 2, 2),
    ]
    const mudancas = ordenarPorCriterio(livros, [], 'criacao')
    const porId = new Map(mudancas.map((m) => [m.id, m.ordem]))

    expect(porId.get('novo')).toBe(0)
    expect(porId.get('meio')).toBe(1)
    expect(porId.get('velho')).toBe(2)
  })

  it('por neurônios, quem tem mais vem primeiro', () => {
    const livros = [livro('a', 'A', 0, 0), livro('b', 'B', 0, 1)]
    const neuronios = [{ livroId: 'a' }, { livroId: 'b' }, { livroId: 'b' }]
    const mudancas = ordenarPorCriterio(livros, neuronios, 'neuronios')
    const porId = new Map(mudancas.map((m) => [m.id, m.ordem]))

    expect(porId.get('b')).toBe(0)
    expect(porId.get('a')).toBe(1)
  })

  it('nunca mistura prateleiras diferentes', () => {
    const livros = [livro('z', 'Zebra', 0, 0), livro('a', 'Abelha', 1, 0)]
    const mudancas = ordenarPorCriterio(livros, [], 'nome')

    // Já estão cada um sozinho na própria prateleira — nada muda.
    expect(mudancas).toEqual([])
  })

  it('já ordenado não gera mudança nenhuma', () => {
    const livros = [livro('a', 'Abelha', 0, 0), livro('b', 'Zebra', 0, 1)]
    expect(ordenarPorCriterio(livros, [], 'nome')).toEqual([])
  })
})

describe('aplicarMudancasDeOrdem', () => {
  it('regrava só quem está na lista de mudanças', () => {
    const livros = [livro('a', 'A', 0, 0), livro('b', 'B', 0, 1)]
    const depois = aplicarMudancasDeOrdem(livros, [{ id: 'a', ordem: 1 }])

    expect(depois.find((l) => l.id === 'a')?.ordem).toBe(1)
    expect(depois.find((l) => l.id === 'b')?.ordem).toBe(1)
  })
})
