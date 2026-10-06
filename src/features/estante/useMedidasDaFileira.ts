import { useEffect, useState, type RefObject } from 'react'

export interface MedidasDaFileira {
  /** Em px: a lombada é uma % dela, e o título se mede em px (`lombadaNoite.ts`). */
  altura: number
  /**
   * Em px: o que a fileira tem entre as laterais. `null` até a primeira medida —
   * quem usa trata como "ainda não sei" e desenha do tamanho de sempre.
   */
  largura: number | null
}

/**
 * As medidas da fileira, medidas — não calculadas. A fileira se mede pela tela
 * (ver `.movel-fila` em index.css), e repetir a conta aqui deixaria as duas
 * divergirem sem ninguém notar: se a fórmula mudar lá, isto acompanha.
 *
 * A altura serve ao título da lombada. A largura serve às laterais sólidas: a
 * fileira vai de uma lateral à outra (`margin-inline`, igual dos dois lados), então o
 * `contentRect` já é o espaço onde um livro cabe inteiro.
 *
 * Todas as fileiras têm o mesmo tamanho, então basta observar a primeira.
 */
export function useMedidasDaFileira(
  movel: RefObject<HTMLElement | null>,
  alturaInicial = 112,
): MedidasDaFileira {
  const [medidas, setMedidas] = useState<MedidasDaFileira>({
    altura: alturaInicial,
    largura: null,
  })

  useEffect(() => {
    const fila = movel.current?.querySelector('.movel-fila')
    if (!fila) return
    const observador = new ResizeObserver(([entrada]) => {
      if (!entrada) return
      const { height, width } = entrada.contentRect
      setMedidas((m) =>
        m.altura === height && m.largura === width ? m : { altura: height, largura: width },
      )
    })
    observador.observe(fila)
    return () => {
      observador.disconnect()
    }
  }, [movel])

  return medidas
}
