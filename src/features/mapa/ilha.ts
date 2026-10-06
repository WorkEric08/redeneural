import type { Id, MapaDoPalacio, Ponto } from '@/core'

/**
 * O que a tela do Mapa calcula do próprio lado: onde cada ponto está no mundo,
 * quem está debaixo do dedo e o quanto a câmera está perto. A ilha é um
 * hexágono regular (05/10/2026; era um círculo desde 02/10) com o **raio como
 * apótema**: a distância do centro ao meio de cada lado. Assim o hexágono contém
 * o círculo que o núcleo usa para pontos e espaçamento (`core/motor/mapa.ts`,
 * gravado), e nada do que já estava dentro de uma ilha passa a ficar fora.
 */

/** Do apótema ao vértice de um hexágono regular: 1 / cos 30°. */
export const RAZAO_DO_VERTICE = 2 / Math.sqrt(3)

/**
 * Hexágono de lado horizontal em cima e embaixo (vértices à esquerda e à
 * direita): dentro quando o ponto está aquém dos três pares de lados, cujas
 * normais ficam a 90°, 30° e −30°.
 */
export function dentroDoHexagono(ponto: Ponto, centro: Ponto, apotema: number): boolean {
  const x = Math.abs(ponto.x - centro.x)
  const y = Math.abs(ponto.y - centro.y)
  return y <= apotema && x * (Math.sqrt(3) / 2) + y / 2 <= apotema
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

/** A ilha em cuja terra o toque caiu. */
export function ilhaEm(ponto: Ponto, mapa: MapaDoPalacio): Id | null {
  for (const [livroId, ilha] of Object.entries(mapa.ilhas)) {
    if (dentroDoHexagono(ponto, ilha.centro, ilha.raio)) return livroId
  }
  return null
}

/** A caixa que enquadra o mapa inteiro: as bordas de cada ilha. */
export function bordasDoMapa(mapa: MapaDoPalacio): Ponto[] {
  return Object.values(mapa.ilhas).flatMap((ilha) => {
    const lado = ilha.raio * RAZAO_DO_VERTICE
    return [
      { x: ilha.centro.x - lado, y: ilha.centro.y - ilha.raio },
      { x: ilha.centro.x + lado, y: ilha.centro.y + ilha.raio },
    ]
  })
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
