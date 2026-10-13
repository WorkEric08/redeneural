/**
 * O tema da interface — o conjunto de paleta, fonte, cantos e acabamento.
 *
 * - `classico`: o estilo Noite de sempre. Segue o sistema (claro ou escuro).
 * - `padrao-claro` e `padrao-escuro`: a versão "E · Padrão" da documentação de design
 *   (`docs/estilos-visuais-locus.md`): cinza-claro ou preto, cartões arredondados, Figtree.
 *   Ficam fixos num dos dois, sem seguir o sistema.
 *
 * Gravado como preferência (fora do backup, como as outras), e espelhado no aparelho só para a
 * primeira pintura (ver `services/native/tema.ts`).
 */
export type Tema = 'classico' | 'padrao-claro' | 'padrao-escuro'

export const TEMAS: readonly Tema[] = ['classico', 'padrao-claro', 'padrao-escuro']

export const TEMA_PADRAO: Tema = 'classico'

/** Um valor gravado que não é um tema conhecido vale o padrão, em vez de quebrar. */
export function temaOuPadrao(valor: unknown): Tema {
  return TEMAS.find((tema) => tema === valor) ?? TEMA_PADRAO
}

/** Se o tema é uma das versões do "Padrão" (as duas partilham fonte, cantos e estante em cartões). */
export function ehTemaPadrao(tema: Tema): boolean {
  return tema === 'padrao-claro' || tema === 'padrao-escuro'
}
