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
 * A fonte dos títulos desenhados no canvas (nome de ilha, etiqueta do neurônio escolhido). O
 * clássico usa a serifa do sistema e o versalete nos nomes de ilha, como as cartas de mapa; o
 * tema Padrão (tema-padrao.css) define `--fonte-canvas-titulo` e desliga o versalete.
 */
export function lerFonteDoCanvas(el: HTMLElement): {
  fonteTitulo: string
  versalete: boolean
  padrao: boolean
} {
  const estilo = getComputedStyle(el)
  return {
    fonteTitulo:
      estilo.getPropertyValue('--fonte-canvas-titulo').trim() || 'ui-serif, Georgia, serif',
    versalete: estilo.getPropertyValue('--canvas-versalete').trim() !== 'nao',
    padrao: estilo.getPropertyValue('--canvas-padrao').trim() === 'sim',
  }
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

    // O tema escolhido em Ajustes também troca as cores (`<html data-tema>`, ver
    // services/native/tema.ts) — sem o sistema ter mudado nada.
    const observador = new MutationObserver(trocou)
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-tema'],
    })

    return () => {
      consulta.removeEventListener('change', trocou)
      observador.disconnect()
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

/** A sombra curta das etiquetas do Padrão, ou `null` onde o fundo é escuro e ela não se vê. */
export function sombraDaEtiqueta(el: HTMLElement): string | null {
  const valor = getComputedStyle(el).getPropertyValue('--sombra-da-etiqueta').trim()
  return valor === '' || valor === 'transparent' ? null : valor
}

export interface CaixaDeTela {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * A etiqueta do tema Padrão (docs/estilos-visuais-locus.md, "Rede" e "Mapa"): o nome num retângulo de
 * canto de 12 px, 3 px de ar em cima e embaixo e 10 px dos lados, com uma sombra curta quando o
 * fundo é claro. Em pixels de tela. `x` é o começo (ou o meio, com `centro`) e `y` o meio da altura.
 * Devolve a caixa que ocupou, para quem põe os nomes não deixar um bater no outro.
 */
export function etiquetaDoPadrao(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  o: {
    fonte: string
    cor: string
    fundo: string
    sombra: string | null
    centro?: boolean
    /** A borda direita da tela: uma etiqueta que passaria dela vira para a esquerda do ponto. */
    limite?: number
  },
): CaixaDeTela {
  ctx.save()
  ctx.font = o.fonte
  const largura = ctx.measureText(texto).width + 20
  const altura = parseFloat(o.fonte.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? '12') + 8
  let x0 = o.centro === true ? x - largura / 2 : x
  if (o.limite !== undefined && o.centro !== true && x0 + largura > o.limite - 8)
    x0 = x - 36 - largura
  const y0 = y - altura / 2

  if (o.sombra !== null) {
    ctx.shadowColor = o.sombra
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 1
  }
  ctx.fillStyle = o.fundo
  ctx.beginPath()
  ctx.roundRect(x0, y0, largura, altura, 12)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = o.cor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(texto, x0 + 10, y + 0.5)
  ctx.restore()
  return { x0, y0, x1: x0 + largura, y1: y0 + altura }
}

/**
 * O ponto escolhido no tema Padrão: um miolo cheio, uma volta da cor do fundo e um anel fino por
 * fora — o "alvo" das pranchas. `px` é um pixel de tela em unidades do desenho.
 */
export function alvoDoPadrao(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  px: number,
  cores: { cheio: string; fundo: string },
): void {
  ctx.save()
  ctx.globalAlpha = 1
  ctx.fillStyle = cores.cheio
  ctx.beginPath()
  ctx.arc(x, y, 11 * px, 0, 2 * Math.PI)
  ctx.fill()
  ctx.fillStyle = cores.fundo
  ctx.beginPath()
  ctx.arc(x, y, 9 * px, 0, 2 * Math.PI)
  ctx.fill()
  ctx.fillStyle = cores.cheio
  ctx.beginPath()
  ctx.arc(x, y, 6 * px, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()
}
