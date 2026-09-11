/** Álgebra de vetores do motor. Sem dependências, sem I/O — só arrays. */

const EPS = 1e-8

function exigirMesmaDimensao(a: Float32Array, b: Float32Array): void {
  if (a.length !== b.length) {
    throw new Error(`dimensões incompatíveis: ${a.length} e ${b.length}`)
  }
}

export function produtoInterno(a: Float32Array, b: Float32Array): number {
  exigirMesmaDimensao(a, b)
  let soma = 0
  for (let i = 0; i < a.length; i++) soma += a[i]! * b[i]!
  return soma
}

export function norma(v: Float32Array): number {
  return Math.sqrt(produtoInterno(v, v))
}

/** Devolve um vetor novo de norma 1. Um vetor nulo continua nulo. */
export function normalizar(v: Float32Array): Float32Array {
  const n = norma(v)
  const saida = new Float32Array(v.length)
  if (n < EPS) return saida
  for (let i = 0; i < v.length; i++) saida[i] = v[i]! / n
  return saida
}

/** Cosseno entre dois vetores quaisquer. Para vetores já normalizados, use `produtoInterno`. */
export function cosseno(a: Float32Array, b: Float32Array): number {
  return produtoInterno(normalizar(a), normalizar(b))
}

/** Vetor médio do conjunto. */
export function centroide(vetores: readonly Float32Array[]): Float32Array {
  const primeiro = vetores[0]
  if (!primeiro) return new Float32Array(0)

  const soma = new Float32Array(primeiro.length)
  for (const v of vetores) {
    exigirMesmaDimensao(soma, v)
    for (let i = 0; i < soma.length; i++) soma[i] = soma[i]! + v[i]!
  }
  for (let i = 0; i < soma.length; i++) soma[i] = soma[i]! / vetores.length
  return soma
}

/**
 * Subtrai o centroide e re-normaliza.
 *
 * É o passo que remove a "semelhança de fundo" entre textos curtos: sem ele,
 * dois parágrafos quaisquer em português já começam com cosseno alto, e o
 * ranking passa a medir *palavra repetida* em vez de *ideia parecida*.
 *
 * Um vetor que coincide com o centroide vira o vetor nulo — cosseno 0 com todo
 * mundo, que é a resposta honesta para "esse texto não se distingue de nada".
 */
export function centralizar(v: Float32Array, centro: Float32Array): Float32Array {
  exigirMesmaDimensao(v, centro)
  const saida = new Float32Array(v.length)
  for (let i = 0; i < v.length; i++) saida[i] = v[i]! - centro[i]!
  return normalizar(saida)
}
