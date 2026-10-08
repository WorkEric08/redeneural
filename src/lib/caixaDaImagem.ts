import type { CSSProperties } from 'react'

/**
 * A caixa de uma imagem mostrada inteira: exatamente a proporção dela, no máximo a largura do
 * lugar e no máximo `alturaMaxima` (um valor CSS, como `24rem` ou `70dvh`).
 *
 * Caixa e imagem têm a mesma forma, então nada do fundo da caixa aparece nas laterais — uma
 * caixa de largura cheia com altura limitada deixava faixas azuis dos dois lados de uma foto em
 * pé. Limitar a largura por `altura × proporção` é o que faz o limite de altura valer sem
 * deformar a caixa.
 */
export function caixaDaImagem(
  largura: number,
  altura: number,
  alturaMaxima: string,
): CSSProperties {
  const proporcao = largura > 0 && altura > 0 ? largura / altura : 1
  return {
    aspectRatio: `${String(largura)} / ${String(altura)}`,
    width: `min(100%, calc(${alturaMaxima} * ${String(Math.round(proporcao * 10000) / 10000)}))`,
  }
}
