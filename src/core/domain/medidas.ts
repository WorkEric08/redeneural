import { semente } from '@/lib/semente'

import type { Livro } from './types'

/**
 * As medidas da lombada que o núcleo precisa conhecer — não só a tela. Moraram em
 * `features/estante/prateleiras.ts` até o livro deitado (08/10/2026): a pilha de livros
 * deitados tem um limite de altura que as regras puras (`ordem.ts`) precisam aplicar igual
 * na store e no repositório, e esse limite sai destas mesmas medidas.
 */

/** Em % da fileira, como a lombada de verdade — ver .movel-fila. */
export const ALTURA_MINIMA_DA_LOMBADA = 63
export const ALTURA_MAXIMA_DA_LOMBADA = 93.5

/**
 * A fileira nunca é menor que isto, em px: o piso do `clamp` de `.movel-fila` (index.css),
 * que é a altura em um celular de 320×568. Em telas maiores ela cresce, mas nunca encolhe.
 */
export const FILEIRA_MINIMA_PX = 92

/**
 * O livro mais alto que a pessoa pode escolher: o "Enorme" do formulário, em % da fileira.
 * Passa da altura automática (`ALTURA_MAXIMA_DA_LOMBADA`), e é ele que limita a pilha.
 */
export const ALTURA_MAXIMA_ESCOLHIDA_DA_LOMBADA = 98

/**
 * Quanto uma pilha de livros deitados pode medir de altura, em px: a do livro de pé mais alto,
 * na fileira **mais baixa** que existe. Fixo, e não medido na tela, de propósito: uma pilha que
 * coubesse numa tela alta e passasse do teto numa baixa ficaria cortada pela prateleira de
 * cima ao trocar de aparelho (ou girar o celular), e as regras de empilhar precisam dar o
 * mesmo resultado na store e no repositório, que não medem tela nenhuma. Quem tem a fileira
 * mais alta só ganha folga.
 */
export const ALTURA_UTIL_DA_PILHA_PX = Math.floor(
  (FILEIRA_MINIMA_PX * ALTURA_MAXIMA_ESCOLHIDA_DA_LOMBADA) / 100,
)

/**
 * A largura de um livro na fileira: a escolhida na mão, ou a da semente do id. Num livro
 * deitado é a **espessura** — o mesmo número, com o livro girado —, e é ela que enche a pilha.
 */
export function larguraDoLivroGravado(livro: Pick<Livro, 'id' | 'larguraLombada'>): number {
  const [a] = semente(livro.id)
  return livro.larguraLombada ?? Math.round(30 + a * 16)
}
