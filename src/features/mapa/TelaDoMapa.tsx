import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from 'react'

import {
  MARGEM_DA_COSTA,
  pontoNoMapa,
  type Conexao,
  type Id,
  type Livro,
  type MapaDoPalacio,
  type NeuronioNaTela,
  type Ponto,
} from '@/core'
import { lerCor, useRepintarAoMudar } from '@/features/rede/canvas'
import type { Camera } from '@/features/rede/desenhar'
import { camaraParaEnquadrar, easeOutCubic, vizinhancaDe } from '@/features/rede/layout'
import type { ControleDaTela, Folgas } from '@/features/rede/Tela'
import { useCamera } from '@/features/rede/useCamera'

import { desenharMapa, type CenaDoMapa, type CoresDoMapa } from './desenharMapa'
import {
  bordasDoMapa,
  ESCALA_DE_PERTO,
  ilhaEm,
  neuronioNoMapaEm,
  pontosAbsolutos,
  RAZAO_DO_VERTICE,
} from './ilha'
import { ponteEm, pontesVisiveis, type PonteAgrupada } from './pontes'

/**
 * A tela do Mapa: o canvas do arquipélago, com a mesma câmera e o mesmo dedo
 * da Rede (`useCamera`). Sem laço de animação: pinta quando algo muda, e só.
 *
 * A mão da pessoa (02/10/2026): o neurônio se arrasta como na Rede — o dedo
 * desce nele e leva —, mas não sai da ilha dele. A ilha, que é grande e onde o
 * dedo também navega, se **segura** primeiro (como o livro na estante) e aí
 * anda, com todos os neurônios. Enquanto está na mão, o lugar dela é só da
 * tela; ao soltar, o núcleo decide o lugar final (`moverIlha`,
 * `moverPontoNoMapa`) e ela desliza até lá. Nada mais se mexe.
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
/** O deslizar do lugar onde o dedo soltou até o lugar que o núcleo decidiu. */
const DURACAO_DO_POUSO = 260

/** Uma ilha ou um neurônio na mão da pessoa — `agora` é onde está, no mundo. */
type NaMao =
  | { tipo: 'neuronio'; id: Id; livroId: Id; origem: Ponto; dedo: Ponto; agora: Ponto }
  | { tipo: 'ilha'; livroId: Id; origem: Ponto; dedo: Ponto; agora: Ponto }

/** A cena com o que está na mão no lugar da mão, e não no lugar gravado. */
function comAMao(cena: Omit<CenaDoMapa, 'cores' | 'erguida'>, mao: NaMao | null) {
  if (!mao) return { ...cena, erguida: null }
  const ilha = cena.mapa.ilhas[mao.livroId]
  if (!ilha) return { ...cena, erguida: null }

  const absolutos = new Map(cena.absolutos)
  if (mao.tipo === 'neuronio') {
    const relativo = { x: mao.agora.x - ilha.centro.x, y: mao.agora.y - ilha.centro.y }
    absolutos.set(mao.id, mao.agora)
    const pontos = { ...ilha.pontos, [mao.id]: relativo }
    return {
      ...cena,
      absolutos,
      mapa: { ilhas: { ...cena.mapa.ilhas, [mao.livroId]: { ...ilha, pontos } } },
      erguida: null,
    }
  }
  for (const [id, p] of Object.entries(ilha.pontos)) {
    absolutos.set(id, { x: mao.agora.x + p.x, y: mao.agora.y + p.y })
  }
  return {
    ...cena,
    absolutos,
    mapa: { ilhas: { ...cena.mapa.ilhas, [mao.livroId]: { ...ilha, centro: mao.agora } } },
    erguida: mao.livroId,
  }
}

function lerCoresDoMapa(el: HTMLElement): CoresDoMapa {
  return {
    sala: lerCor(el, '--sala'),
    parede: lerCor(el, '--parede'),
    papel: lerCor(el, '--papel'),
    poeira: lerCor(el, '--poeira'),
    no: lerCor(el, '--rede-no'),
    ponte: lerCor(el, '--ponte'),
    fio: lerCor(el, '--rede-fio'),
    ouro: lerCor(el, '--ouro-gravado'),
    nevoa: lerCor(el, '--nevoa'),
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
  adormecidas: ReadonlySet<Id>
  feitas: ReadonlySet<Id>
  selecionado: Id | null
  onSelecionar: (id: Id | null) => void
  onTocarPonte: (ponte: PonteAgrupada) => void
  /** Soltou uma ilha: o mapa como ficou, ou `null` se o motor não conseguiu. */
  onMoverIlha: (livroId: Id, centro: Ponto) => Promise<MapaDoPalacio | null>
  /** Soltou um neurônio: idem. */
  onMoverNeuronio: (id: Id, ponto: Ponto) => Promise<MapaDoPalacio | null>
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
  adormecidas,
  feitas,
  selecionado,
  onSelecionar,
  onTocarPonte,
  onMoverIlha,
  onMoverNeuronio,
  controle,
  folgas,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const cores = useRef<CoresDoMapa | null>(null)
  const animacaoEmAndamento = useRef<{ cancelado: boolean } | null>(null)
  const naMao = useRef<NaMao | null>(null)
  const pousoEmAndamento = useRef<{ cancelado: boolean } | null>(null)

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
    adormecidas,
    feitas,
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
    desenharMapa(
      ctx,
      { ...comAMao(cenaRef.current, naMao.current), cores: cores.current },
      camera.current,
      largura,
      altura,
    )
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
      // Um pouso ainda em curso termina na hora: o lugar final já é o gravado.
      if (pousoEmAndamento.current) {
        pousoEmAndamento.current.cancelado = true
        pousoEmAndamento.current = null
        naMao.current = null
      }
    },
    aoDescer(mundo) {
      // O neurônio se pega na hora, como na Rede — mas só de perto: na visão
      // inicial o dedo navega, e segurar a ilha é que a move.
      if (camera.current.escala < ESCALA_DE_PERTO) return false
      const tocado = pontoTocavelEm(mundo)
      if (!tocado) return false
      const achada = Object.entries(cenaRef.current.mapa.ilhas).find(([, i]) => tocado in i.pontos)
      const origem = cenaRef.current.absolutos.get(tocado)
      if (!achada || !origem) return false
      naMao.current = {
        tipo: 'neuronio',
        id: tocado,
        livroId: achada[0],
        origem,
        dedo: mundo,
        agora: origem,
      }
      return true
    },
    aoSegurar(mundo) {
      // A ilha só depois de segurar: arrastar na terra sem segurar navega.
      const livroId = ilhaEm(mundo, cenaRef.current.mapa)
      const ilha = livroId ? cenaRef.current.mapa.ilhas[livroId] : undefined
      if (!livroId || !ilha) return false
      naMao.current = {
        tipo: 'ilha',
        livroId,
        origem: ilha.centro,
        dedo: mundo,
        agora: ilha.centro,
      }
      pintar()
      return true
    },
    aoArrastarTomado(mundo) {
      const mao = naMao.current
      if (!mao) return
      let agora = { x: mao.origem.x + mundo.x - mao.dedo.x, y: mao.origem.y + mundo.y - mao.dedo.y }
      if (mao.tipo === 'neuronio') {
        // Não sai da ilha: o dedo vai, o ponto fica na beira de dentro.
        const ilha = cenaRef.current.mapa.ilhas[mao.livroId]
        if (ilha) {
          const dx = agora.x - ilha.centro.x
          const dy = agora.y - ilha.centro.y
          const limite = Math.max(0, ilha.raio - MARGEM_DA_COSTA)
          const d = Math.hypot(dx, dy)
          if (d > limite) {
            agora = { x: ilha.centro.x + (dx / d) * limite, y: ilha.centro.y + (dy / d) * limite }
          }
        }
      }
      naMao.current = { ...mao, agora }
      pintar()
    },
    aoSoltarTomado(_mundo, arrastou) {
      const mao = naMao.current
      if (!mao) return
      // Sem arrastar: o neurônio vira um toque (segue para `aoTocar`), e a ilha
      // segurada volta para o mesmo lugar.
      if (!arrastou) {
        naMao.current = null
        pintar()
        return
      }
      void pousar(mao)
    },
    aoDesistirDoTomado() {
      naMao.current = null
      pintar()
    },
    aoTocar(mundo, cliente, duplo) {
      const atual = cenaRef.current
      const escala = camera.current.escala
      const dePerto = escala >= ESCALA_DE_PERTO

      const tocado = pontoTocavelEm(mundo)
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

  /**
   * Só se toca o ponto de que se está perto: de longe um toque é da ilha (e
   * aproxima dela), salvo a vizinhança acesa do tocado.
   */
  function pontoTocavelEm(mundo: Ponto): Id | null {
    const atual = cenaRef.current
    const escala = camera.current.escala
    const vizinhanca = vizinhancaDe(atual.selecionado, atual.conexoes)
    const tocaveis =
      escala >= ESCALA_DE_PERTO
        ? atual.absolutos
        : new Map([...atual.absolutos].filter(([id]) => vizinhanca?.has(id)))
    return neuronioNoMapaEm(mundo, tocaveis, RAIO_DO_TOQUE / escala)
  }

  /**
   * Soltou: o núcleo decide o lugar final (o mesmo, ou o vão mais perto), e o
   * que estava na mão desliza do lugar do dedo até lá. Só depois a mão larga —
   * aí o mapa gravado já é o novo.
   */
  async function pousar(mao: NaMao): Promise<void> {
    const novo =
      mao.tipo === 'ilha'
        ? await onMoverIlha(mao.livroId, mao.agora)
        : await onMoverNeuronio(mao.id, mao.agora)
    const destino = !novo
      ? undefined
      : mao.tipo === 'ilha'
        ? novo.ilhas[mao.livroId]?.centro
        : pontoNoMapa(novo, mao.id)
    if (!destino || naMao.current !== mao) {
      if (naMao.current === mao) naMao.current = null
      pintar()
      return
    }

    const de = mao.agora
    const execucao = { cancelado: false }
    pousoEmAndamento.current = execucao
    const inicio = performance.now()
    const passo = (agora: number): void => {
      if (execucao.cancelado) return
      const k = easeOutCubic(Math.min(1, (agora - inicio) / DURACAO_DO_POUSO))
      if (k >= 1) {
        naMao.current = null
        pousoEmAndamento.current = null
        pintar()
        return
      }
      naMao.current = {
        ...mao,
        agora: { x: de.x + (destino.x - de.x) * k, y: de.y + (destino.y - de.y) * k },
      }
      pintar()
      requestAnimationFrame(passo)
    }
    requestAnimationFrame(passo)
  }

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
    const lado = r * RAZAO_DO_VERTICE
    const { x, y } = ilha.centro
    const alvo = enquadramento(
      [
        { x: x - lado, y: y - r },
        { x: x + lado, y: y + r },
      ],
      ESCALA_DE_PERTO,
    )
    if (alvo) levarAte(alvo, DURACAO_DA_APROXIMACAO)
  }

  /** "Enquadrar": volta à visão do arquipélago inteiro com a mesma animação de aproximar. */
  const voltarAoInicio = useCallback(() => {
    const alvo = enquadramento(bordasDoMapa(cenaRef.current.mapa), ESCALA_MINIMA)
    if (alvo) levarAte(alvo, DURACAO_DA_APROXIMACAO)
  }, [enquadramento, levarAte])

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

  // O botão de enquadrar anima; o `enquadrar` instantâneo é só da abertura.
  useImperativeHandle(controle, () => ({ enquadrar: voltarAoInicio, focar, revelar }), [
    voltarAoInicio,
    focar,
    revelar,
  ])

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
