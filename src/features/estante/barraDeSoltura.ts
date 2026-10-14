import {
  escalaDaPilha,
  FOLGA_ENTRE_LUGARES,
  larguraDoLivroGravado,
  type Prateleira,
} from './prateleiras'

/**
 * A barra branca que mostra, durante o arrasto, onde o livro na mão fica se soltar agora.
 *
 * Mede-se no mesmo desenho de prateleiras que a soltura gravaria (as larguras já ajustadas às
 * laterais), e não no que está na tela: a prévia ao vivo só abre o lugar depois de o dedo assentar, e
 * a barra tem que aparecer desde o primeiro instante.
 */
export interface BarraDeSoltura {
  prateleira: number
  /**
   * `vertical` para o livro de pé — na borda esquerda do lugar onde ele cai, com a altura dele — e
   * `horizontal` para o deitado — sobre o topo dele, com o comprimento dele.
   */
  eixo: 'vertical' | 'horizontal'
  /** Do lado esquerdo da fileira até a barra (a esquerda dela, no horizontal), em px. */
  esquerda: number
  /** O tamanho da barra: a altura do livro de pé, ou o comprimento do deitado, em px. */
  comprimento: number
  /** Só no horizontal: a altura do fio, contada do pé da fileira, em px. */
  base: number
}

export interface PedidoDeBarra {
  prateleiras: readonly Prateleira[]
  /** O lugar onde o livro cai. */
  prateleira: number
  indice: number
  livroId: string
  deitado: boolean
  /** Quanto o livro mede: a altura do de pé ou a extensão do deitado, em px. */
  comprimento: number
  alturaDaFileira: number
}

export function barraDeSoltura({
  prateleiras,
  prateleira,
  indice,
  livroId,
  deitado,
  comprimento,
  alturaDaFileira,
}: PedidoDeBarra): BarraDeSoltura | null {
  const lugares = prateleiras[prateleira]?.lugares
  if (!lugares) return null

  let esquerda = 0
  for (const lugar of lugares) {
    if (lugar.indice !== indice) {
      esquerda += lugar.largura + FOLGA_ENTRE_LUGARES
      continue
    }

    if (!deitado) return { prateleira, eixo: 'vertical', esquerda, comprimento, base: 0 }

    // O livro deitado fica centrado no lugar, e o fio passa pelo topo dele: em cima dos que estão
    // embaixo na pilha e do próprio livro. Num lugar que ainda não é pilha, é o pé da fileira.
    let base = 0
    if (lugar.tipo === 'pilha') {
      const escala = escalaDaPilha(
        lugar.itens.map((i) => larguraDoLivroGravado(i.livro)),
        alturaDaFileira,
      )
      const espessuras = lugar.itens.map(
        (i) => Math.round(larguraDoLivroGravado(i.livro) * escala * 10) / 10,
      )
      const meu = lugar.itens.findIndex((i) => i.livro.id === livroId)
      const ate = meu >= 0 ? meu + 1 : espessuras.length
      base = espessuras.slice(0, ate).reduce((soma, e) => soma + e, 0)
    }
    return {
      prateleira,
      eixo: 'horizontal',
      esquerda: Math.max(0, esquerda + (lugar.largura - comprimento) / 2),
      comprimento,
      base,
    }
  }
  return null
}
