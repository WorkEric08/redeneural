import { useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from 'react'

import { desenhar, raioDoNeuronio, type Camera, type Cena, type CoresDaRede } from './desenhar'
import { neuronioEm } from './layout'

/**
 * A tela da rede: canvas, câmera e dedo.
 *
 * A câmera mora num `ref` e o redesenho é imperativo. Não há laço de animação —
 * pinta quando alguma coisa muda, e só. Num celular, um `requestAnimationFrame`
 * eterno é bateria queimando para mostrar uma imagem parada.
 */

const ESCALA_MINIMA = 0.25
const ESCALA_MAXIMA = 3
const TOLERANCIA_DO_TOQUE = 8

export interface ControleDaTela {
  enquadrar: () => void
}

interface Props {
  cena: Omit<Cena, 'cores'>
  onSelecionar: (id: string | null) => void
  controle?: RefObject<ControleDaTela | null>
}

/** Lê um token do design system já resolvido em rgb — o canvas não entende `var()`. */
function lerCor(el: HTMLElement, token: string): string {
  const anterior = el.style.color
  el.style.color = `var(${token})`
  const cor = getComputedStyle(el).color
  el.style.color = anterior
  return cor
}

export function Tela({ cena, onSelecionar, controle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const arrastou = useRef(0)
  const cenaRef = useRef(cena)

  const pintar = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const largura = canvas.clientWidth
    const altura = canvas.clientHeight

    if (canvas.width !== Math.round(largura * dpr) || canvas.height !== Math.round(altura * dpr)) {
      canvas.width = Math.round(largura * dpr)
      canvas.height = Math.round(altura * dpr)
    }

    const cores: CoresDaRede = {
      sala: lerCor(canvas, '--sala'),
      papel: lerCor(canvas, '--papel'),
      poeira: lerCor(canvas, '--poeira'),
      ouro: lerCor(canvas, '--ouro'),
      linha: lerCor(canvas, '--linha'),
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    desenhar(ctx, { ...cenaRef.current, cores }, camera.current, largura, altura)
  }, [])

  const enquadrar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { minX, minY, maxX, maxY } = cenaRef.current.mapa.limites
    const largura = Math.max(1, maxX - minX)
    const altura = Math.max(1, maxY - minY)
    const margem = 56

    const cabe = Math.min(
      (canvas.clientWidth - margem) / largura,
      (canvas.clientHeight - margem) / altura,
    )
    const escala = Math.min(Math.max(cabe, ESCALA_MINIMA), ESCALA_MAXIMA)

    camera.current = {
      escala,
      x: -((minX + maxX) / 2) * escala,
      y: -((minY + maxY) / 2) * escala,
    }
    pintar()
  }, [pintar])

  useImperativeHandle(controle, () => ({ enquadrar }), [enquadrar])

  /**
   * Um efeito só, e nesta ordem: a cena vai para o ref **antes** de enquadrar.
   * Separados, o enquadramento lia a cena do render anterior — no primeiro
   * carregamento isso é o palácio ainda vazio, e a câmera ia parar longe de tudo.
   *
   * Reenquadra só quando o palácio muda de forma; trocar foco ou seleção repinta.
   */
  const assinatura = `${String(cena.mapa.posicoes.size)}:${String(cena.conexoes.length)}`
  const formaAnterior = useRef('')

  useEffect(() => {
    cenaRef.current = cena

    if (formaAnterior.current === assinatura) {
      pintar()
      return
    }
    formaAnterior.current = assinatura
    enquadrar()
  }, [cena, assinatura, enquadrar, pintar])

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
  }, [pintar])

  /**
   * O canvas não tem cascata: as cores foram copiadas para pixels na última
   * pintura e ficam lá. Sem isto, trocar de claro para escuro deixa a rede com a
   * sala do tema anterior dentro de uma página do tema novo.
   */
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const aoTrocarDeTema = (): void => {
      pintar()
    }

    consulta.addEventListener('change', aoTrocarDeTema)
    return () => {
      consulta.removeEventListener('change', aoTrocarDeTema)
    }
  }, [pintar])

  function paraOMundo(clienteX: number, clienteY: number) {
    const canvas = canvasRef.current!
    const caixa = canvas.getBoundingClientRect()
    const c = camera.current
    return {
      x: (clienteX - caixa.left - caixa.width / 2 - c.x) / c.escala,
      y: (clienteY - caixa.top - caixa.height / 2 - c.y) / c.escala,
    }
  }

  function aplicarZoom(fator: number, focoX: number, focoY: number) {
    const canvas = canvasRef.current!
    const caixa = canvas.getBoundingClientRect()
    const c = camera.current

    const nova = Math.min(Math.max(c.escala * fator, ESCALA_MINIMA), ESCALA_MAXIMA)
    const real = nova / c.escala

    // Mantém o ponto sob os dedos parado enquanto a escala muda.
    const alvoX = focoX - caixa.left - caixa.width / 2
    const alvoY = focoY - caixa.top - caixa.height / 2
    camera.current = {
      escala: nova,
      x: alvoX - (alvoX - c.x) * real,
      y: alvoY - (alvoY - c.y) * real,
    }
    pintar()
  }

  function distanciaEntreDedos(): number {
    const [a, b] = [...ponteiros.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  return (
    <canvas
      ref={canvasRef}
      className="bg-sala h-full w-full touch-none"
      aria-label={`Rede do palácio: ${String(cena.neuronios.length)} neurônios e ${String(cena.conexoes.length)} conexões`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        arrastou.current = 0
      }}
      onPointerMove={(e) => {
        const anterior = ponteiros.current.get(e.pointerId)
        if (!anterior) return

        const dx = e.clientX - anterior.x
        const dy = e.clientY - anterior.y

        if (ponteiros.current.size === 2) {
          const antes = distanciaEntreDedos()
          ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          const depois = distanciaEntreDedos()
          const [a, b] = [...ponteiros.current.values()]

          if (antes > 0 && depois > 0 && a && b) {
            aplicarZoom(depois / antes, (a.x + b.x) / 2, (a.y + b.y) / 2)
          }
          arrastou.current += Math.abs(depois - antes)
          return
        }

        ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        arrastou.current += Math.abs(dx) + Math.abs(dy)
        camera.current = {
          ...camera.current,
          x: camera.current.x + dx,
          y: camera.current.y + dy,
        }
        pintar()
      }}
      onPointerUp={(e) => {
        const eraUmDedoSo = ponteiros.current.size === 1
        ponteiros.current.delete(e.pointerId)
        if (!eraUmDedoSo || arrastou.current > TOLERANCIA_DO_TOQUE) return

        // Alvo de toque maior que o desenho: um nó de 5 px é impossível de acertar.
        const mundo = paraOMundo(e.clientX, e.clientY)
        const raioDeToque = Math.max(22 / camera.current.escala, raioDoNeuronio(14))
        onSelecionar(neuronioEm(mundo, cena.mapa.posicoes, cena.neuronios, raioDeToque))
      }}
      onPointerCancel={(e) => {
        ponteiros.current.delete(e.pointerId)
      }}
      onWheel={(e) => {
        aplicarZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
      }}
    />
  )
}
