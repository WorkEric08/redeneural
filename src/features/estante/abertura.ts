/**
 * A geometria de abrir um livro: de onde ele sai, de que tamanho chega e onde
 * para. Quem anima é `AberturaDoLivro.tsx`; aqui só há números.
 *
 * O livro é uma caixa 3D de verdade — capa, lombada e miolo —, e parte virado
 * de lombada para quem olha, **exatamente em cima da lombada da estante**. É o
 * próprio livro que sai da prateleira, não um desenho que aparece no lugar.
 */

export interface Caixa {
  left: number
  top: number
  width: number
  height: number
}

/** A profundidade da cena, em px — a mesma `perspective` de `.abertura` no CSS. */
export const PERSPECTIVA = 1600

/** Largura sobre altura da capa: um livro em pé, não um cartaz. */
const PROPORCAO_DA_CAPA = 0.68

export interface Abertura {
  /** A capa do livro fechado, no meio da tela. */
  largura: number
  altura: number
  /** A grossura: a lombada na mesma proporção da que estava na prateleira. */
  grossura: number
  /**
   * A pose de partida: deslocamento do centro da tela e escala. `escalaX` só
   * difere de `escala` quando a grossura bateu no limite — aí a lombada de
   * partida é esticada na horizontal para ter a largura exata da estante, e o
   * esticão some durante o voo.
   */
  partida: { x: number; y: number; escala: number; escalaX: number }
  /**
   * Aberto, a capa vai para a esquerda e o par de páginas fica uma capa mais
   * largo — o livro anda meia capa para a direita para o par ficar no meio.
   */
  deslocamentoAberto: number
  /**
   * Quantas vezes a lombada 3D é mais alta que a da estante. O título dela
   * cresce na mesma medida, para que, encolhido na partida, tenha o tamanho
   * exato do título da prateleira.
   */
  aumentoDaLombada: number
}

function entre(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo)
}

export function geometriaDaAbertura(
  lombada: Caixa,
  larguraDaTela: number,
  alturaDaTela: number,
): Abertura {
  // Aberto, o livro ocupa duas capas de largura, e as duas têm de caber na tela.
  const largura = Math.min(alturaDaTela * 0.56 * PROPORCAO_DA_CAPA, larguraDaTela * 0.44, 300)
  const altura = largura / PROPORCAO_DA_CAPA
  const grossura = entre(
    (altura * lombada.width) / Math.max(1, lombada.height),
    altura * 0.08,
    altura * 0.3,
  )

  // De lombada para quem olha, a face da lombada fica meia capa mais perto da
  // tela, e a perspectiva a aumenta. A escala e a posição de partida descontam
  // isso: é o que faz a lombada 3D cair em cima da lombada da estante, e não um
  // pouco maior e fora do lugar.
  const escala =
    (lombada.height * PERSPECTIVA) / (altura * PERSPECTIVA + (lombada.height * largura) / 2)
  const recuo = (PERSPECTIVA - (escala * largura) / 2) / PERSPECTIVA
  const aumento = 1 / recuo

  return {
    largura,
    altura,
    grossura,
    partida: {
      x: (lombada.left + lombada.width / 2 - larguraDaTela / 2) * recuo,
      y: (lombada.top + lombada.height / 2 - alturaDaTela / 2) * recuo,
      escala,
      escalaX: lombada.width / (grossura * aumento),
    },
    deslocamentoAberto: largura / 2,
    aumentoDaLombada: altura / Math.max(1, lombada.height),
  }
}
