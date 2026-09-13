import type { CriarLivroInput } from '../ports/engine'

import type { Livro } from './types'

/**
 * Monta o livro que será gravado. A `ordem` que sai daqui é provisória: quem a
 * acerta é `inserirNaOrdem`, que reescreve a estante inteira de uma vez.
 */
export function novoLivro(input: CriarLivroInput, agora: Date): Livro {
  return {
    id: input.id,
    titulo: input.titulo.trim(),
    cor: input.cor,
    ordem: Math.max(0, Math.trunc(input.posicao)),
    createdAt: agora,
  }
}
