export interface Medida {
  largura: number
  altura: number
}

/**
 * A medida que cabe num quadrado de `ladoMaximo`, na mesma proporção. Nunca
 * amplia: uma imagem que já cabe fica do tamanho que tem.
 */
export function medidaReduzida(largura: number, altura: number, ladoMaximo: number): Medida {
  const maior = Math.max(largura, altura)
  if (maior <= ladoMaximo) return { largura, altura }

  const fator = ladoMaximo / maior
  return {
    largura: Math.max(1, Math.round(largura * fator)),
    altura: Math.max(1, Math.round(altura * fator)),
  }
}
