import { useEffect, useState, type RefObject } from 'react'

/**
 * A altura da fileira em px, medida. A lombada é uma % da fileira, e a fileira
 * se mede pela tela (ver `.movel-fila` em index.css) — mas o título da lombada
 * precisa de px para escolher o tamanho da letra (`lombadaNoite.ts`). Medir
 * em vez de repetir a conta do CSS: se a fórmula mudar lá, aqui acompanha.
 *
 * Todas as fileiras têm a mesma altura, então basta observar a primeira.
 */
export function useAlturaDaFileira(movel: RefObject<HTMLElement | null>, inicial = 112): number {
  const [altura, setAltura] = useState(inicial)

  useEffect(() => {
    const fila = movel.current?.querySelector('.movel-fila')
    if (!fila) return
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) setAltura(entrada.contentRect.height)
    })
    observador.observe(fila)
    return () => {
      observador.disconnect()
    }
  }, [movel])

  return altura
}
