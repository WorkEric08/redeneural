import { RECORTE_DA_COSTA, type Id, type MapaDoPalacio, type Ponto } from '@/core'
import { sorteio } from '@/lib/semente'

/**
 * O que a tela do Mapa calcula do próprio lado: o contorno de cada ilha, onde
 * cada ponto está no mundo, quem está debaixo do dedo e o quanto a câmera está
 * perto. Onde cada coisa fica mora no núcleo (`core/motor/mapa.ts`), gravado.
 */

/** As três ondulações da costa: duas grandes e uma miúda. */
const ONDULACOES = [2, 3, 5] as const

function ondasDaCosta(livroId: Id) {
  const ondas = ONDULACOES.map((k, i) => ({
    k,
    peso: 0.4 + sorteio(livroId, i * 2) * 0.6,
    fase: sorteio(livroId, i * 2 + 1) * 2 * Math.PI,
  }))
  return { ondas, soma: ondas.reduce((s, o) => s + o.peso, 0) }
}

function raioNaOnda(ondas: ReturnType<typeof ondasDaCosta>, raio: number, angulo: number): number {
  // f em [-1, 1]: a soma das ondas dividida pelo maior valor possível.
  const f =
    ondas.ondas.reduce((s, o) => s + o.peso * Math.sin(o.k * angulo + o.fase), 0) / ondas.soma
  return raio * (1 - (RECORTE_DA_COSTA * (1 - f)) / 2)
}

/**
 * A distância do centro até a costa, num ângulo. Varia entre
 * `raio × (1 − recorte)` e `raio` — os pontos moram dentro da parte de dentro
 * (o núcleo garante), e a ilha nunca passa do raio, que é o que o mar entre as
 * ilhas conta. É o que faz uma ponte terminar exatamente na praia.
 */
export function raioDaCosta(livroId: Id, raio: number, angulo: number): number {
  return raioNaOnda(ondasDaCosta(livroId), raio, angulo)
}

/**
 * A costa de uma ilha, em volta do centro (coordenadas relativas). Orgânica e
 * sempre a mesma: cada livro tem a sua, tirada da semente do id.
 */
export function contornoDaIlha(livroId: Id, raio: number, passos = 72): Ponto[] {
  const ondas = ondasDaCosta(livroId)
  const pontos: Ponto[] = []
  for (let i = 0; i < passos; i++) {
    const t = (i / passos) * 2 * Math.PI
    const r = raioNaOnda(ondas, raio, t)
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

/** A ilha em cuja terra o toque caiu — pela costa de verdade, não pelo círculo. */
export function ilhaEm(ponto: Ponto, mapa: MapaDoPalacio): Id | null {
  for (const [livroId, ilha] of Object.entries(mapa.ilhas)) {
    const dx = ponto.x - ilha.centro.x
    const dy = ponto.y - ilha.centro.y
    const d = Math.hypot(dx, dy)
    if (d > ilha.raio) continue
    if (d <= raioDaCosta(livroId, ilha.raio, Math.atan2(dy, dx))) return livroId
  }
  return null
}

/** A caixa que enquadra o mapa inteiro: as bordas de cada ilha. */
export function bordasDoMapa(mapa: MapaDoPalacio): Ponto[] {
  return Object.values(mapa.ilhas).flatMap((ilha) => [
    { x: ilha.centro.x - ilha.raio, y: ilha.centro.y - ilha.raio },
    { x: ilha.centro.x + ilha.raio, y: ilha.centro.y + ilha.raio },
  ])
}

/**
 * A partir deste zoom a câmera está **perto de uma ilha**: aparecem os pontos,
 * as trilhas e os nomes dos neurônios, e todas as pontes. Abaixo, o mapa é
 * visto **de longe** — só ilhas e as pontes mais fortes de cada uma.
 *
 * Um número só, e não relativo ao palácio: os pontos ficam a 22 do mundo um do
 * outro em qualquer ilha (`DISTANCIA_ENTRE_PONTOS`), e aqui eles já ficam a uns
 * 20 px na tela — o bastante para serem pontos, e não uma mancha.
 */
export const ESCALA_DE_PERTO = 0.9
/** Onde os pontos começam a aparecer, para não surgirem de uma vez no limiar. */
const ESCALA_DE_APARECER = 0.65

/** 0 de longe, 1 de perto, e uma subida suave entre os dois. */
export function presencaDePerto(escala: number): number {
  const t = (escala - ESCALA_DE_APARECER) / (ESCALA_DE_PERTO - ESCALA_DE_APARECER)
  const k = Math.min(1, Math.max(0, t))
  return k * k * (3 - 2 * k)
}
