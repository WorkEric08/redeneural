import { useCallback, useRef, type PointerEvent, type RefObject, type WheelEvent } from 'react'

import type { Ponto } from '@/core'

import type { Camera } from './desenhar'
import { easeOutCubic } from './layout'

/**
 * A câmera de um canvas e o dedo em cima dele — arrastar, pinçar, roda do
 * mouse, o deslize ao soltar, toque e duplo toque. Saiu da Tela da Rede
 * (01/10/2026) para o Mapa usar a mesma, em vez de uma cópia: os dois mundos
 * têm que responder ao dedo do mesmo jeito.
 *
 * Quem usa decide o resto pelos ganchos: o que um toque faz, e se um dedo que
 * desce em cima de alguma coisa **toma o gesto** para si (a Rede arrasta
 * neurônio; o Mapa não toma nada).
 */

/** Abaixo disto de movimento, soltar é toque — acima, foi arrastar. */
export const TOLERANCIA_DO_TOQUE = 8
/** O mesmo par de números que qualquer duplo toque neste app usa: uma segunda
 *  batida perto e rápida da primeira. */
const JANELA_DO_DUPLO_TOQUE = 350
const RAIO_DO_DUPLO_TOQUE = 40
/** Quanto o dedo fica parado para "segurar" — o mesmo da estante e do botão de criar. */
const ESPERA_DO_SEGURAR = 380

/**
 * O deslize da câmera ao soltar arrastando — padrão sempre ligado desde
 * 17/09/2026 (era opcional, atrás de um botão nos filtros; virou o único
 * comportamento depois que o usuário decidiu ficar sempre com ele). Não é
 * inércia de verdade (que desaceleraria por tempo indefinido), é um "assenta e
 * para" na direção do gesto.
 */
const VELOCIDADE_MINIMA_DO_DESLIZE = 0.12 // px/ms — abaixo disso, soltar já era "parar", não "arremessar"
const PROJECAO_DO_DESLIZE_MS = 220
const DISTANCIA_MAXIMA_DO_DESLIZE = 200 // px — "desliza um pouco", não sai voando com um flick forte
const DURACAO_DO_DESLIZE = 300

export interface OpcoesDaCamera {
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** De quem usa: o desenho lê daqui. */
  cameraRef: RefObject<Camera>
  pintar: () => void
  escalaMinima: number
  escalaMaxima: number
  /** Um dedo desceu: interrompe as animações de quem usa (a revelação da Rede). */
  aoInterromper?: () => void
  /** O primeiro dedo desceu em `mundo`: `true` toma o gesto para quem usa. */
  aoDescer?: (mundo: Ponto) => boolean
  /**
   * O dedo ficou parado `ESPERA_DO_SEGURAR` ms sem que `aoDescer` tivesse tomado
   * o gesto: `true` toma daqui em diante (o Mapa ergue a ilha). Até lá o dedo
   * arrasta a câmera como sempre — quem não segura, navega.
   */
  aoSegurar?: (mundo: Ponto) => boolean
  /** O dedo do gesto tomado andou. */
  aoArrastarTomado?: (mundo: Ponto) => void
  /** Soltou o gesto tomado; `arrastou` diz se passou da tolerância (senão, é toque também). */
  aoSoltarTomado?: (mundo: Ponto, arrastou: boolean) => void
  /** Um segundo dedo, ou o gesto cancelado: quem usa desiste do que tomou. */
  aoDesistirDoTomado?: () => void
  /** Um toque, sem arrastar. `duplo` quando veio perto e rápido de outro. */
  aoTocar: (mundo: Ponto, cliente: { x: number; y: number }, duplo: boolean) => void
}

export interface Gestos {
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => void
  onPointerCancel: (e: PointerEvent<HTMLCanvasElement>) => void
  onWheel: (e: WheelEvent<HTMLCanvasElement>) => void
}

export function useCamera(opcoes: OpcoesDaCamera): {
  gestos: Gestos
  aplicarZoom: (fator: number, focoX: number, focoY: number) => void
  animarCamera: (
    alvo: Camera,
    duracaoMs: number,
    execucaoRef: { current: { cancelado: boolean } | null },
    aoTerminar?: () => void,
  ) => void
} {
  const { canvasRef, cameraRef, pintar, escalaMinima, escalaMaxima } = opcoes

  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const arrastou = useRef(0)
  /** O último toque solto, para reconhecer um segundo logo em seguida como duplo. */
  const ultimoToque = useRef<{ tempo: number; x: number; y: number } | null>(null)
  /** O gesto atual é de quem usa (`aoDescer` devolveu `true`). */
  const tomado = useRef(false)
  /** Tomado por segurar: soltar nunca vira toque, mesmo sem ter arrastado. */
  const seguro = useRef(false)
  const relogioDoSegurar = useRef<number | null>(null)

  function esquecerOSegurar(): void {
    if (relogioDoSegurar.current !== null) window.clearTimeout(relogioDoSegurar.current)
    relogioDoSegurar.current = null
  }

  /** Velocidade do arrasto de câmera (px/ms), suavizada quadro a quadro — só
   *  para decidir o deslize ao soltar. */
  const velocidadeDoArrasto = useRef({ vx: 0, vy: 0 })
  const ultimoQuadroDoArrasto = useRef(0)
  const deslizeEmAndamento = useRef<{ cancelado: boolean } | null>(null)

  /**
   * Anima a câmera de onde ela está até um alvo, com `easeOutCubic` — o mesmo
   * "assenta e para" de tudo nestas telas. `execucaoRef` é de quem chama —
   * cada animação tem a própria, para uma nova não brigar com uma anterior
   * pelo mesmo `cameraRef.current`.
   */
  const animarCamera = useCallback(
    (
      alvo: Camera,
      duracaoMs: number,
      execucaoRef: { current: { cancelado: boolean } | null },
      aoTerminar?: () => void,
    ) => {
      if (execucaoRef.current) execucaoRef.current.cancelado = true
      const execucao = { cancelado: false }
      execucaoRef.current = execucao

      const origem = { ...cameraRef.current }
      const t0 = performance.now()

      const quadro = (agora: number): void => {
        if (execucao.cancelado) return
        const k = easeOutCubic(Math.min(1, (agora - t0) / duracaoMs))

        cameraRef.current = {
          x: origem.x + (alvo.x - origem.x) * k,
          y: origem.y + (alvo.y - origem.y) * k,
          escala: origem.escala + (alvo.escala - origem.escala) * k,
        }
        pintar()

        if (agora - t0 < duracaoMs) requestAnimationFrame(quadro)
        else {
          execucaoRef.current = null
          aoTerminar?.()
        }
      }

      requestAnimationFrame(quadro)
    },
    [cameraRef, pintar],
  )

  /**
   * Soltou arrastando a câmera com alguma velocidade: desliza mais um pouco na
   * mesma direção — um alvo fixo (a velocidade projetada, com um teto de
   * distância) animado com easeOutCubic. Abaixo de `VELOCIDADE_MINIMA_DO_DESLIZE`
   * não faz nada: um arrasto que já estava parando não ganha vida própria.
   */
  const iniciarDeslize = useCallback(
    (vx: number, vy: number) => {
      const velocidade = Math.hypot(vx, vy)
      if (velocidade < VELOCIDADE_MINIMA_DO_DESLIZE) return

      const distancia = Math.min(DISTANCIA_MAXIMA_DO_DESLIZE, velocidade * PROJECAO_DO_DESLIZE_MS)
      const escala = distancia / velocidade
      animarCamera(
        {
          x: cameraRef.current.x + vx * escala,
          y: cameraRef.current.y + vy * escala,
          escala: cameraRef.current.escala,
        },
        DURACAO_DO_DESLIZE,
        deslizeEmAndamento,
      )
    },
    [animarCamera, cameraRef],
  )

  function paraOMundo(clienteX: number, clienteY: number): Ponto {
    const canvas = canvasRef.current!
    const caixa = canvas.getBoundingClientRect()
    const c = cameraRef.current
    return {
      x: (clienteX - caixa.left - caixa.width / 2 - c.x) / c.escala,
      y: (clienteY - caixa.top - caixa.height / 2 - c.y) / c.escala,
    }
  }

  function aplicarZoom(fator: number, focoX: number, focoY: number): void {
    const canvas = canvasRef.current!
    const caixa = canvas.getBoundingClientRect()
    const c = cameraRef.current

    const nova = Math.min(Math.max(c.escala * fator, escalaMinima), escalaMaxima)
    const real = nova / c.escala

    // Mantém o ponto sob os dedos parado enquanto a escala muda.
    const alvoX = focoX - caixa.left - caixa.width / 2
    const alvoY = focoY - caixa.top - caixa.height / 2
    cameraRef.current = {
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

  const gestos: Gestos = {
    onPointerDown(e) {
      e.currentTarget.setPointerCapture(e.pointerId)

      // Um toque novo interrompe qualquer deslize ou animação ainda em curso —
      // segurar a tela é sempre "para agora", nunca "espera acabar".
      if (deslizeEmAndamento.current) deslizeEmAndamento.current.cancelado = true
      opcoes.aoInterromper?.()
      velocidadeDoArrasto.current = { vx: 0, vy: 0 }
      ultimoQuadroDoArrasto.current = 0

      // O primeiro dedo a descer decide se o gesto é de quem usa (em cima de
      // um neurônio, na Rede, vira arrastar o nó) ou da câmera. Com um segundo
      // dedo já no ar, é sempre câmera.
      esquecerOSegurar()
      seguro.current = false
      if (ponteiros.current.size === 0) {
        tomado.current = opcoes.aoDescer?.(paraOMundo(e.clientX, e.clientY)) ?? false
        const { aoSegurar } = opcoes
        if (!tomado.current && aoSegurar) {
          const { clientX, clientY } = e
          relogioDoSegurar.current = window.setTimeout(() => {
            relogioDoSegurar.current = null
            if (ponteiros.current.size !== 1 || arrastou.current > TOLERANCIA_DO_TOQUE) return
            if (aoSegurar(paraOMundo(clientX, clientY))) {
              tomado.current = true
              seguro.current = true
              velocidadeDoArrasto.current = { vx: 0, vy: 0 }
            }
          }, ESPERA_DO_SEGURAR)
        }
      }

      ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      arrastou.current = 0
    },

    onPointerMove(e) {
      const anterior = ponteiros.current.get(e.pointerId)
      if (!anterior) return

      const dx = e.clientX - anterior.x
      const dy = e.clientY - anterior.y

      if (ponteiros.current.size === 2) {
        esquecerOSegurar()
        // Um segundo dedo desfaz o gesto tomado — vira pinça, como sempre.
        if (tomado.current) {
          tomado.current = false
          opcoes.aoDesistirDoTomado?.()
        }
        // E qualquer velocidade de câmera acumulada antes da pinça: soltar
        // depois de uma pinça não deve deslizar com um número de outro gesto.
        velocidadeDoArrasto.current = { vx: 0, vy: 0 }

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
      // Andou antes do tempo: não era segurar, era navegar.
      if (arrastou.current > TOLERANCIA_DO_TOQUE) esquecerOSegurar()

      if (tomado.current) {
        opcoes.aoArrastarTomado?.(paraOMundo(e.clientX, e.clientY))
        return
      }

      cameraRef.current = {
        ...cameraRef.current,
        x: cameraRef.current.x + dx,
        y: cameraRef.current.y + dy,
      }
      pintar()

      // Velocidade suavizada (px/ms) para decidir o deslize ao soltar.
      const agora = performance.now()
      const dt = ultimoQuadroDoArrasto.current ? agora - ultimoQuadroDoArrasto.current : 16
      ultimoQuadroDoArrasto.current = agora
      const vx = dx / Math.max(1, dt)
      const vy = dy / Math.max(1, dt)
      velocidadeDoArrasto.current = {
        vx: velocidadeDoArrasto.current.vx * 0.7 + vx * 0.3,
        vy: velocidadeDoArrasto.current.vy * 0.7 + vy * 0.3,
      }
    },

    onPointerUp(e) {
      const eraUmDedoSo = ponteiros.current.size === 1
      ponteiros.current.delete(e.pointerId)

      esquecerOSegurar()
      const eraTomado = tomado.current
      const eraSeguro = seguro.current
      tomado.current = false
      seguro.current = false
      const mundo = paraOMundo(e.clientX, e.clientY)

      // Segurou e soltou: é pôr de volta (ou no lugar novo), nunca um toque.
      if (eraSeguro) {
        ultimoToque.current = null
        opcoes.aoSoltarTomado?.(mundo, arrastou.current > TOLERANCIA_DO_TOQUE)
        return
      }

      if (eraTomado && eraUmDedoSo && arrastou.current > TOLERANCIA_DO_TOQUE) {
        ultimoToque.current = null
        opcoes.aoSoltarTomado?.(mundo, true)
        return
      }
      // Tomado, mas sem arrastar de verdade: quem usa desfaz o que começou, e
      // o gesto segue como toque.
      if (eraTomado) opcoes.aoSoltarTomado?.(mundo, false)

      if (!eraUmDedoSo || arrastou.current > TOLERANCIA_DO_TOQUE) {
        // Soltou arrastando a câmera de verdade (não um gesto tomado, não uma
        // pinça terminando): desliza mais um pouco.
        if (!eraTomado && eraUmDedoSo) {
          iniciarDeslize(velocidadeDoArrasto.current.vx, velocidadeDoArrasto.current.vy)
        }
        return
      }

      // Duplo toque: perto e rápido do anterior. O primeiro toque já fez o
      // dele — isto só avisa, sem atrasar o toque único de todo mundo à espera
      // de um segundo que talvez não venha.
      const agora = performance.now()
      const anterior = ultimoToque.current
      const duplo =
        anterior !== null &&
        agora - anterior.tempo < JANELA_DO_DUPLO_TOQUE &&
        Math.hypot(e.clientX - anterior.x, e.clientY - anterior.y) < RAIO_DO_DUPLO_TOQUE
      ultimoToque.current = duplo ? null : { tempo: agora, x: e.clientX, y: e.clientY }

      opcoes.aoTocar(mundo, { x: e.clientX, y: e.clientY }, duplo)
    },

    onPointerCancel(e) {
      esquecerOSegurar()
      ponteiros.current.delete(e.pointerId)
      if (tomado.current) opcoes.aoDesistirDoTomado?.()
      tomado.current = false
      seguro.current = false
    },

    onWheel(e) {
      aplicarZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
    },
  }

  return { gestos, aplicarZoom, animarCamera }
}
