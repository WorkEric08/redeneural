/**
 * O tema da interface — o conjunto de paleta, fonte, cantos e acabamento.
 *
 * - `classico`: o estilo Noite de sempre. Segue o sistema (claro ou escuro). **É um easter egg**
 *   (14/10/2026): não se escolhe em Ajustes, liga sozinho enquanto existir um livro com o título
 *   "Tema clássico" ou "Clássico" (`ehTituloDoClassico`) e desliga quando esse livro deixa de existir.
 * - `padrao-claro` e `padrao-escuro`: a versão "E · Padrão" da documentação de design
 *   (`docs/estilos-visuais-locus.md`): cinza-claro ou preto, cartões arredondados, Figtree.
 *   Ficam fixos num dos dois, sem seguir o sistema. São as duas que se escolhem em Ajustes.
 *
 * Duas coisas diferentes, por isso dois tipos: o `Tema` **em uso** (os três) e o `TemaEscolhido` (só os
 * dois do Padrão), que é a preferência gravada — vale quando o Clássico não está ligado. A
 * preferência fica fora do backup, como as outras, e o tema em uso é espelhado no aparelho só para a
 * primeira pintura (ver `services/native/tema.ts`).
 */
export type Tema = 'classico' | 'padrao-claro' | 'padrao-escuro'

export const TEMAS: readonly Tema[] = ['classico', 'padrao-claro', 'padrao-escuro']

/** O que se escolhe em Ajustes: as duas versões do Padrão. */
export type TemaEscolhido = 'padrao-claro' | 'padrao-escuro'

export const TEMAS_ESCOLHIVEIS: readonly TemaEscolhido[] = ['padrao-claro', 'padrao-escuro']

export const TEMA_PADRAO: TemaEscolhido = 'padrao-escuro'

/** Um tema em uso gravado (o espelho do aparelho) que não é conhecido vale o padrão. */
export function temaOuPadrao(valor: unknown): Tema {
  return TEMAS.find((tema) => tema === valor) ?? TEMA_PADRAO
}

/**
 * A preferência gravada. Quem tinha o Clássico escolhido (antes de ele virar easter egg) e qualquer
 * valor desconhecido caem no padrão: o Clássico não é mais uma escolha.
 */
export function temaEscolhidoOuPadrao(valor: unknown): TemaEscolhido {
  return TEMAS_ESCOLHIVEIS.find((tema) => tema === valor) ?? TEMA_PADRAO
}

/** Se o tema é uma das versões do "Padrão" (as duas partilham fonte, cantos e estante em cartões). */
export function ehTemaPadrao(tema: Tema): boolean {
  return tema === 'padrao-claro' || tema === 'padrao-escuro'
}

/**
 * Os títulos que ligam o Clássico, já sem acento, caixa, espaço nem pontuação (ver `ehTituloDoClassico`).
 */
const TITULOS_DO_CLASSICO: ReadonlySet<string> = new Set(['classico', 'temaclassico'])

/**
 * O título de um livro liga o tema Clássico? Vale "Tema clássico" e "Clássico", **escritos de qualquer
 * jeito**: com ou sem acento ("classico", "classíco"), em qualquer caixa ("CLÁSSICO"), com espaços
 * a mais, hífen, sublinhado ou ponto ("tema-clássico", "Tema_Classico", "  tema   clássico. "),
 * junto ("temaclassico") e até com enfeite ao redor ("🎨 Clássico"). Letras e números são tudo que
 * conta: "Clássico 2" ou "Tema clássico do trabalho" **não** ligam.
 */
export function ehTituloDoClassico(titulo: string): boolean {
  const chave = titulo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return TITULOS_DO_CLASSICO.has(chave)
}

/** O tema em uso: o Clássico enquanto houver livro com o título dele; senão, o escolhido. */
export function temaEmUso(escolhido: TemaEscolhido, livros: readonly { titulo: string }[]): Tema {
  return livros.some((l) => ehTituloDoClassico(l.titulo)) ? 'classico' : escolhido
}
