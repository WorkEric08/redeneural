import { describe, expect, it } from 'vitest'

import type { Livro } from '@/core'

import { montarPrateleiras, posicaoParaNovoLivro } from './prateleiras'
import type { LivroNaEstante } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function livro(id: string, prateleira: number, ordem: number): LivroNaEstante {
  const l: Livro = { id, titulo: `Livro ${id}`, cor: '#7b6ae0', prateleira, ordem, createdAt: T0 }
  return { livro: l, neuronios: 3, internas: 0, saindo: 0, altura: 0.5 }
}

function todosOsIds(estante: readonly LivroNaEstante[], quantidadeDePrateleiras: number): string[] {
  return montarPrateleiras(estante, quantidadeDePrateleiras).flatMap((p) =>
    p.livros.map((l) => l.item.livro.id),
  )
}

describe('montarPrateleiras', () => {
  it('agrupa cada livro na prateleira gravada, sem depender de quantos existem', () => {
    const estante = [livro('a', 0, 0), livro('b', 2, 0), livro('c', 0, 1)]
    const prateleiras = montarPrateleiras(estante, 4)

    expect(prateleiras[0]!.livros.map((l) => l.item.livro.id)).toEqual(['a', 'c'])
    expect(prateleiras[1]!.livros).toEqual([])
    expect(prateleiras[2]!.livros.map((l) => l.item.livro.id)).toEqual(['b'])
    expect(prateleiras[3]!.livros).toEqual([])
  })

  it('dentro da prateleira, ordena por `ordem`, não pela ordem de chegada', () => {
    const estante = [livro('depois', 0, 1), livro('antes', 0, 0)]
    expect(montarPrateleiras(estante, 4)[0]!.livros.map((l) => l.item.livro.id)).toEqual([
      'antes',
      'depois',
    ])
  })

  it('tem sempre a quantidade de prateleiras pedida, vazia ou não', () => {
    expect(montarPrateleiras([], 4).length).toBe(4)
    expect(montarPrateleiras([], 1).length).toBe(1)
    expect(montarPrateleiras([livro('a', 0, 0)], 9).length).toBe(9)
  })

  it('nunca perde um livro, por mais que existam numa prateleira só', () => {
    for (const quantidade of [0, 1, 3, 7, 32, 90]) {
      const estante = Array.from({ length: quantidade }, (_, i) => livro(`l${String(i)}`, 0, i))
      expect(todosOsIds(estante, 4)).toEqual(estante.map((e) => e.livro.id))
    }
  })

  // A promessa da mobília: o mesmo palácio tem que dar sempre o mesmo desenho,
  // ou reabrir o app reembaralharia a estante. Vale para enfeite também.
  it('é determinístico entre chamadas', () => {
    const estante = Array.from({ length: 9 }, (_, i) => livro(`l${String(i)}`, i % 4, 0))
    expect(montarPrateleiras(estante, 4)).toEqual(montarPrateleiras(estante, 4))
  })

  it('dá à mesma lombada sempre a mesma largura, esteja onde estiver', () => {
    const sozinho = montarPrateleiras([livro('psi', 0, 0)], 4)
    const acompanhado = montarPrateleiras(
      [livro('a', 0, 0), livro('b', 0, 1), livro('c', 1, 0), livro('psi', 2, 0)],
      4,
    )

    const largura = (ps: ReturnType<typeof montarPrateleiras>): number | undefined =>
      ps.flatMap((p) => p.livros).find((l) => l.item.livro.id === 'psi')?.largura

    expect(largura(sozinho)).toBe(largura(acompanhado))
  })
})

describe('posicaoParaNovoLivro', () => {
  it('nasce no fim da prateleira tocada, sem contar as outras', () => {
    const livros = [{ prateleira: 0 }, { prateleira: 0 }, { prateleira: 1 }]
    expect(posicaoParaNovoLivro(livros, 0)).toBe(2)
    expect(posicaoParaNovoLivro(livros, 1)).toBe(1)
    expect(posicaoParaNovoLivro(livros, 2)).toBe(0)
  })
})
