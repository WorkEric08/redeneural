import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from 'react'

import type { Conexao, Id, Livro, MapaDoPalacio, NeuronioNaTela, Ponto } from '@/core'
import { lerCor, useRepintarAoMudar } from '@/features/rede/canvas'
import type { Camera } from '@/features/rede/desenhar'
import { camaraParaEnquadrar, vizinhancaDe } from '@/features/rede/layout'
import type { ControleDaTela, Folgas } from '@/features/rede/Tela'
import { useCamera } from '@/features/rede/useCamera'

import { desenharMapa, type CoresDoMapa } from './desenharMapa'
import { bordasDoMapa, ESCALA_DE_PERTO, ilhaEm, neuronioNoMapaEm, pontosAbsolutos } from './ilha'
import { ponteEm, pontesVisiveis, type PonteAgrupada } from './pontes'

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
/** Uma ponte fina é difícil de acertar: o alvo é mais largo que o traço. */
const TOLERANCIA_DA_PONTE = 14
const ZOOM_DO_DUPLO_TOQUE = 1.5
const DURACAO_DA_REVELACAO = 700
const DURACAO_DA_APROXIMACAO = 450
/** Tocar numa ilha de longe enquadra ela com um pouco de mar em volta. */
const MAR_EM_VOLTA_DA_ILHA = 1.3
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
    ponte: lerCor(el, '--ponte'),
    fio: lerCor(el, '--rede-fio'),
  }
}

interface Props {
  mapa: MapaDoPalacio
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  conexoes: readonly Conexao[]
  graus: ReadonlyMap<Id, number>
  /** Da mais forte para a mais fraca (`agruparPontes`). */
  pontes: readonly PonteAgrupada[]
  todasAsPontes: boolean
  selecionado: Id | null
  onSelecionar: (id: Id | null) => void
  onTocarPonte: (ponte: PonteAgrupada) => void
  controle?: RefObject<ControleDaTela | null>
  /** Estável entre renders (constante de módulo): enquadrar depende dela. */
  folgas: Folgas
}

export function TelaDoMapa({
  mapa,
  livros,
  neuronios,
  conexoes,
  graus,
  pontes,
  todasAsPontes,
  selecionado,
  onSelecionar,
  onTocarPonte,
  controle,
  folgas,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const cores = useRef<CoresDoMapa | null>(null)
  const animacaoEmAndamento = useRef<{ cancelado: boolean } | null>(null)

  const absolutos = useMemo(() => pontosAbsolutos(mapa), [mapa])
  const cena = {
    mapa,
    absolutos,
    livros,
    neuronios,
    conexoes,
    graus,
    pontes,
    todasAsPontes,
    selecionado,
    cobertas: folgas,
  }
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

  /** A câmera que enquadra estes pontos, com o nome da ilha de cima à mostra. */
  const enquadramento = useCallback(
    (pontos: readonly Ponto[], escalaMinima: number): Camera | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      return camaraParaEnquadrar(
        pontos,
        canvas.clientWidth,
        canvas.clientHeight,
        { ...folgas, topo: folgas.topo + ALTURA_DO_NOME_DA_ILHA },
        escalaMinima,
        ESCALA_MAXIMA,
      )
    },
    [folgas],
  )

  const enquadrar = useCallback(() => {
    const alvo = enquadramento(bordasDoMapa(cenaRef.current.mapa), ESCALA_MINIMA)
    if (!alvo) return
    camera.current = alvo
    pintar()
  }, [enquadramento, pintar])

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
      if (animacaoEmAndamento.current) animacaoEmAndamento.current.cancelado = true
    },
    aoTocar(mundo, cliente, duplo) {
      const atual = cenaRef.current
      const escala = camera.current.escala
      const dePerto = escala >= ESCALA_DE_PERTO

      // Só se toca o ponto que se vê: de longe, só os da vizinhança acesa.
      const vizinhanca = vizinhancaDe(atual.selecionado, atual.conexoes)
      const tocaveis = dePerto
        ? atual.absolutos
        : new Map([...atual.absolutos].filter(([id]) => vizinhanca?.has(id)))
      const tocado = neuronioNoMapaEm(mundo, tocaveis, RAIO_DO_TOQUE / escala)
      if (tocado) {
        onSelecionar(tocado)
        if (duplo) focar(tocado)
        return
      }

      // A ponte passa por baixo das ilhas: na terra, o toque é da ilha.
      const ilha = ilhaEm(mundo, atual.mapa)
      if (ilha) {
        onSelecionar(null)
        if (!dePerto) aproximarDaIlha(ilha)
        else if (duplo) aplicarZoom(ZOOM_DO_DUPLO_TOQUE, cliente.x, cliente.y)
        return
      }

      const visiveis = pontesVisiveis(atual.pontes, escala, atual.todasAsPontes)
      const ponte = ponteEm(mundo, visiveis, atual.mapa, TOLERANCIA_DA_PONTE / escala)
      if (ponte) {
        onTocarPonte(ponte)
        return
      }

      onSelecionar(null)
      if (duplo) aplicarZoom(ZOOM_DO_DUPLO_TOQUE, cliente.x, cliente.y)
    },
  })

  /** Leva a câmera até a câmera alvo — direto, para quem pediu menos movimento. */
  const levarAte = useCallback(
    (alvo: Camera, duracao: number, aoChegar?: () => void) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        camera.current = alvo
        pintar()
        aoChegar?.()
        return
      }
      animarCamera(alvo, duracao, animacaoEmAndamento, aoChegar)
    },
    [animarCamera, pintar],
  )

  /** Tocar numa ilha de longe aproxima dela — até a distância em que os pontos aparecem. */
  function aproximarDaIlha(livroId: Id): void {
    const ilha = cenaRef.current.mapa.ilhas[livroId]
    if (!ilha) return
    const r = ilha.raio * MAR_EM_VOLTA_DA_ILHA
    const { x, y } = ilha.centro
    const alvo = enquadramento(
      [
        { x: x - r, y: y - r },
        { x: x + r, y: y + r },
      ],
      ESCALA_DE_PERTO,
    )
    if (alvo) levarAte(alvo, DURACAO_DA_APROXIMACAO)
  }

  /** O neurônio que acabou de nascer: a câmera vai até ele, e ele fica tocado. */
  const revelar = useCallback(
    (id: Id) => {
      const alvo = cameraEm(id)
      if (!alvo) return
      levarAte(alvo, DURACAO_DA_REVELACAO, () => {
        onSelecionar(id)
      })
    },
    [cameraEm, levarAte, onSelecionar],
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
