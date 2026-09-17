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
  vizinhancaDe,
  type NoArrastado,
} from './layout'

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
const TOLERANCIA_DO_TOQUE = 8
/** Alvo de toque em pixels de tela: um ponto de 2 px é impossível de acertar com o dedo. */
const RAIO_DO_TOQUE = 22
/** O mesmo par de números que qualquer duplo toque neste app usa: uma segunda
 *  batida perto e rápida da primeira. */
const JANELA_DO_DUPLO_TOQUE = 350
const RAIO_DO_DUPLO_TOQUE = 40
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
 * O deslize da câmera ao soltar arrastando — padrão sempre ligado desde
 * 17/09/2026 (era opcional, atrás de um botão nos filtros; virou o único
 * comportamento depois que o usuário decidiu ficar sempre com ele). Não é
 * inércia de verdade (que desaceleraria por tempo indefinido, o tipo de laço
 * que este arquivo evita), é um "assenta e para" na direção do gesto — a
 * mesma ideia do assentamento de um neurônio arrastado, só que projetando a
 * posição em vez de pedir ao motor.
 */
const VELOCIDADE_MINIMA_DO_DESLIZE = 0.12 // px/ms — abaixo disso, soltar já era "parar", não "arremessar"
const PROJECAO_DO_DESLIZE_MS = 220
const DISTANCIA_MAXIMA_DO_DESLIZE = 200 // px — "desliza um pouco", não sai voando com um flick forte
const DURACAO_DO_DESLIZE = 300

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

export function Tela({ cena, onSelecionar, onArrastarNeuronio, controle, folgas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useRef<Camera>({ x: 0, y: 0, escala: 1 })
  const cores = useRef<CoresDaRede | null>(null)
  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const arrastou = useRef(0)
  /** O último toque solto, para reconhecer um segundo logo em seguida como duplo. */
  const ultimoToque = useRef<{ tempo: number; x: number; y: number } | null>(null)
  const cenaRef = useRef(cena)

  /** Velocidade do arrasto de câmera (px/ms), suavizada quadro a quadro — só
   *  para decidir o deslize ao soltar, ver `iniciarDeslize`. */
  const velocidadeDoArrasto = useRef({ vx: 0, vy: 0 })
  const ultimoQuadroDoArrasto = useRef(0)
  const deslizeEmAndamento = useRef<{ cancelado: boolean } | null>(null)
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
   * Anima a câmera de onde ela está até um alvo, com `easeOutCubic` — o mesmo
   * "assenta e para" de tudo nesta tela, generalizado: é a terceira animação
   * de câmera/posição do arquivo (depois de `animarAssentamento` e o antigo
   * deslize embutido), e as três repetiam o mesmo laço de `rAF` cancelável.
   * `execucaoRef` é de quem chama — cada animação tem a própria, para uma
   * nova não brigar com uma anterior pelo mesmo `camera.current`.
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

      const origem = { ...camera.current }
      const t0 = performance.now()

      const quadro = (agora: number): void => {
        if (execucao.cancelado) return
        const k = easeOutCubic(Math.min(1, (agora - t0) / duracaoMs))

        camera.current = {
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
    [pintar],
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
   * Soltou arrastando a câmera com alguma velocidade: desliza mais um pouco na
   * mesma direção, com o mesmo "assenta e para" do resto da tela — não uma
   * inércia que desacelera por tempo indefinido, e sim um alvo fixo (a
   * velocidade projetada, com um teto de distância) animado com easeOutCubic.
   * Abaixo de `VELOCIDADE_MINIMA_DO_DESLIZE` não faz nada: um arrasto que já
   * estava parando na hora de soltar não deve ganhar vida própria.
   */
  const iniciarDeslize = useCallback(
    (vx: number, vy: number) => {
      const velocidade = Math.hypot(vx, vy)
      if (velocidade < VELOCIDADE_MINIMA_DO_DESLIZE) return

      const distancia = Math.min(DISTANCIA_MAXIMA_DO_DESLIZE, velocidade * PROJECAO_DO_DESLIZE_MS)
      const escala = distancia / velocidade
      animarCamera(
        {
          x: camera.current.x + vx * escala,
          y: camera.current.y + vy * escala,
          escala: camera.current.escala,
        },
        DURACAO_DO_DESLIZE,
        deslizeEmAndamento,
      )
    },
    [animarCamera],
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

        // Um toque novo interrompe qualquer deslize ou revelação ainda em
        // curso — segurar a tela é sempre "para agora", nunca "espera acabar".
        if (deslizeEmAndamento.current) deslizeEmAndamento.current.cancelado = true
        if (revelacaoEmAndamento.current) revelacaoEmAndamento.current.cancelado = true
        if (pausaDaRevelacao.current !== null) {
          window.clearTimeout(pausaDaRevelacao.current)
          pausaDaRevelacao.current = null
        }
        velocidadeDoArrasto.current = { vx: 0, vy: 0 }
        ultimoQuadroDoArrasto.current = 0

        // O primeiro dedo a descer decide: em cima de um neurônio, o gesto
        // pode virar arrastar o nó; em qualquer outro lugar (ou com um
        // segundo dedo já no ar), continua sendo câmera. A decisão de verdade
        // só vem no solto — `arrastou.current` é o mesmo teste de tolerância
        // que já separa toque de arrasto de câmera.
        if (ponteiros.current.size === 0) {
          const mundo = paraOMundo(e.clientX, e.clientY)
          const raioDeToque = RAIO_DO_TOQUE / camera.current.escala
          const alvo = neuronioEm(mundo, cena.posicoes, cena.neuronios, raioDeToque)
          const origem = alvo ? cena.posicoes.get(alvo) : undefined

          if (alvo && origem) {
            if (assentamentoEmAndamento.current) assentamentoEmAndamento.current.cancelado = true
            const vizinhos: { id: Id; score: number; origem: Ponto }[] = []
            for (const c of cena.conexoes) {
              const outro = c.aId === alvo ? c.bId : c.bId === alvo ? c.aId : null
              if (outro === null) continue
              const p = cena.posicoes.get(outro)
              if (p) vizinhos.push({ id: outro, score: c.score, origem: p })
            }
            noArrastado.current = { id: alvo, mundoInicial: mundo, origem, vizinhos }
          } else {
            noArrastado.current = null
          }
        }

        ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        arrastou.current = 0
      }}
      onPointerMove={(e) => {
        const anterior = ponteiros.current.get(e.pointerId)
        if (!anterior) return

        const dx = e.clientX - anterior.x
        const dy = e.clientY - anterior.y

        if (ponteiros.current.size === 2) {
          // Um segundo dedo cancela o arrasto de nó — vira pinça, como sempre.
          noArrastado.current = null
          posicoesArrastadas.current = null
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

        const alvo = noArrastado.current
        if (alvo) {
          const mundo = paraOMundo(e.clientX, e.clientY)
          posicoesArrastadas.current = posicoesDoArrasto(alvo, {
            x: mundo.x - alvo.mundoInicial.x,
            y: mundo.y - alvo.mundoInicial.y,
          })
          pintar()
          return
        }

        camera.current = {
          ...camera.current,
          x: camera.current.x + dx,
          y: camera.current.y + dy,
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
      }}
      onPointerUp={(e) => {
        const eraUmDedoSo = ponteiros.current.size === 1
        ponteiros.current.delete(e.pointerId)

        const alvoDoArrasto = noArrastado.current
        noArrastado.current = null

        if (alvoDoArrasto && eraUmDedoSo && arrastou.current > TOLERANCIA_DO_TOQUE) {
          // Reposicionar não seleciona (pedido do usuário, 16/09/2026): soltar
          // depois de arrastar só assenta a vizinhança. Abrir as informações é
          // coisa de toque, no ramo abaixo — não de reposicionar.
          const mundo = paraOMundo(e.clientX, e.clientY)
          ultimoToque.current = null
          assentar(alvoDoArrasto.id, {
            x: alvoDoArrasto.origem.x + (mundo.x - alvoDoArrasto.mundoInicial.x),
            y: alvoDoArrasto.origem.y + (mundo.y - alvoDoArrasto.mundoInicial.y),
          })
          return
        }
        // Um toque comum em cima do nó (sem arrastar de verdade): nada se
        // moveu, então nada fica preso no overlay.
        if (alvoDoArrasto) posicoesArrastadas.current = null

        if (!eraUmDedoSo || arrastou.current > TOLERANCIA_DO_TOQUE) {
          // Soltou arrastando a câmera de verdade (não um nó, não uma pinça
          // terminando): desliza mais um pouco.
          if (!alvoDoArrasto && eraUmDedoSo) {
            iniciarDeslize(velocidadeDoArrasto.current.vx, velocidadeDoArrasto.current.vy)
          }
          return
        }

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
        noArrastado.current = null
        posicoesArrastadas.current = null
      }}
      onWheel={(e) => {
        aplicarZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
      }}
    />
  )
}
