import { describe, expect, it } from 'vitest'

import type { Livro } from '@/core'

import { montarPrateleiras } from './prateleiras'
import type { LivroNaEstante } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function livro(id: string): LivroNaEstante {
  const l: Livro = { id, titulo: `Livro ${id}`, cor: '#7b6ae0', createdAt: T0 }
  return { livro: l, neuronios: 3, internas: 0, saindo: 0, altura: 0.5 }
}

function todosOsIds(estante: readonly LivroNaEstante[]): string[] {
  return montarPrateleiras(estante).flatMap((p) => p.livros.map((l) => l.item.livro.id))
}

describe('montarPrateleiras', () => {
  it('nunca perde um livro, por mais que existam', () => {
    for (const quantidade of [0, 1, 3, 7, 32, 33, 90]) {
      const estante = Array.from({ length: quantidade }, (_, i) => livro(`l${String(i)}`))
      expect(todosOsIds(estante)).toEqual(estante.map((e) => e.livro.id))
    }
  })

  it('mantém o móvel com prateleiras de sobra quando há poucos livros', () => {
    expect(montarPrateleiras([]).length).toBe(4)
    expect(montarPrateleiras([livro('a')]).length).toBe(4)
  })

  it('não passa do teto de prateleiras — acomoda mais em cada uma', () => {
    const estante = Array.from({ length: 90 }, (_, i) => livro(`l${String(i)}`))
    expect(montarPrateleiras(estante).length).toBe(14)
  })

  it('espalha poucos livros pelo móvel em vez de amontoá-los na primeira fila', () => {
    const estante = Array.from({ length: 3 }, (_, i) => livro(`l${String(i)}`))
    expect(montarPrateleiras(estante).map((p) => p.livros.length)).toEqual([1, 1, 1, 0])
  })

  // A promessa da mobília: o mesmo palácio tem que dar sempre o mesmo desenho,
  // ou reabrir o app reembaralharia a estante. Vale para enfeite também.
  it('é determinístico entre chamadas', () => {
    const estante = Array.from({ length: 9 }, (_, i) => livro(`l${String(i)}`))
    expect(montarPrateleiras(estante)).toEqual(montarPrateleiras(estante))
  })

  it('dá à mesma lombada sempre a mesma largura, esteja onde estiver', () => {
    const sozinho = montarPrateleiras([livro('psi')])
    const acompanhado = montarPrateleiras([livro('a'), livro('b'), livro('c'), livro('psi')])

    const largura = (ps: ReturnType<typeof montarPrateleiras>): number | undefined =>
      ps.flatMap((p) => p.livros).find((l) => l.item.livro.id === 'psi')?.largura

    expect(largura(sozinho)).toBe(largura(acompanhado))
  })
})
