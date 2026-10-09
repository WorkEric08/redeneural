/**
 * O ícone no pé de cada lombada (08/10/2026): livro, executável ou pasta. Uma preferência de
 * Ajustes, ligada por padrão — desligada, a lombada não tem ícone nenhum e o título usa o pé.
 */
export const ICONES_NOS_LIVROS_PADRAO = true

/** O que o ícone do pé diz: a espécie do livro. */
export type EspecieDoLivro = 'livro' | 'executavel' | 'pasta'

/** Uma pasta de acervo é pasta; um livro de conceitos é executável ou não. Nada é as duas coisas. */
export function especieDoLivro(livro: { tipo: string; executavel: boolean }): EspecieDoLivro {
  if (livro.tipo === 'acervo') return 'pasta'
  return livro.executavel ? 'executavel' : 'livro'
}
