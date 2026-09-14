/**
 * Intensidade da luz da sala sobre a lombada em repouso — 0 mostra a cor real
 * do pano mesmo de longe, 100 deixa a cor quase só a da luz (ver `panos.ts`,
 * "distância desbota"). Ajustável em Ajustes desde a Fase 17; gravada como
 * preferência, no mesmo lugar de `quantidadeDePrateleiras`.
 */
export const INTENSIDADE_DA_LUZ_PADRAO = 42
export const INTENSIDADE_DA_LUZ_MINIMA = 0
export const INTENSIDADE_DA_LUZ_MAXIMA = 100

export function clampIntensidadeDaLuz(valor: number): number {
  return Math.min(INTENSIDADE_DA_LUZ_MAXIMA, Math.max(INTENSIDADE_DA_LUZ_MINIMA, Math.round(valor)))
}
