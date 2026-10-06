/**
 * As contas do visor de imagens (07/10/2026): para qual imagem vai o gesto, e quanto a pista
 * acompanha o dedo. Puro e fora do componente (CLAUDE.md regra 9).
 */

/** Andou mais que isto (px) e soltou: troca de imagem, mesmo devagar. */
export const DESLOCAMENTO_PARA_TROCAR_PX = 56

/** Soltou rápido (px/ms): troca mesmo com pouco deslocamento — o gesto de "jogar para o lado". */
export const VELOCIDADE_PARA_TROCAR = 0.45

/** Andou menos que isto (px): foi um toque, e não um arrasto. */
export const TOLERANCIA_DO_TOQUE_PX = 6

/** Passou do fim da fila: a pista só segue uma fração do dedo, como a folha elástica. */
const RESISTENCIA_NO_FIM = 0.3

function dentro(indice: number, total: number): number {
  return Math.min(Math.max(0, indice), Math.max(0, total - 1))
}

/**
 * A imagem que fica depois de soltar o dedo. `deslocamento` é o quanto o dedo andou
 * (negativo: para a esquerda, que mostra a próxima) e `velocidade`, em px/ms, tem o mesmo
 * sinal. Nunca passa do começo nem do fim.
 */
export function indiceDepoisDoGesto(entrada: {
  indice: number
  total: number
  deslocamento: number
  velocidade: number
}): number {
  const { indice, total, deslocamento, velocidade } = entrada
  const rapido = Math.abs(velocidade) >= VELOCIDADE_PARA_TROCAR
  const longe = Math.abs(deslocamento) >= DESLOCAMENTO_PARA_TROCAR_PX
  if (!rapido && !longe) return dentro(indice, total)

  // Rápido, vale a direção da velocidade; senão, a do deslocamento.
  const sentido = (rapido ? velocidade : deslocamento) < 0 ? 1 : -1
  return dentro(indice + sentido, total)
}

/** Quanto a pista anda: o dedo inteiro no meio da fila, e uma fração tentando passar do fim. */
export function deslocamentoDaPista(entrada: {
  indice: number
  total: number
  deslocamento: number
}): number {
  const { indice, total, deslocamento } = entrada
  const noComeco = indice <= 0 && deslocamento > 0
  const noFim = indice >= total - 1 && deslocamento < 0
  return noComeco || noFim ? deslocamento * RESISTENCIA_NO_FIM : deslocamento
}
