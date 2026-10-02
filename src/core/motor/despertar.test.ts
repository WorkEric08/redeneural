import { describe, expect, it } from 'vitest'

import { MS_POR_DIA } from '../domain/executavel'
import type { EstadoDaIdeia } from '../domain/types'

import { LIMIAR_FORTE, quemDesperta } from './despertar'

const AGORA = new Date('2026-10-01T12:00:00.000Z')
const HA = (dias: number): Date => new Date(AGORA.getTime() - dias * MS_POR_DIA)

const LIVROS = new Map([
  ['exe', { executavel: true, diasParaAdormecer: 30 }],
  ['psi', { executavel: false, diasParaAdormecer: 30 }],
])

function ideia(livroId: string | null, ultimoToque: Date, estado: EstadoDaIdeia | null = null) {
  return { livroId, estado, ultimoToque }
}

const IDEIAS = new Map([
  ['novo', ideia('psi', AGORA)],
  ['parada', ideia('exe', HA(40), 'para_fazer')],
  ['recente', ideia('exe', HA(2), 'fazendo')],
  ['feita', ideia('exe', HA(90), 'feita')],
  ['pensamento', ideia('psi', HA(90))],
  ['outra-parada', ideia('exe', HA(31))],
])

const forte = (outro: string, score = 0.9) => ({ aId: 'novo', bId: outro, score })

describe('quemDesperta', () => {
  it('toca toda ideia de livro executável ligada forte à nova, e diz quem dormia', () => {
    const r = quemDesperta(
      'novo',
      [forte('parada'), forte('recente'), forte('feita'), forte('pensamento')],
      IDEIAS,
      LIVROS,
      AGORA,
    )
    expect(r.tocadas).toEqual(['feita', 'parada', 'recente'])
    expect(r.acordadas).toEqual(['parada'])
  })

  it('conexão abaixo do limiar forte não acorda ninguém', () => {
    const r = quemDesperta('novo', [forte('parada', LIMIAR_FORTE - 0.01)], IDEIAS, LIVROS, AGORA)
    expect(r).toEqual({ tocadas: [], acordadas: [] })
    expect(
      quemDesperta('novo', [forte('parada', LIMIAR_FORTE)], IDEIAS, LIVROS, AGORA).acordadas,
    ).toEqual(['parada'])
  })

  it('as acordadas vêm da conexão mais forte para a mais fraca', () => {
    const r = quemDesperta(
      'novo',
      [forte('parada', 0.75), { aId: 'outra-parada', bId: 'novo', score: 0.95 }],
      IDEIAS,
      LIVROS,
      AGORA,
    )
    expect(r.acordadas).toEqual(['outra-parada', 'parada'])
  })

  it('conexões que não tocam a nova não contam', () => {
    const r = quemDesperta(
      'novo',
      [{ aId: 'parada', bId: 'recente', score: 1 }],
      IDEIAS,
      LIVROS,
      AGORA,
    )
    expect(r.tocadas).toEqual([])
  })
})
