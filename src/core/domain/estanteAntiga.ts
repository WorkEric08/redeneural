import type { Id } from './types'

/**
 * A distribuição automática de prateleiras de antes da Fase 10 (13-14/09/2026).
 *
 * Congelada aqui só para reconstruir `prateleira`/`ordem` de estantes que ainda
 * não tinham esses campos gravados: a migração do banco (v3 → v4) e a
 * importação de backups de antes da Fase 10. Não é para uso novo — a partir
 * desta fase a prateleira é sempre gravada, nunca calculada (ver
 * `src/features/estante/prateleiras.ts`).
 */

const LIVROS_POR_PRATELEIRA = 6
export const MINIMO_DE_PRATELEIRAS = 4
const MAXIMO_DE_PRATELEIRAS = 14

export function distribuicaoAntiga(total: number): { quantas: number; porPrateleira: number } {
  const quantas = Math.min(
    MAXIMO_DE_PRATELEIRAS,
    Math.max(MINIMO_DE_PRATELEIRAS, Math.ceil(total / LIVROS_POR_PRATELEIRA)),
  )
  const porPrateleira = Math.max(1, Math.ceil(total / quantas))
  return { quantas, porPrateleira }
}

/**
 * Dados os ids na ordem antiga (do primeiro ao último livro da estante),
 * devolve `prateleira`/`ordem` de cada um — o mesmo fatiamento sequencial que
 * `montarPrateleiras` fazia antes da Fase 10.
 */
export function posicoesAntigas(
  ids: readonly Id[],
): Map<Id, { prateleira: number; ordem: number }> {
  const { porPrateleira } = distribuicaoAntiga(ids.length)
  const mapa = new Map<Id, { prateleira: number; ordem: number }>()

  ids.forEach((id, i) => {
    mapa.set(id, { prateleira: Math.floor(i / porPrateleira), ordem: i % porPrateleira })
  })

  return mapa
}
