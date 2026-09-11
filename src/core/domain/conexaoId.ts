import type { Conexao, Id } from './types'

/**
 * Id canônico de uma aresta: o par ordenado, sempre na mesma direção.
 * Assim "A conectou com B" e "B conectou com A" são a mesma linha no banco,
 * e gravar duas vezes é idempotente.
 */
export function conexaoId(x: Id, y: Id): Id {
  const [a, b] = ordenarPar(x, y)
  return `${a}::${b}`
}

export function ordenarPar(x: Id, y: Id): [Id, Id] {
  return x < y ? [x, y] : [y, x]
}

/** True se a aresta toca o neurônio informado. */
export function tocaNeuronio(c: Conexao, neuronioId: Id): boolean {
  return c.aId === neuronioId || c.bId === neuronioId
}

/** O outro lado da aresta, visto de `neuronioId`. */
export function outroLado(c: Conexao, neuronioId: Id): Id {
  return c.aId === neuronioId ? c.bId : c.aId
}
