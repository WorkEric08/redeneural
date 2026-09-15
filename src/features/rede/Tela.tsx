import { useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from 'react'

import type { Id } from '@/core'

import { desenhar, type Camera, type Cena, type CoresDaRede } from './desenhar'
import { neuronioEm } from './layout'

/**
 * A tela da rede: canvas, câmera e dedo.
 *
 * A câmera mora num `ref` e o redesenho é imperativo. Não há laço de animação —
 * pinta quando alguma coisa muda, e só. Num celular, um `requestAnimationFrame`
 * eterno é bateria queimando para mostrar uma imagem parada.
 */

/**
 * O ponto tem tamanho fixo na tela (ver `raioNaTela`), então aproximar só afasta
 * os pontos entre si — dá para ir bem mais perto do que quando o nó crescia
 * junto com o zoom.
 */
const ESCALA_MINIMA = 0.1
const ESCALA_MAXIMA = 6
const TOLERANCIA_DO_TOQUE = 8
/** Alvo de toque em pixels de tela: um ponto de 2 px é impossível de acertar com o dedo. */
const RAIO_DO_TOQUE = 22
/** O mesmo par de números que qualquer duplo toque neste app usa: uma segunda
 *  batida perto e rápida da primeira. */
const JANELA_DO_DUPLO_TOQUE = 350
const RAIO_DO_DUPLO_TOQUE = 40
/** Quanto um duplo toque no vazio aproxima — mais forte que a roda do mouse,
 *  porque é um gesto único, não repetido. */
const ZOOM_DO_DUPLO_TOQUE = 1.9
/** Para onde a busca e o duplo toque num neurônio levam a câmera — perto o
 *  bastante para os rótulos ambiente já aparecerem (ver `desenhar.ts`). */
const ESCALA_DE_FOCO = 2.4

export interface ControleDaTela {
  enquadrar: () => void
  /** Centraliza a câmera num neurônio, aproximando até `ESCALA_DE_FOCO` — nunca afasta. */
  focar: (id: Id) => void
}

/** O que cobre a tela por cima do canvas — barra de topo, controles —, em px. */
export interface Folgas {
  topo: number
  base: number
  lados: number
}

interface Props {
  cena: Omit<Cena, 'cores'>
  onSelecionar: (id: string | null) => void
  controle?: RefObject<ControleDaTela | null>
  /** Estável entre renders (constante de módulo): enquadrar depende dela. */
  folgas: Folgas
}

const MISTURAS = ['lighter', 'multiply', 'screen', 'source-over'] as const

function ehMistura(valor: string): valor is (typeof MISTURAS)[number] {
  return (MISTURAS as readonly string[]).includes(valor)
}

/** Lê um token do design system já resolvido em rgb — o canvas não entende `var()`. */
function lerCor(el: HTMLElement, token: string): string {
  const anterior = el.style.color
  el.style.color = `var(${token})`
  const cor = getComputedStyle(el).color
  el.style.color = anterior
  return cor
}

/**
 * Lidas uma vez, e de novo só quando o tema troca: `getComputedStyle` força
 * recálculo de estilo, e arrastar a rede pinta a cada quadro.
 */
function lerCores(el: HTMLElement): CoresDaRede {
  const mistura = getComputedStyle(el).getPropertyValue('--rede-mistura').trim()
  return {
    sala: lerCor(el, '--sala'),
    papel: lerCor(el, '--papel'),
    ponte: lerCor(el, '--ponte'),
    fio: lerCor(el, '--rede-fio'),
    no: lerCor(el, '--rede-no'),
    mistura: ehMistura(mistura) ? mistura : 'source-over',
  }
}

export function Tela({ cena, onSelecionar, controle, folgas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const cores = useRef<CoresDaRede | null>(null)
  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const arrastou = useRef(0)
  /** O último toque solto, para reconhecer um segundo logo em seguida como duplo. */
  const ultimoToque = useRef<{ tempo: number; x: number; y: number } | null>(null)
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

    cores.current ??= lerCores(canvas)

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    desenhar(ctx, { ...cenaRef.current, cores: cores.current }, camera.current, largura, altura)
  }, [])

  /**
   * Enquadra pelos próprios pontos, e não por limites calculados com rótulo —
   * a constelação não escreve nome de livro. A área útil é a tela menos o que
   * fica por cima dela, e o centro desce ou sobe pela diferença entre as folgas.
   */
  const enquadrar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const p of cenaRef.current.posicoes.values()) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    if (minX === Infinity) {
      camera.current = { x: 0, y: (folgas.topo - folgas.base) / 2, escala: 1 }
      pintar()
      return
    }

    const larguraUtil = Math.max(1, canvas.clientWidth - 2 * folgas.lados)
    const alturaUtil = Math.max(1, canvas.clientHeight - folgas.topo - folgas.base)
    const cabe = Math.min(
      larguraUtil / Math.max(1, maxX - minX),
      alturaUtil / Math.max(1, maxY - minY),
    )
    const escala = Math.min(Math.max(cabe, ESCALA_MINIMA), ESCALA_MAXIMA)

    camera.current = {
      escala,
      x: -((minX + maxX) / 2) * escala,
      y: -((minY + maxY) / 2) * escala + (folgas.topo - folgas.base) / 2,
    }
    pintar()
  }, [pintar, folgas])

  /**
   * Centraliza num neurônio, sem afastar se a câmera já estiver mais perto —
   * dar zoom out para focar seria o oposto do que "focar" promete. Sem efeito
   * se a posição ainda não chegou (mesmo padrão do resto: um desenho
   * incompleto nunca quebra, só fica quieto).
   */
  const focar = useCallback(
    (id: Id) => {
      const canvas = canvasRef.current
      const p = cenaRef.current.posicoes.get(id)
      if (!canvas || !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return

      const escala = Math.min(Math.max(camera.current.escala, ESCALA_DE_FOCO), ESCALA_MAXIMA)
      camera.current = {
        escala,
        x: -p.x * escala,
        y: -p.y * escala + (folgas.topo - folgas.base) / 2,
      }
      pintar()
    },
    [pintar, folgas],
  )

  useImperativeHandle(controle, () => ({ enquadrar, focar }), [enquadrar, focar])

  /**
   * Um efeito só, e nesta ordem: a cena vai para o ref **antes** de enquadrar.
   * Separados, o enquadramento lia a cena do render anterior — no primeiro
   * carregamento isso é o palácio ainda vazio, e a câmera ia parar longe de tudo.
   *
   * Reenquadra só quando o palácio muda de forma; trocar foco ou seleção repinta.
   */
  const assinatura = `${String(cena.posicoes.size)}:${String(cena.conexoes.length)}`
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
      cores.current = null
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

        const mundo = paraOMundo(e.clientX, e.clientY)
        const raioDeToque = RAIO_DO_TOQUE / camera.current.escala
        const alvo = neuronioEm(mundo, cena.posicoes, cena.neuronios, raioDeToque)
        onSelecionar(alvo)

        // Duplo toque: perto e rápido do anterior. O primeiro toque já
        // selecionou normalmente — isto só soma o zoom, sem atrasar o toque
        // único de todo mundo à espera de um segundo que talvez não venha.
        const agora = performance.now()
        const anterior = ultimoToque.current
        const duplo =
          anterior !== null &&
          agora - anterior.tempo < JANELA_DO_DUPLO_TOQUE &&
          Math.hypot(e.clientX - anterior.x, e.clientY - anterior.y) < RAIO_DO_DUPLO_TOQUE

        if (duplo) {
          ultimoToque.current = null
          if (alvo) focar(alvo)
          else aplicarZoom(ZOOM_DO_DUPLO_TOQUE, e.clientX, e.clientY)
        } else {
          ultimoToque.current = { tempo: agora, x: e.clientX, y: e.clientY }
        }
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
