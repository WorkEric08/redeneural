import type { CSSProperties } from 'react'

import { INTENSIDADE_DA_LUZ_PADRAO, type Livro } from '@/core'

/**
 * As duas cores de um pano: a real e a lavada pela luz da sala. A folha escolhe
 * qual mostrar pelo estado da lombada — de longe se vê a lavada; puxado para
 * perto, a real. É a ideia que o CLAUDE.md guardava para a passada final
 * ("distância desbota") virando comportamento.
 *
 * `intensidadeDaLuz` (0-100, ajustável em Ajustes desde a Fase 17) é o quanto
 * da mistura vira a cor da luz — o resto é a cor real do pano.
 */
export function pano(
  cor: string,
  intensidadeDaLuz: number = INTENSIDADE_DA_LUZ_PADRAO,
): CSSProperties {
  return {
    '--pano': cor,
    '--pano-lavado': `color-mix(in oklab, ${cor} ${String(100 - intensidadeDaLuz)}%, var(--lavagem))`,
  } as CSSProperties
}

/**
 * Os panos de encadernação que um livro novo pode ter.
 *
 * Hex, e não token do tema: `cor` é dado do livro, viaja no backup e não muda
 * com claro e escuro — quem segue o tema é a lavagem aplicada por cima (ver
 * CLAUDE.md, "A estante"). Os três primeiros são os do seed.
 *
 * Até 14/09/2026 nenhum caía na faixa do ouro, para um livro amarelado não se
 * confundir com uma ponte. Desde 15/09/2026 a ponte é azul claro (pedido do
 * usuário — ver CLAUDE.md, "A ponte muda de ouro para azul"), e **este risco
 * voltou**: "Azul" e "Ardósia" agora caem perto da faixa da ponte — sinalizado
 * ao usuário, decisão dele manter ou trocar. Todos são tons de pano, meio
 * apagados — sob a luz da sala uma cor pura não desbota, grita.
 */
export const PANOS = [
  { nome: 'Violeta', cor: '#7b6ae0' },
  { nome: 'Verde-azulado', cor: '#3e9a93' },
  { nome: 'Terracota', cor: '#c8734a' },
  { nome: 'Azul', cor: '#5b7fd6' },
  { nome: 'Vinho', cor: '#a8566f' },
  { nome: 'Musgo', cor: '#5e8f5a' },
  { nome: 'Couro', cor: '#8b6a55' },
  { nome: 'Ardósia', cor: '#6f7f96' },
] as const

/**
 * O primeiro pano que ainda nenhum livro usa, para o novo já nascer diferente
 * dos vizinhos. Com todos em uso, a volta recomeça pela quantidade de livros.
 */
export function panoSugerido(livros: readonly Pick<Livro, 'cor'>[]): string {
  const usadas = new Set(livros.map((l) => l.cor.toLowerCase()))
  const livre = PANOS.find((p) => !usadas.has(p.cor))
  return (livre ?? PANOS[livros.length % PANOS.length] ?? PANOS[0]).cor
}
