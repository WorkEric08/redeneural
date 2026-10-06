import { COR_PADRAO, PALETA_NOITE, type Livro } from '@/core'

/**
 * Os tons que um livro pode ter: a paleta Noite (`PALETA_NOITE`), no formato
 * `{ nome, cor }` que o formulário já lia.
 *
 * Hex, e não token do tema: `cor` é dado do livro, viaja no backup e não muda
 * com claro e escuro. São dez tons fixos, sem seletor de hex livre — quem leva
 * um hex antigo à paleta é `corMaisProxima`.
 */
export const PANOS = PALETA_NOITE.map((t) => ({ nome: t.nome, cor: t.hex }))

/** O tom padrão de um livro novo: Azul base. */
const PANO_PADRAO = COR_PADRAO

/**
 * Azul base primeiro — o padrão de um livro novo — e só se ele já estiver em
 * uso é que entra a variedade: o primeiro tom que ainda nenhum livro usa, para
 * o novo nascer diferente dos vizinhos. Com todos em uso, a volta recomeça
 * pela quantidade de livros.
 */
export function panoSugerido(livros: readonly Pick<Livro, 'cor'>[]): string {
  const usadas = new Set(livros.map((l) => l.cor.toLowerCase()))
  if (!usadas.has(PANO_PADRAO.toLowerCase())) return PANO_PADRAO
  const livre = PANOS.find((p) => !usadas.has(p.cor.toLowerCase()))
  return livre?.cor ?? PANOS[livros.length % PANOS.length]?.cor ?? PANO_PADRAO
}
