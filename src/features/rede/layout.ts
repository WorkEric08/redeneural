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
 * O próprio selecionado e todo mundo que tem uma aresta direta com ele — é
 * quem "acende" quando você toca um ponto (ver `desenhar.ts`). `null` sem
 * seleção nenhuma, para o desenho saber que não há nada para apagar.
 */
export function vizinhancaDe(
  selecionado: Id | null,
  conexoes: readonly Conexao[],
): ReadonlySet<Id> | null {
  if (selecionado === null) return null

  const vizinhanca = new Set<Id>([selecionado])
  for (const c of conexoes) {
    if (c.aId === selecionado) vizinhanca.add(c.bId)
    else if (c.bId === selecionado) vizinhanca.add(c.aId)
  }
  return vizinhanca
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

/**
 * O quanto um vizinho de 1 salto acompanha o arrasto **ao vivo**, por unidade
 * de score — só uma pista visual enquanto o dedo se move, não física de
 * verdade. A física de verdade (`calcularLayoutDaRede`, no núcleo) só roda ao
 * soltar, e é o que decide onde a vizinhança realmente deveria ficar.
 */
export const FATOR_DE_ACOMPANHAMENTO = 0.3

export interface NoArrastado {
  id: Id
  /** Onde o nó estava antes de o dedo tocar, para o delta ser sempre relativo a isso. */
  origem: Ponto
  vizinhos: readonly { id: Id; score: number; origem: Ponto }[]
}

/**
 * As posições enquanto o dedo arrasta: o nó segue o dedo exatamente, e cada
 * vizinho de 1 salto anda uma fração do mesmo deslocamento, proporcional a
 * quão forte é a conexão — uma conexão fraca quase não se move.
 */
export function posicoesDoArrasto(alvo: NoArrastado, delta: Ponto): Map<Id, Ponto> {
  const quadro = new Map<Id, Ponto>()
  quadro.set(alvo.id, { x: alvo.origem.x + delta.x, y: alvo.origem.y + delta.y })
  for (const v of alvo.vizinhos) {
    const f = FATOR_DE_ACOMPANHAMENTO * v.score
    quadro.set(v.id, { x: v.origem.x + delta.x * f, y: v.origem.y + delta.y * f })
  }
  return quadro
}

/**
 * Um quadro do assentamento em andamento: `k` (0..1, já passado pela curva de
 * easing) do caminho entre onde a vizinhança parou ao soltar (`inicio`) e onde
 * a física de verdade decidiu que ela deveria ficar (`alvo`). Um id que
 * `alvo` não conhece (não deveria acontecer, mas nunca quebra o desenho) fica
 * parado onde estava.
 */
export function quadroDoAssentamento(
  inicio: ReadonlyMap<Id, Ponto>,
  alvo: Readonly<Record<Id, Ponto>>,
  k: number,
): Map<Id, Ponto> {
  const quadro = new Map<Id, Ponto>()
  for (const [id, de] of inicio) {
    const para = alvo[id] ?? de
    quadro.set(id, { x: de.x + (para.x - de.x) * k, y: de.y + (para.y - de.y) * k })
  }
  return quadro
}

/** Começa rápido e desacelera — o mesmo formato de curva de qualquer coisa
 *  que "assenta" em vez de se mover a velocidade constante. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
