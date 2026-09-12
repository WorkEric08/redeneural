import { useCallback, useSyncExternalStore } from 'react'

/**
 * Uma media query como estado.
 *
 * Existe porque há uma decisão de comportamento — e não só de aparência — presa
 * à largura: abaixo de 1024 px a navegação é o dial; daí para cima é a coluna
 * fixa. CSS resolve o que aparece, não qual gesto o botão escuta.
 */
export function useMediaQuery(consulta: string): boolean {
  const assinar = useCallback(
    (avisar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => {
        lista.removeEventListener('change', avisar)
      }
    },
    [consulta],
  )

  return useSyncExternalStore(assinar, () => window.matchMedia(consulta).matches)
}
