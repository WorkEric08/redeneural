/** `contar(1, 'conexão', 'conexões')` → `1 conexão`. */
export function contar(quantos: number, singular: string, plural: string): string {
  return `${String(quantos)} ${quantos === 1 ? singular : plural}`
}

/** `a`, `a e b`, `a, b e c` — vírgula até o penúltimo, "e" antes do último. */
export function listar(itens: readonly string[]): string {
  if (itens.length <= 1) return itens[0] ?? ''
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]!}`
}
