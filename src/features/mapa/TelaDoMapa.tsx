import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from 'react'

import type { Id, Livro, MapaDoPalacio, NeuronioNaTela } from '@/core'
import { lerCor, useRepintarAoMudar } from '@/features/rede/canvas'
import type { Camera } from '@/features/rede/desenhar'
import { camaraParaEnquadrar } from '@/features/rede/layout'
import type { ControleDaTela, Folgas } from '@/features/rede/Tela'
import { useCamera } from '@/features/rede/useCamera'

import { desenharMapa, type CoresDoMapa } from './desenharMapa'
import { bordasDoMapa, neuronioNoMapaEm, pontosAbsolutos } from './ilha'

/**
 * A tela do Mapa: o canvas do arquipélago, com a mesma câmera e o mesmo dedo
 * da Rede (`useCamera`). Nada se arrasta aqui — o mapa é memória, e o lugar de
 * cada coisa é do núcleo. Sem laço de animação: pinta quando algo muda, e só.
 *
 * Cumpre o mesmo `ControleDaTela` da Rede: a página trata os dois modos igual
 * (a busca centraliza, o neurônio recém-criado é revelado).
 */

/** As ilhas são grandes: de perto, uma ocupa a tela; de longe, o arquipélago todo cabe. */
const ESCALA_MINIMA = 0.05
const ESCALA_MAXIMA = 5
/** Para onde focar leva a câmera: perto o bastante para ver a ilha em volta do ponto. */
const ESCALA_DE_FOCO = 1.6
const RAIO_DO_TOQUE = 22
const ZOOM_DO_DUPLO_TOQUE = 1.5
const DURACAO_DA_REVELACAO = 700
/**
 * O nome e a contagem moram acima da ilha, em pixels de tela; o enquadramento
 * conta só as ilhas e, sem esta folga, o nome da de cima cairia por cima da
 * contagem do topo.
 */
const ALTURA_DO_NOME_DA_ILHA = 40

function lerCoresDoMapa(el: HTMLElement): CoresDoMapa {
  return {
    sala: lerCor(el, '--sala'),
    parede: lerCor(el, '--parede'),
    papel: lerCor(el, '--papel'),
    poeira: lerCor(el, '--poeira'),
    no: lerCor(el, '--rede-no'),
  }
}

interface Props {
  mapa: MapaDoPalacio
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  selecionado: Id | null
  onSelecionar: (id: Id | null) => void
  controle?: RefObject<ControleDaTela | null>
  /** Estável entre renders (constante de módulo): enquadrar depende dela. */
  folgas: Folgas
}

export function TelaDoMapa({
  mapa,
  livros,
  neuronios,
  selecionado,
  onSelecionar,
  controle,
  folgas,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const cores = useRef<CoresDoMapa | null>(null)
  const revelacaoEmAndamento = useRef<{ cancelado: boolean } | null>(null)

  const absolutos = useMemo(() => pontosAbsolutos(mapa), [mapa])
  const cena = { mapa, absolutos, livros, neuronios, selecionado }
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
    cores.current ??= lerCoresDoMapa(canvas)

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    desenharMapa(ctx, { ...cenaRef.current, cores: cores.current }, camera.current, largura, altura)
  }, [])

  const enquadrar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    camera.current = camaraParaEnquadrar(
      bordasDoMapa(cenaRef.current.mapa),
      canvas.clientWidth,
      canvas.clientHeight,
      { ...folgas, topo: folgas.topo + ALTURA_DO_NOME_DA_ILHA },
      ESCALA_MINIMA,
      ESCALA_MAXIMA,
    )
    pintar()
  }, [pintar, folgas])

  /** A câmera centrada no neurônio, sem afastar se já estiver mais perto. */
  const cameraEm = useCallback(
    (id: Id): Camera | null => {
      const p = cenaRef.current.absolutos.get(id)
      if (!p) return null
      const escala = Math.min(Math.max(camera.current.escala, ESCALA_DE_FOCO), ESCALA_MAXIMA)
      return { escala, x: -p.x * escala, y: -p.y * escala + (folgas.topo - folgas.base) / 2 }
    },
    [folgas],
  )

  const focar = useCallback(
    (id: Id) => {
      const alvo = cameraEm(id)
      if (!alvo) return
      camera.current = alvo
      pintar()
    },
    [cameraEm, pintar],
  )

  const { gestos, aplicarZoom, animarCamera } = useCamera({
    canvasRef,
    cameraRef: camera,
    pintar,
    escalaMinima: ESCALA_MINIMA,
    escalaMaxima: ESCALA_MAXIMA,
    aoInterromper() {
      if (revelacaoEmAndamento.current) revelacaoEmAndamento.current.cancelado = true
    },
    aoTocar(mundo, cliente, duplo) {
      const raio = RAIO_DO_TOQUE / camera.current.escala
      const tocado = neuronioNoMapaEm(mundo, cenaRef.current.absolutos, raio)
      onSelecionar(tocado)
      if (!duplo) return
      if (tocado) focar(tocado)
      else aplicarZoom(ZOOM_DO_DUPLO_TOQUE, cliente.x, cliente.y)
    },
  })

  /** O neurônio que acabou de nascer: a câmera vai até ele, e ele fica tocado. */
  const revelar = useCallback(
    (id: Id) => {
      const alvo = cameraEm(id)
      if (!alvo) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        camera.current = alvo
        pintar()
        onSelecionar(id)
        return
      }
      animarCamera(alvo, DURACAO_DA_REVELACAO, revelacaoEmAndamento, () => {
        onSelecionar(id)
      })
    },
    [cameraEm, pintar, animarCamera, onSelecionar],
  )

  useImperativeHandle(controle, () => ({ enquadrar, focar, revelar }), [enquadrar, focar, revelar])

  // Enquadra ao abrir e quando o arquipélago muda de forma (ilha nova, ilha
  // que sumiu); o resto só repinta — o mapa não pode pular sozinho.
  const assinatura = Object.keys(mapa.ilhas).sort().join('|')
  const formaAnterior = useRef<string | null>(null)
  useEffect(() => {
    cenaRef.current = cena
    if (formaAnterior.current === assinatura) {
      pintar()
      return
    }
    formaAnterior.current = assinatura
    enquadrar()
  })

  const esquecerCores = useCallback(() => {
    cores.current = null
  }, [])
  useRepintarAoMudar(canvasRef, pintar, esquecerCores)

  return (
    <canvas
      ref={canvasRef}
      className="bg-sala h-full w-full touch-none"
      aria-label={`Mapa do palácio: ${String(Object.keys(mapa.ilhas).length)} ilhas`}
      {...gestos}
    />
  )
}
