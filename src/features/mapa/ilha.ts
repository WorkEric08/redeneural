import { RECORTE_DA_COSTA, type Id, type MapaDoPalacio, type Ponto } from '@/core'
import { sorteio } from '@/lib/semente'

/**
 * O que a tela do Mapa calcula do próprio lado: o contorno de cada ilha, onde
 * cada ponto está no mundo, e quem está debaixo do dedo. Onde cada coisa fica
 * mora no núcleo (`core/motor/mapa.ts`), gravado.
 */

/** As três ondulações da costa: duas grandes e uma miúda. */
const ONDULACOES = [2, 3, 5] as const

/**
 * A costa de uma ilha, em volta do centro (coordenadas relativas). Orgânica e
 * sempre a mesma: cada livro tem a sua, tirada da semente do id. Varia entre
 * `raio × (1 − recorte)` e `raio` — os pontos moram dentro da parte de dentro
 * (o núcleo garante), e a ilha nunca passa do raio, que é o que o mar entre as
 * ilhas conta.
 */
export function contornoDaIlha(livroId: Id, raio: number, passos = 72): Ponto[] {
  const ondas = ONDULACOES.map((k, i) => ({
    k,
    peso: 0.4 + sorteio(livroId, i * 2) * 0.6,
    fase: sorteio(livroId, i * 2 + 1) * 2 * Math.PI,
  }))
  const somaDosPesos = ondas.reduce((s, o) => s + o.peso, 0)

  const pontos: Ponto[] = []
  for (let i = 0; i < passos; i++) {
    const t = (i / passos) * 2 * Math.PI
    // f em [-1, 1]: a soma das ondas dividida pelo maior valor possível.
    const f = ondas.reduce((s, o) => s + o.peso * Math.sin(o.k * t + o.fase), 0) / somaDosPesos
    const r = raio * (1 - (RECORTE_DA_COSTA * (1 - f)) / 2)
    pontos.push({ x: Math.cos(t) * r, y: Math.sin(t) * r })
  }
  return pontos
}

/** Onde cada neurônio está no mundo do Mapa: o centro da ilha mais o lugar dele nela. */
export function pontosAbsolutos(mapa: MapaDoPalacio): Map<Id, Ponto> {
  const absolutos = new Map<Id, Ponto>()
  for (const ilha of Object.values(mapa.ilhas)) {
    for (const [id, p] of Object.entries(ilha.pontos)) {
      absolutos.set(id, { x: ilha.centro.x + p.x, y: ilha.centro.y + p.y })
    }
  }
  return absolutos
}

/** O neurônio mais perto do toque, dentro do raio — `null` no mar ou na terra vazia. */
export function neuronioNoMapaEm(
  ponto: Ponto,
  absolutos: ReadonlyMap<Id, Ponto>,
  raioDeToque: number,
): Id | null {
  let melhor: { id: Id; d: number } | null = null
  for (const [id, p] of absolutos) {
    const d = Math.hypot(p.x - ponto.x, p.y - ponto.y)
    if (d > raioDeToque) continue
    if (melhor === null || d < melhor.d || (d === melhor.d && id < melhor.id)) melhor = { id, d }
  }
  return melhor?.id ?? null
}

/** A caixa que enquadra o mapa inteiro: as bordas de cada ilha. */
export function bordasDoMapa(mapa: MapaDoPalacio): Ponto[] {
  return Object.values(mapa.ilhas).flatMap((ilha) => [
    { x: ilha.centro.x - ilha.raio, y: ilha.centro.y - ilha.raio },
    { x: ilha.centro.x + ilha.raio, y: ilha.centro.y + ilha.raio },
  ])
}
