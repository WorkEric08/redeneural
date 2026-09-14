import { describe, expect, it } from 'vitest'

import { LUGARES_POR_PRATELEIRA, type Livro, type Vaga } from '@/core'

import { montarPrateleiras, type Lugar, type Prateleira } from './prateleiras'
import type { LivroNaEstante } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function livro(
  id: string,
  prateleira: number,
  ordem: number,
  larguraLombada: number | null = null,
): LivroNaEstante {
  const l: Livro = {
    id,
    titulo: `Livro ${id}`,
    cor: '#7b6ae0',
    prateleira,
    ordem,
    emblema: null,
    larguraLombada,
    comprimentoLombada: null,
    createdAt: T0,
  }
  return { livro: l, neuronios: 3, internas: 0, saindo: 0, altura: 0.5 }
}

/** `L:id` para livro, `E` para enfeite, `_` para vaga — a fileira num relance. */
function fileira(p: Prateleira, ate = 6): string[] {
  return p.lugares
    .slice(0, ate)
    .map((x) => (x.tipo === 'livro' ? `L:${x.item.livro.id}` : x.tipo === 'enfeite' ? 'E' : '_'))
}

function livrosDe(prateleiras: readonly Prateleira[]): Extract<Lugar, { tipo: 'livro' }>[] {
  return prateleiras.flatMap((p) => p.lugares.filter((x) => x.tipo === 'livro'))
}

describe('montarPrateleiras', () => {
  it('cada prateleira tem sempre todos os lugares, com livro ou sem', () => {
    const prateleiras = montarPrateleiras([livro('a', 0, 3)], [], 4)
    expect(prateleiras.length).toBe(4)
    for (const p of prateleiras) expect(p.lugares.length).toBe(LUGARES_POR_PRATELEIRA)
  })

  it('põe cada livro no lugar gravado, deixando buraco entre eles', () => {
    const [p] = montarPrateleiras([livro('a', 0, 0), livro('b', 0, 3)], [], 1)
    expect(fileira(p!)).toEqual(['L:a', 'E', 'E', 'L:b', 'E', 'E'])
  })

  it('lugar sem livro mostra enfeite, a não ser que haja vaga aberta ali', () => {
    const vagas: Vaga[] = [{ prateleira: 0, ordem: 1 }]
    const [p] = montarPrateleiras([livro('a', 0, 0)], vagas, 1)
    expect(fileira(p!, 3)).toEqual(['L:a', '_', 'E'])
  })

  it('o livro vence uma vaga gravada no mesmo lugar', () => {
    const [p] = montarPrateleiras([livro('a', 0, 0)], [{ prateleira: 0, ordem: 0 }], 1)
    expect(fileira(p!, 1)).toEqual(['L:a'])
  })

  it('vaga de outra prateleira não abre buraco nesta', () => {
    const [p0, p1] = montarPrateleiras([], [{ prateleira: 1, ordem: 2 }], 2)
    expect(fileira(p0!, 3)).toEqual(['E', 'E', 'E'])
    expect(fileira(p1!, 3)).toEqual(['E', 'E', '_'])
  })

  it('a cor de um enfeite é do lugar: pôr um livro ao lado não a troca', () => {
    const vazio = montarPrateleiras([], [], 1)[0]!.lugares[5]
    const comVizinho = montarPrateleiras([livro('a', 0, 4)], [], 1)[0]!.lugares[5]
    expect(comVizinho).toEqual(vazio)
  })

  it('vaga e enfeite têm a mesma largura: tirar um enfeite não faz a fileira andar', () => {
    const [p] = montarPrateleiras([], [{ prateleira: 0, ordem: 0 }], 1)
    expect(p!.lugares[0]!.largura).toBe(p!.lugares[1]!.largura)
  })

  it('nunca perde um livro, nem os de fora da grade (dados de antes dos lugares)', () => {
    const estante = Array.from({ length: 30 }, (_, i) => livro(`l${String(i)}`, 0, i))
    const ids = livrosDe(montarPrateleiras(estante, [], 4)).map((x) => x.item.livro.id)
    expect(ids).toEqual(estante.map((e) => e.livro.id))
  })

  // A promessa da mobília: o mesmo palácio tem que dar sempre o mesmo desenho,
  // ou reabrir o app reembaralharia a estante. Vale para enfeite também.
  it('é determinístico entre chamadas', () => {
    const estante = Array.from({ length: 9 }, (_, i) => livro(`l${String(i)}`, i % 4, i))
    const vagas: Vaga[] = [{ prateleira: 2, ordem: 11 }]
    expect(montarPrateleiras(estante, vagas, 4)).toEqual(montarPrateleiras(estante, vagas, 4))
  })

  it('dá à mesma lombada sempre a mesma largura, esteja onde estiver', () => {
    const largura = (ps: readonly Prateleira[]): number | undefined =>
      livrosDe(ps).find((x) => x.item.livro.id === 'psi')?.largura

    const sozinho = montarPrateleiras([livro('psi', 0, 0)], [], 4)
    const acompanhado = montarPrateleiras(
      [livro('a', 0, 0), livro('b', 0, 1), livro('c', 1, 0), livro('psi', 2, 9)],
      [],
      4,
    )
    expect(largura(sozinho)).toBe(largura(acompanhado))
  })

  it('usa a largura escolhida na mão, ignorando a semente do id', () => {
    const [x] = livrosDe(montarPrateleiras([livro('psi', 0, 0, 68)], [], 1))
    expect(x!.largura).toBe(68)
  })

  it('sem largura escolhida, cai na semente do id (comportamento de sempre)', () => {
    const [x] = livrosDe(montarPrateleiras([livro('psi', 0, 0, null)], [], 1))
    expect(x!.largura).toBeGreaterThanOrEqual(30)
    expect(x!.largura).toBeLessThanOrEqual(46)
  })
})
