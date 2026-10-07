/**
 * A luz da estante — duas preferências, uma para os livros e outra para os enfeites, cada uma
 * de 0 a 100 (Ajustes, Estante).
 *
 * **50 é o meio e mostra as cores reais** (07/10/2026). Abaixo dele a luz some e a sombra cresce;
 * acima, a luz cresce. O que "sombra" e "luz" fazem em cada coisa (livro, enfeite, fundo da
 * estante) é de quem desenha (`features/estante/lombadaNoite.ts`); aqui só se diz o quanto de
 * cada uma, de 0 a 1.
 *
 * Gravadas em `meta.preferencias`, no mesmo lugar de `quantidadeDePrateleiras`.
 */
export const INTENSIDADE_DA_LUZ_PADRAO = 50
export const INTENSIDADE_DA_LUZ_MINIMA = 0
export const INTENSIDADE_DA_LUZ_MAXIMA = 100

export function clampIntensidadeDaLuz(valor: number): number {
  return Math.min(INTENSIDADE_DA_LUZ_MAXIMA, Math.max(INTENSIDADE_DA_LUZ_MINIMA, Math.round(valor)))
}

/** Quanto de sombra há: 0 de 50 para cima, 1 no 0. */
export function sombraDaLuz(intensidade: number): number {
  const lado = INTENSIDADE_DA_LUZ_PADRAO - INTENSIDADE_DA_LUZ_MINIMA
  return Math.min(1, Math.max(0, (INTENSIDADE_DA_LUZ_PADRAO - intensidade) / lado))
}

/** Quanto de luz a mais há: 0 de 50 para baixo, 1 no 100. */
export function brilhoDaLuz(intensidade: number): number {
  const lado = INTENSIDADE_DA_LUZ_MAXIMA - INTENSIDADE_DA_LUZ_PADRAO
  return Math.min(1, Math.max(0, (intensidade - INTENSIDADE_DA_LUZ_PADRAO) / lado))
}
