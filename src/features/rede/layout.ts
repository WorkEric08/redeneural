import type { Conexao, Id, NeuronioNaTela, Ponto } from '@/core'

/**
 * O que a UI da Rede ainda precisa calcular do próprio lado.
 *
 * Onde cada neurônio fica não mora mais aqui — isso é `calcularLayoutDaRede`,
 * em `@/core/motor/redeLayout`, porque agora roda dentro do Worker e o
 * resultado é gravado (posições organizadas por significado, cálculo pesado
 * fora da thread da interface). O que sobra é leve o bastante para rodar
 * direto na tela: contar grau para o tamanho do ponto, e achar quem está
 * debaixo do dedo.
 */

/** O grau de cada neurônio — é o que faz o hub ser desenhado maior. */
export function grausDoMapa(conexoes: readonly Conexao[]): Map<Id, number> {
  const grau = new Map<Id, number>()
  for (const c of conexoes) {
    grau.set(c.aId, (grau.get(c.aId) ?? 0) + 1)
    grau.set(c.bId, (grau.get(c.bId) ?? 0) + 1)
  }
  return grau
}

/**
 * O neurônio sob o dedo, se houver.
 *
 * Percorre do fim para o começo para que o de cima ganhe, e usa um raio de toque
 * maior que o desenhado — 44 px de alvo continuam valendo aqui.
 */
export function neuronioEm(
  ponto: Ponto,
  posicoes: ReadonlyMap<Id, Ponto>,
  ordem: readonly NeuronioNaTela[],
  raioDeToque: number,
): Id | null {
  for (let i = ordem.length - 1; i >= 0; i--) {
    const n = ordem[i]!
    const p = posicoes.get(n.id)
    if (!p) continue

    const dx = p.x - ponto.x
    const dy = p.y - ponto.y
    if (dx * dx + dy * dy <= raioDeToque * raioDeToque) return n.id
  }
  return null
}
