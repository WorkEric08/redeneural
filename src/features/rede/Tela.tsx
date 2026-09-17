import { useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from 'react'

import type { Id, Ponto } from '@/core'

import { desenhar, type Camera, type Cena, type CoresDaRede } from './desenhar'
import {
  neuronioEm,
  posicoesDoArrasto,
  quadroDoAssentamento,
  easeOutCubic,
  type NoArrastado,
} from './layout'

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
/** Quanto tempo o assentamento leva depois de soltar — nem instantâneo (o
 *  pulo pareceria bug), nem longo o bastante para atrasar quem já quer seguir. */
const DURACAO_DO_ASSENTAMENTO = 900

/**
 * O deslize da câmera ao soltar arrastando (opção "Deslizar navegação", ligada
 * por quem navega — desligada por padrão, ver Rede.tsx): não é inércia de
 * verdade (que desaceleraria por tempo indefinido, o tipo de laço que este
 * arquivo evita), é um "assenta e para" na direção do gesto — a mesma ideia do
 * assentamento de um neurônio arrastado, só que projetando a posição em vez de
 * pedir ao motor.
 */
const VELOCIDADE_MINIMA_DO_DESLIZE = 0.12 // px/ms — abaixo disso, soltar já era "parar", não "arremessar"
const PROJECAO_DO_DESLIZE_MS = 220
const DISTANCIA_MAXIMA_DO_DESLIZE = 200 // px — "desliza um pouco", não sai voando com um flick forte
const DURACAO_DO_DESLIZE = 300

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
  /**
   * Solta um neurônio arrastado no ponto novo (mundo). Devolve o layout já
   * reagindo a ele — a tela anima o assentamento sozinha com o resultado, sem
   * esperar a store re-renderizar para saber onde a vizinhança parou.
   */
  onArrastarNeuronio: (id: Id, ponto: Ponto) => Promise<Readonly<Record<Id, Ponto>>>
  controle?: RefObject<ControleDaTela | null>
  /** Estável entre renders (constante de módulo): enquadrar depende dela. */
  folgas: Folgas
  /** Soltar arrastando a câmera desliza um pouco na direção do gesto, em vez
   *  de parar exatamente onde o dedo soltou (ver `DISTANCIA_MAXIMA_DO_DESLIZE`). */
  deslizarNavegacao: boolean
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

export function Tela({
  cena,
  onSelecionar,
  onArrastarNeuronio,
  controle,
  folgas,
  deslizarNavegacao,
}: Props) {
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

    const overlay = posicoesArrastadas.current
    const posicoes =
      overlay && overlay.size > 0
        ? new Map<Id, Ponto>([...cenaRef.current.posicoes, ...overlay])
        : cenaRef.current.posicoes

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

      if (deslizeEmAndamento.current) deslizeEmAndamento.current.cancelado = true
      const execucao = { cancelado: false }
      deslizeEmAndamento.current = execucao

      const distancia = Math.min(DISTANCIA_MAXIMA_DO_DESLIZE, velocidade * PROJECAO_DO_DESLIZE_MS)
      const escala = distancia / velocidade
      const origemX = camera.current.x
      const origemY = camera.current.y
      const alvoX = origemX + vx * escala
      const alvoY = origemY + vy * escala
      const t0 = performance.now()

      const quadro = (agora: number): void => {
        if (execucao.cancelado) return
        const t = Math.min(1, (agora - t0) / DURACAO_DO_DESLIZE)
        const suavizado = easeOutCubic(t)

        camera.current = {
          ...camera.current,
          x: origemX + (alvoX - origemX) * suavizado,
          y: origemY + (alvoY - origemY) * suavizado,
        }
        pintar()

        if (t < 1) requestAnimationFrame(quadro)
        else deslizeEmAndamento.current = null
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

        // Um toque novo interrompe qualquer deslize ainda em curso — segurar
        // a tela é sempre "para agora", nunca "espera o deslize acabar".
        if (deslizeEmAndamento.current) deslizeEmAndamento.current.cancelado = true
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

        // Velocidade suavizada (px/ms) para decidir o deslize ao soltar — só
        // importa quando "Deslizar navegação" está ligada, mas é barato o
        // bastante para não valer a pena gatear.
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
          // terminando): com a opção ligada, desliza mais um pouco.
          if (deslizarNavegacao && !alvoDoArrasto && eraUmDedoSo) {
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
