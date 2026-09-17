/**
 * Altura da lombada, escolhida na mão — em % da fileira, o mesmo mundo da
 * altura automática (`ALTURA_MINIMA`/`ALTURA_MAXIMA` em Lombada.tsx, 63 a
 * 93.5%, derivada da quantidade de neurônios).
 *
 * Nomeada e discreta, como a largura: "quão alto é este livro" se lê melhor
 * como curto/normal/alto/enorme do que como um número de porcentagem.
 */

export interface OpcaoDeComprimento {
  chave: string
  rotulo: string
  percentual: number
}

export const COMPRIMENTOS: readonly OpcaoDeComprimento[] = [
  { chave: 'curto', rotulo: 'Curto', percentual: 55 },
  { chave: 'normal', rotulo: 'Normal', percentual: 72 },
  { chave: 'alto', rotulo: 'Alto', percentual: 88 },
  { chave: 'enorme', rotulo: 'Enorme', percentual: 98 },
] as const

/** O padrão de um livro novo (pedido do usuário, 16/09/2026): comprimento normal, não automático. */
export const COMPRIMENTO_PADRAO = COMPRIMENTOS.find((c) => c.chave === 'normal')!.percentual
