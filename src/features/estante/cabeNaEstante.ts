import type { Id, Livro } from '@/core'

import {
  alturaDaLombadaEmPercentual,
  cabeNaPrateleira,
  larguraDoLivroGravado,
  larguraDosLivrosDaPrateleira,
} from './prateleiras'

/**
 * Se um livro cabe na estante — a conta que as telas fora dela (criar e editar um livro) fazem
 * antes de gravar, porque só a estante mede a fileira.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). A regra é a de sempre das laterais sólidas:
 * os livros de uma prateleira têm que caber inteiros entre elas (os enfeites cedem). O livro
 * deitado a torna mais exigente — ele é largo, 90 a 130 px — e é por isso que ela passou a valer
 * também ao criar e ao editar, não só ao arrastar.
 */

/** Como a estante mediu a fileira da última vez que foi aberta. */
export interface MedidasDaEstante {
  /** O que a fileira tem entre as laterais, em px. */
  larguraUtil: number
  /** A altura da fileira, em px: o livro deitado se estende por uma % dela. */
  alturaDaFileira: number
}

/** O quanto um livro deitado se estende, em px, dada a altura automática (0..1) e a da fileira. */
export function extensaoDoLivroGravado(
  livro: Pick<Livro, 'comprimentoLombada'>,
  alturaAutomatica: number,
  alturaDaFileira: number,
): number {
  return Math.round(
    (alturaDaLombadaEmPercentual(livro.comprimentoLombada, alturaAutomatica) * alturaDaFileira) /
      100,
  )
}

/** O que os livros de uma prateleira ocupam, com a extensão dos deitados medida na fileira. */
export function larguraDaPrateleira(
  livros: readonly Livro[],
  prateleira: number,
  alturasAutomaticas: ReadonlyMap<Id, number>,
  alturaDaFileira: number,
): number {
  return larguraDosLivrosDaPrateleira(livros, prateleira, (l) =>
    l.orientacao === 'deitado'
      ? extensaoDoLivroGravado(l, alturasAutomaticas.get(l.id) ?? 0, alturaDaFileira)
      : larguraDoLivroGravado(l),
  )
}

/**
 * Os livros de `prateleira` continuam cabendo entre as laterais depois da mudança? Quem já estava
 * além do limite (uma tela mais estreita que a de quando o livro foi guardado) pode ser mexido,
 * desde que não piore — a mesma regra de `cabeNaPrateleira`.
 */
export function cabeDepoisDeMudar(
  antes: readonly Livro[],
  depois: readonly Livro[],
  prateleira: number,
  alturasAutomaticas: ReadonlyMap<Id, number>,
  medidas: MedidasDaEstante,
): boolean {
  return cabeNaPrateleira(
    larguraDaPrateleira(antes, prateleira, alturasAutomaticas, medidas.alturaDaFileira),
    larguraDaPrateleira(depois, prateleira, alturasAutomaticas, medidas.alturaDaFileira),
    medidas.larguraUtil,
  )
}
