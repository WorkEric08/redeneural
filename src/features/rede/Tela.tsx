import { useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from 'react'

import type { Id, Ponto } from '@/core'

import { desenhar, type Camera, type Cena, type CoresDaRede } from './desenhar'
import {
  balanco,
  camaraParaEnquadrar,
  neuronioEm,
  posicoesDoArrasto,
  quadroDoAssentamento,
  easeOutCubic,
  sateliteEm,
  satelitesVisiveis,
  vizinhancaDe,
  type NoArrastado,
} from './layout'
import { lerCor, useRepintarAoMudar } from './canvas'
import { useCamera } from './useCamera'

/**
 * A tela da rede: canvas, câmera e dedo.
 *
 * A câmera mora num `ref` e o redesenho é imperativo. Historicamente sem laço
 * de animação — pintava quando alguma coisa mudava, e só; um
 * `requestAnimationFrame` eterno é bateria queimando para mostrar uma imagem
 * parada.
 *
 * **Isso mudou em 17/09/2026, como teste do usuário:** agora há um laço
 * contínuo, só enquanto esta tela está montada (começa ao abrir, para ao
 * sair — nunca em segundo plano), para o "balanço" leve dos neurônios (ver
 * `balanco`, em `layout.ts`, e o `useEffect` mais abaixo). É a primeira
 * exceção de verdade a "sem laço de animação" — as outras (assentamento,
 * deslize, revelação) são todas limitadas no tempo e param sozinhas; esta
 * roda o tempo todo que a tela estiver na frente.
 */

/**
 * O ponto tem tamanho fixo na tela (ver `raioNaTela`), então aproximar só afasta
 * os pontos entre si — dá para ir bem mais perto do que quando o nó crescia
 * junto com o zoom.
 */
const ESCALA_MINIMA = 0.1
const ESCALA_MAXIMA = 6
/** Alvo de toque em pixels de tela: um ponto de 2 px é impossível de acertar com o dedo. */
const RAIO_DO_TOQUE = 22
/** Quanto um duplo toque no vazio aproxima — mais forte que a roda do mouse,
 *  porque é um gesto único, não repetido. Leve de propósito (pedido do
 *  usuário, 16/09/2026, era 1.9): dois ou três toques seguidos, não um só,
 *  fazem o trabalho de aproximar de verdade. */
const ZOOM_DO_DUPLO_TOQUE = 1.5
/** Para onde a busca e o duplo toque num neurônio levam a câmera — o mesmo
 *  valor do limiar único de `ESCALA_MINIMA_DOS_ROTULOS` em `desenhar.ts`, para
 *  focar sempre revelar todos os nomes de uma vez (nunca alguns antes de
 *  outros). Reduzido de 2.4 para 2.2 (pedido do usuário, 16/09/2026): o pulo
 *  ficava forte demais partindo do zoom normal. */
const ESCALA_DE_FOCO = 2.2
/** Quanto tempo o assentamento leva depois de soltar — nem instantâneo (o
 *  pulo pareceria bug), nem longo o bastante para atrasar quem já quer seguir. */
const DURACAO_DO_ASSENTAMENTO = 900

/**
 * A revelação de um neurônio recém-criado (pedido do usuário, 17/09/2026):
 * a Tela já enquadra tudo sozinha ao montar (ver o efeito de `assinatura`
 * mais abaixo) — a pausa é só para esse "palácio inteiro" ter tempo de ser
 * visto antes de a câmera aproximar. Ver `revelar`.
 */
const PAUSA_ANTES_DE_REVELAR = 450
const DURACAO_DA_REVELACAO = 850
/** Menor que `ESCALA_MAXIMA`: um par bem próximo não pode virar um zoom
 *  absurdo só porque a caixa que os enquadra é minúscula. */
const ESCALA_MAXIMA_DA_REVELACAO = 3.2

/**
 * O quanto o balanço desloca cada neurônio, em pixels de **tela** — não de
 * mundo. Dividido pela escala da câmera na hora de pintar (ver `pintar`),
 * então "leve" quer dizer a mesma coisa em qualquer zoom, do mesmo jeito que
 * o próprio ponto já é desenhado em tamanho de tela (`raioNaTela`).
 */
const AMPLITUDE_DO_BALANCO_PX = 2.5

export interface ControleDaTela {
  enquadrar: () => void
  /** Centraliza a câmera num neurônio, aproximando até `ESCALA_DE_FOCO` — nunca afasta. */
  focar: (id: Id) => void
  /**
   * A câmera, já enquadrando tudo, aproxima até este neurônio — e se ele tiver
   * algum vizinho, seleciona ao chegar (acendendo o fio que acabou de nascer).
   * Sem vizinho nenhum, só centraliza: selecionar um nó sem ninguém ligado
   * apagaria o resto do palácio à toa (ver `vizinhancaDe`).
   */
  revelar: (id: Id) => void
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
  /** Tocar um satélite (um item de pasta) escolhe ele, e não o neurônio colado nele. */
  onSelecionarAnexo: (id: Id) => void
  /**
   * Solta um neurônio arrastado no ponto novo (mundo). Devolve o layout já
   * reagindo a ele — a tela anima o assentamento sozinha com o resultado, sem
   * esperar a store re-renderizar para saber onde a vizinhança parou.
   */
  onArrastarNeuronio: (id: Id, ponto: Ponto) => Promise<Readonly<Record<Id, Ponto>>>
  controle?: RefObject<ControleDaTela | null>
  /** Estável entre renders (constante de módulo): enquadrar depende dela. */
  folgas: Folgas
}

const MISTURAS = ['lighter', 'multiply', 'screen', 'source-over'] as const

function ehMistura(valor: string): valor is (typeof MISTURAS)[number] {
  return (MISTURAS as readonly string[]).includes(valor)
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
    ouro: lerCor(el, '--ouro-gravado'),
    nevoa: lerCor(el, '--nevoa'),
    mistura: ehMistura(mistura) ? mistura : 'source-over',
  }
}

export function Tela({
  cena,
  onSelecionar,
  onSelecionarAnexo,
  onArrastarNeuronio,
  controle,
  folgas,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const cores = useRef<CoresDaRede | null>(null)
  const cenaRef = useRef(cena)
  /** A pausa entre montar enquadrando tudo e a câmera aproximar do neurônio
   *  revelado — ver `revelar`. Um `setTimeout`, não um `rAF`: não pinta nada
   *  enquanto espera. */
  const pausaDaRevelacao = useRef<number | null>(null)
  const revelacaoEmAndamento = useRef<{ cancelado: boolean } | null>(null)

  /** O neurônio sob o dedo desde o toque, se o toque começou em cima de um —
   *  `null` enquanto o gesto é (ou ainda pode virar) arrastar a câmera. */
  const noArrastado = useRef<({ mundoInicial: Ponto } & NoArrastado) | null>(null)
  /** As posições que o desenho usa em vez das da cena, enquanto um nó está
   *  sendo arrastado ou assentando — `null` quando a cena manda de verdade. */
  const posicoesArrastadas = useRef<Map<Id, Ponto> | null>(null)
  /** Cancela um assentamento anterior se um novo arrasto começar no meio dele. */
  const assentamentoEmAndamento = useRef<{ cancelado: boolean } | null>(null)

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

    // O balanço: soma um deslocamento pequeno e periódico (puramente visual,
    // nunca gravado — ver `balanco` em layout.ts) em cima de cada posição
    // real, antes do overlay de arrasto/assentamento — um nó sendo arrastado
    // não balança, a posição dele é a mão de quem arrasta.
    const agora = performance.now()
    const amplitude = AMPLITUDE_DO_BALANCO_PX / Math.max(camera.current.escala, 0.001)
    const balancadas = new Map<Id, Ponto>()
    for (const [id, p] of cenaRef.current.posicoes) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        balancadas.set(id, p)
        continue
      }
      const b = balanco(id, agora)
      balancadas.set(id, { x: p.x + b.x * amplitude, y: p.y + b.y * amplitude })
    }

    const overlay = posicoesArrastadas.current
    const posicoes =
      overlay && overlay.size > 0 ? new Map<Id, Ponto>([...balancadas, ...overlay]) : balancadas

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    desenhar(
      ctx,
      { ...cenaRef.current, posicoes, cores: cores.current },
      camera.current,
      largura,
      altura,
    )
  }, [])

  /**
   * Enquadra pelos próprios pontos, e não por limites calculados com rótulo —
   * a constelação não escreve nome de livro. A área útil é a tela menos o que
   * fica por cima dela, e o centro desce ou sobe pela diferença entre as folgas.
   */
  const enquadrar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    camera.current = camaraParaEnquadrar(
      [...cenaRef.current.posicoes.values()],
      canvas.clientWidth,
      canvas.clientHeight,
      folgas,
      ESCALA_MINIMA,
      ESCALA_MAXIMA,
    )
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

  /**
   * Anima do quadro em que o dedo soltou até onde a física de verdade decidiu
   * que a vizinhança deveria ficar — "assenta e para", não um laço eterno: só
   * corre por `DURACAO_DO_ASSENTAMENTO` e some. Um arrasto novo no meio
   * cancela este via `execucao.cancelado`, para os dois não brigarem pelo
   * mesmo overlay.
   */
  const animarAssentamento = useCallback(
    (
      inicio: ReadonlyMap<Id, Ponto>,
      alvo: Readonly<Record<Id, Ponto>>,
      execucao: { cancelado: boolean },
    ) => {
      const t0 = performance.now()

      const quadro = (agora: number): void => {
        if (execucao.cancelado) return
        const t = Math.min(1, (agora - t0) / DURACAO_DO_ASSENTAMENTO)

        posicoesArrastadas.current = quadroDoAssentamento(inicio, alvo, easeOutCubic(t))
        pintar()

        if (t < 1) requestAnimationFrame(quadro)
        else posicoesArrastadas.current = null
      }

      requestAnimationFrame(quadro)
    },
    [pintar],
  )

  /**
   * Soltou o dedo em cima de um arrasto de verdade: congela a vizinhança
   * exatamente onde acompanhou até aqui, pede ao motor a física de verdade a
   * partir do ponto do soltar, e anima o resultado quando ele chegar.
   */
  const assentar = useCallback(
    (id: Id, pontoFinal: Ponto) => {
      const congelado = new Map(posicoesArrastadas.current ?? [])
      congelado.set(id, pontoFinal)
      posicoesArrastadas.current = congelado
      pintar()

      if (assentamentoEmAndamento.current) assentamentoEmAndamento.current.cancelado = true
      const execucao = { cancelado: false }
      assentamentoEmAndamento.current = execucao

      onArrastarNeuronio(id, pontoFinal)
        .then((posicoesReais) => {
          if (execucao.cancelado) return
          animarAssentamento(congelado, posicoesReais, execucao)
        })
        .catch(() => {
          if (execucao.cancelado) return
          posicoesArrastadas.current = null
          pintar()
        })
    },
    [pintar, onArrastarNeuronio, animarAssentamento],
  )

  /**
   * A câmera e o dedo (`useCamera`, o mesmo do Mapa). O que é só da Rede entra
   * pelos ganchos: tocar num neurônio pode virar arrastá-lo, e o toque escolhe
   * entre neurônio e satélite.
   */
  const { gestos, aplicarZoom, animarCamera } = useCamera({
    canvasRef,
    cameraRef: camera,
    pintar,
    escalaMinima: ESCALA_MINIMA,
    escalaMaxima: ESCALA_MAXIMA,
    aoInterromper() {
      if (revelacaoEmAndamento.current) revelacaoEmAndamento.current.cancelado = true
      if (pausaDaRevelacao.current !== null) {
        window.clearTimeout(pausaDaRevelacao.current)
        pausaDaRevelacao.current = null
      }
    },
    // Em cima de um neurônio, o gesto pode virar arrastar o nó. Um satélite não
    // se arrasta: tocar nele nunca vira arrastar o dono.
    aoDescer(mundo) {
      const tocado = alvoDoToque(mundo)
      const alvo = tocado?.tipo === 'neuronio' ? tocado.id : null
      const origem = alvo ? cena.posicoes.get(alvo) : undefined
      if (!alvo || !origem) {
        noArrastado.current = null
        return false
      }
      if (assentamentoEmAndamento.current) assentamentoEmAndamento.current.cancelado = true
      const vizinhos: { id: Id; score: number; origem: Ponto }[] = []
      for (const c of cena.conexoes) {
        const outro = c.aId === alvo ? c.bId : c.bId === alvo ? c.aId : null
        if (outro === null) continue
        const p = cena.posicoes.get(outro)
        if (p) vizinhos.push({ id: outro, score: c.score, origem: p })
      }
      noArrastado.current = { id: alvo, mundoInicial: mundo, origem, vizinhos }
      return true
    },
    aoArrastarTomado(mundo) {
      const alvo = noArrastado.current
      if (!alvo) return
      posicoesArrastadas.current = posicoesDoArrasto(alvo, {
        x: mundo.x - alvo.mundoInicial.x,
        y: mundo.y - alvo.mundoInicial.y,
      })
      pintar()
    },
    aoSoltarTomado(mundo, arrastou) {
      const alvo = noArrastado.current
      noArrastado.current = null
      if (!alvo) return
      if (!arrastou) {
        // Um toque comum em cima do nó: nada se moveu, nada fica no overlay.
        posicoesArrastadas.current = null
        return
      }
      // Reposicionar não seleciona (pedido do usuário, 16/09/2026): soltar
      // depois de arrastar só assenta a vizinhança.
      assentar(alvo.id, {
        x: alvo.origem.x + (mundo.x - alvo.mundoInicial.x),
        y: alvo.origem.y + (mundo.y - alvo.mundoInicial.y),
      })
    },
    aoDesistirDoTomado() {
      noArrastado.current = null
      posicoesArrastadas.current = null
    },
    aoTocar(mundo, cliente, duplo) {
      const tocado = alvoDoToque(mundo)
      if (tocado?.tipo === 'anexo') onSelecionarAnexo(tocado.id)
      else onSelecionar(tocado?.id ?? null)
      if (!duplo) return
      // Duplo toque num satélite não aproxima: ele só existe de perto.
      if (tocado?.tipo === 'neuronio') focar(tocado.id)
      else if (!tocado) aplicarZoom(ZOOM_DO_DUPLO_TOQUE, cliente.x, cliente.y)
    },
  })

  /**
   * O neurônio que acabou de nascer: a câmera já está enquadrando o palácio
   * inteiro (a Tela enquadra sozinha ao montar), então espera um instante
   * para isso ser visto, aproxima até ele — e até seus vizinhos, se houver
   * algum, para o fio que acabou de nascer caber no quadro — e seleciona ao
   * chegar. Sem vizinho nenhum, só centraliza: selecionar apagaria o resto do
   * palácio à toa para destacar uma vizinhança que não existe.
   */
  const revelar = useCallback(
    (id: Id) => {
      const canvas = canvasRef.current
      const p = cenaRef.current.posicoes.get(id)
      if (!canvas || !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return

      const vizinhanca = vizinhancaDe(id, cenaRef.current.conexoes) ?? new Set([id])
      const pontos = [...vizinhanca]
        .map((vid) => cenaRef.current.posicoes.get(vid))
        .filter(
          (pt): pt is Ponto => pt !== undefined && Number.isFinite(pt.x) && Number.isFinite(pt.y),
        )
      const temVizinhos = pontos.length > 1

      const alvo: Camera = temVizinhos
        ? camaraParaEnquadrar(
            pontos,
            canvas.clientWidth,
            canvas.clientHeight,
            folgas,
            ESCALA_MINIMA,
            ESCALA_MAXIMA_DA_REVELACAO,
          )
        : {
            escala: ESCALA_DE_FOCO,
            x: -p.x * ESCALA_DE_FOCO,
            y: -p.y * ESCALA_DE_FOCO + (folgas.topo - folgas.base) / 2,
          }

      const concluir = (): void => {
        if (temVizinhos) onSelecionar(id)
      }

      // O mesmo respeito de "abrir o livro" (Fase 22): sem laço nenhum, vai
      // direto para onde a animação terminaria.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        camera.current = alvo
        pintar()
        concluir()
        return
      }

      if (pausaDaRevelacao.current !== null) window.clearTimeout(pausaDaRevelacao.current)
      pausaDaRevelacao.current = window.setTimeout(() => {
        pausaDaRevelacao.current = null
        animarCamera(alvo, DURACAO_DA_REVELACAO, revelacaoEmAndamento, concluir)
      }, PAUSA_ANTES_DE_REVELAR)
    },
    [pintar, folgas, animarCamera, onSelecionar],
  )

  useImperativeHandle(controle, () => ({ enquadrar, focar, revelar }), [enquadrar, focar, revelar])

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

  /**
   * O canvas não tem cascata: as cores foram copiadas para pixels na última
   * pintura e ficam lá. Sem esquecê-las ao trocar de tema, a rede ficaria com a
   * sala do tema anterior dentro de uma página do tema novo.
   */
  const esquecerCores = useCallback(() => {
    cores.current = null
  }, [])
  useRepintarAoMudar(canvasRef, pintar, esquecerCores)

  /**
   * O laço do balanço: roda enquanto esta tela está montada, e só — começa
   * ao abrir a Rede, para ao sair dela (nunca em segundo plano). É a exceção
   * de verdade a "sem laço de animação" (ver o comentário do arquivo).
   * `prefers-reduced-motion` desliga inteiro: quem pediu menos movimento não
   * pediu um balanço perpétuo de fundo.
   */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ativo = true
    let quadroId: number

    const quadro = (): void => {
      if (!ativo) return
      pintar()
      quadroId = requestAnimationFrame(quadro)
    }
    quadroId = requestAnimationFrame(quadro)

    return () => {
      ativo = false
      cancelAnimationFrame(quadroId)
    }
  }, [pintar])

  /**
   * O que está debaixo do dedo: um neurônio, um satélite, ou nada. O satélite
   * orbita colado no dono (11-16 px de tela, dentro do mesmo alvo de toque de
   * 22 px), então o toque fica com o mais perto dos dois.
   */
  function alvoDoToque(mundo: Ponto): { tipo: 'neuronio' | 'anexo'; id: Id } | null {
    const escala = camera.current.escala
    const raio = RAIO_DO_TOQUE / escala
    const neuronio = neuronioEm(mundo, cena.posicoes, cena.neuronios, raio)
    const visiveis = satelitesVisiveis(cena.satelites, {
      escala,
      soAsPontes: cena.soAsPontes,
      selecionado: cena.selecionado,
      anexoSelecionado: cena.anexoSelecionado,
    })
    const satelite = sateliteEm(mundo, visiveis, cena.posicoes, escala, raio)

    if (satelite && neuronio) {
      const p = cena.posicoes.get(neuronio)
      const distancia = p ? Math.hypot(p.x - mundo.x, p.y - mundo.y) : Infinity
      return satelite.distancia < distancia
        ? { tipo: 'anexo', id: satelite.anexoId }
        : { tipo: 'neuronio', id: neuronio }
    }
    if (satelite) return { tipo: 'anexo', id: satelite.anexoId }
    if (neuronio) return { tipo: 'neuronio', id: neuronio }
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="bg-sala h-full w-full touch-none"
      aria-label={`Rede do palácio: ${String(cena.neuronios.length)} neurônios e ${String(cena.conexoes.length)} conexões`}
      {...gestos}
    />
  )
}
