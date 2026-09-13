import { describe, expect, it } from 'vitest'

import { inserirNaOrdem, type Livro } from '@/core'

import { montarPrateleiras, posicaoParaNovoLivro } from './prateleiras'
import type { LivroNaEstante } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function livro(id: string): LivroNaEstante {
  const l: Livro = { id, titulo: `Livro ${id}`, cor: '#7b6ae0', ordem: 0, createdAt: T0 }
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

describe('posicaoParaNovoLivro', () => {
  /** Em que prateleira o livro novo apareceu depois de entrar na posição calculada. */
  function prateleiraDoNovo(total: number, tocada: number): { onde: number; ocupadas: number } {
    const ids = Array.from({ length: total }, (_, i) => 'l' + String(i))
    const ordem = inserirNaOrdem(ids, 'novo', posicaoParaNovoLivro(total, tocada))
    const prateleiras = montarPrateleiras(ordem.map(livro))

    return {
      onde: prateleiras.findIndex((p) => p.livros.some((l) => l.item.livro.id === 'novo')),
      ocupadas: prateleiras.filter((p) => p.livros.length > 0).length,
    }
  }

  it('na estante de hoje, com três livros, nasce em qualquer prateleira tocada', () => {
    for (const tocada of [0, 1, 2, 3]) {
      expect(prateleiraDoNovo(3, tocada).onde).toBe(tocada)
    }
  })

  // A garantia inteira: nasce onde tocou sempre que aquela prateleira recebe
  // livro; quando ainda não recebe, nasce na última ocupada, o mais perto dali.
  it('nasce onde tocou, ou o mais perto que a distribuição permite', () => {
    for (let total = 0; total <= 60; total++) {
      const prateleiras = montarPrateleiras(
        Array.from({ length: total + 1 }, (_, i) => livro('x' + String(i))),
      ).length

      for (let tocada = 0; tocada < prateleiras; tocada++) {
        const { onde, ocupadas } = prateleiraDoNovo(total, tocada)
        expect(onde).toBe(Math.min(tocada, ocupadas - 1))
      }
    }
  })
})
