import { useEffect, type RefObject } from 'react'

/**
 * O que um canvas do app precisa para acompanhar a página: as cores do tema
 * (o canvas não entende `var()`) e repintar quando a tela muda de tamanho ou de
 * tema. Dividido entre a Rede e o Mapa.
 */

/** Lê um token do design system já resolvido em rgb — o canvas não entende `var()`. */
export function lerCor(el: HTMLElement, token: string): string {
  const anterior = el.style.color
  el.style.color = `var(${token})`
  const cor = getComputedStyle(el).color
  el.style.color = anterior
  return cor
}

/**
 * Repinta ao girar o celular ou mudar o tamanho da janela, e ao trocar de
 * tema. O canvas não tem cascata: as cores viraram pixels na última pintura e
 * ficam lá — `aoTrocarDeTema` é onde quem usa esquece as cores que leu, antes
 * de pintar de novo. Precisa ser estável (`useCallback`), senão a inscrição se
 * refaz a cada render.
 */
export function useRepintarAoMudar(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  pintar: () => void,
  aoTrocarDeTema: () => void,
): void {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const repintar = (): void => {
      pintar()
    }

    // `resize` além do observador: girar o celular é o caso que mais importa
    // aqui, e nem toda WebView entrega o ResizeObserver de forma confiável.
    const observador = new ResizeObserver(repintar)
    observador.observe(canvas)
    window.addEventListener('resize', repintar)

    return () => {
      observador.disconnect()
      window.removeEventListener('resize', repintar)
    }
  }, [canvasRef, pintar])

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const trocou = (): void => {
      aoTrocarDeTema()
      pintar()
    }

    consulta.addEventListener('change', trocou)
    return () => {
      consulta.removeEventListener('change', trocou)
    }
  }, [pintar, aoTrocarDeTema])
}

const SPRITES_DE_NEVOA = new Map<string, HTMLCanvasElement>()

/**
 * Um chumaço de névoa na cor pedida: um degradê redondo, do quase cheio no
 * meio ao nada na borda. Desenhado uma vez por cor e reaproveitado — a Rede
 * repinta a cada quadro com o balanço, e um degradê novo por ideia adormecida
 * a cada quadro pesaria numa WebView.
 *
 * O degradê é feito em branco e só depois tingido (`source-in`): degradê de
 * uma cor para `transparent` pode escurecer a borda, conforme o navegador.
 */
export function spriteDeNevoa(cor: string): HTMLCanvasElement {
  const pronto = SPRITES_DE_NEVOA.get(cor)
  if (pronto) return pronto

  const lado = 64
  const sprite = document.createElement('canvas')
  sprite.width = lado
  sprite.height = lado
  const ctx = sprite.getContext('2d')
  if (ctx) {
    const meio = lado / 2
    const degrade = ctx.createRadialGradient(meio, meio, 0, meio, meio, meio)
    degrade.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
    degrade.addColorStop(0.45, 'rgba(255, 255, 255, 0.45)')
    degrade.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = degrade
    ctx.fillRect(0, 0, lado, lado)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = cor
    ctx.fillRect(0, 0, lado, lado)
  }
  SPRITES_DE_NEVOA.set(cor, sprite)
  return sprite
}
