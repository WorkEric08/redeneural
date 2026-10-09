/** Quanto de folga conta como "chegou na ponta": subpixel e arredondamento não valem. */
const TOLERANCIA_PX = 2

export interface BordasDaFaixa {
  /** Há opções escondidas à esquerda. */
  esquerda: boolean
  /** Há opções escondidas à direita. */
  direita: boolean
}

/**
 * Onde uma fileira que rola de lado ainda tem o que mostrar: à esquerda (já foi rolada) e/ou à
 * direita (continua). É o que decide quais setas e esmaecidos aparecem nas pontas dela.
 */
export function bordasDaFaixa(
  scrollLeft: number,
  larguraVisivel: number,
  larguraTotal: number,
): BordasDaFaixa {
  return {
    esquerda: scrollLeft > TOLERANCIA_PX,
    direita: scrollLeft + larguraVisivel < larguraTotal - TOLERANCIA_PX,
  }
}
