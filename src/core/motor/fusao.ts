/** Fusão dos dois votos — embedding e reranker — num score único. */

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

/**
 * Escala **fixa**, não min/max do conjunto.
 *
 * Se o intervalo fosse normalizado pelo mínimo e máximo observados, adicionar um
 * neurônio reembaralharia o score de todos os outros. Com divisor constante, o
 * score de um par só muda quando aquele par muda.
 */
export function escalaEmbedding(cos: number, escalaEmb: number): number {
  if (!(escalaEmb > 0)) throw new Error(`escalaEmb precisa ser > 0, veio ${escalaEmb}`)
  return Math.min(1, Math.max(0, cos / escalaEmb))
}

/** `rr === null` significa reranker indisponível: o embedding decide sozinho. */
export function fundir(embS: number, rr: number | null, pesoEmb: number): number {
  if (rr === null) return embS
  return pesoEmb * embS + (1 - pesoEmb) * rr
}
