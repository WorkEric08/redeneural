/**
 * Intensidade da luz da sala sobre a lombada em repouso — 0 mostra a cor real
 * do pano mesmo de longe, 100 deixa a cor quase só a da luz (ver `panos.ts`,
 * "distância desbota"). Ajustável em Ajustes desde a Fase 17; gravada como
 * preferência, no mesmo lugar de `quantidadeDePrateleiras`.
 */
export const INTENSIDADE_DA_LUZ_PADRAO = 42
/**
 * A luz sobre os enfeites tem escala própria (07/10/2026): 0, o padrão, é a cor real — como
 * eram antes de poderem ser ajustados —, e 100 os deixa quase só da cor da luz. O ajuste usa a
 * mesma conta do dos livros (`lavagemEmPercentual`), na mesma faixa.
 */
export const INTENSIDADE_DA_LUZ_DO_ENFEITE_PADRAO = 0
export const INTENSIDADE_DA_LUZ_MINIMA = 0
export const INTENSIDADE_DA_LUZ_MAXIMA = 100

export function clampIntensidadeDaLuz(valor: number): number {
  return Math.min(INTENSIDADE_DA_LUZ_MAXIMA, Math.max(INTENSIDADE_DA_LUZ_MINIMA, Math.round(valor)))
}
