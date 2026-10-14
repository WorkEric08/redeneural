import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as EventoDeMouse,
  type PointerEvent as EventoDePonteiro,
} from 'react'

import type { LadoDoLivro, PontoDeSoltura } from '@/core'

/**
 * O livro como objeto na mão — e os lugares da estante como onde ele cabe.
 *
 * | Gesto                              | O que faz                                           |
 * | ---------------------------------- | ---------------------------------------------------- |
 * | Tocar um livro                     | Espia (o painel puxa o livro para fora)             |
 * | Segurar um livro                   | Ergue o livro e acende as pontes dele               |
 * | Segurar e soltar parado            | Abre o menu do livro                                |
 * | Segurar, arrastar e soltar         | Põe no lugar embaixo do dedo — empurra se tiver livro |
 * | Tocar um lugar sem livro           | Cria um livro exatamente ali                        |
 * | Segurar um lugar sem livro         | Menu do lugar: pôr ou tirar o enfeite               |
 * | Segurar um enfeite e arrastar      | Põe no lugar embaixo do dedo, com as regras do livro |
 *
 * Tocar é o `click` nativo, e não o `pointerup`: é o que Enter e Espaço também
 * disparam, então o teclado ganha o mesmo gesto sem código a mais. Quando o
 * dedo segurou ou arrastou, o clique que o navegador manda no fim é engolido —
 * senão soltar um livro também o espiaria.
 */

/** O mesmo tempo que abre o dial: segurar tem que ter a mesma medida no app inteiro. */
const ESPERA = 380

/** Um dedo que andou mais que isto antes de erguer o livro não estava tocando. */
const TOLERANCIA = 8

/**
 * Lugar é estreito, e o dedo cobre o que está apontando. Sem esta folga, soltar
 * na fresta de 1 px entre dois lugares não acertaria nenhum.
 */
const FOLGA_DO_ALVO = 14

export type FaseDoGesto = 'parado' | 'erguido' | 'arrastando'

export interface LugarDaEstante {
  prateleira: number
  lugar: number
  /**
   * Só quando o dedo está sobre uma pilha: entre quais livros dela o livro na mão entraria
   * (0 embaixo, a quantidade de livros no topo; o livro na mão não conta).
   */
  posicao?: number
  /**
   * Só quando o dedo está sobre um livro (ou uma pilha): em que metade dele, a da esquerda ou a da
   * direita. É a fresta onde o livro na mão cai, se ele não entra no que está embaixo.
   */
  lado?: LadoDoLivro
}

/** O que o dedo apontou além do lugar, no formato que as regras da estante recebem. */
export function pontoDoAlvo(alvo: LugarDaEstante): PontoDeSoltura {
  return {
    ...(alvo.posicao === undefined ? {} : { posicao: alvo.posicao }),
    ...(alvo.lado === undefined ? {} : { lado: alvo.lado }),
  }
}

export interface Gesto {
  fase: FaseDoGesto
  livroId: string | null
  /**
   * O lugar do enfeite na mão — no lugar de `livroId`: ou é um livro ou é um
   * enfeite que está sendo levado, nunca os dois.
   */
  enfeite: LugarDaEstante | null
  /**
   * O lugar embaixo do dedo — é para lá que o livro na mão vai. `null` fora de
   * qualquer prateleira: soltar ali devolve o livro para onde estava.
   */
  alvo: LugarDaEstante | null
  /** Onde o livro estava na tela quando saiu da prateleira: é de lá que o fantasma parte. */
  origem: DOMRect | null
}

export interface ManipulacaoDaLombada {
  onPointerDown: (evento: EventoDePonteiro<HTMLElement>) => void
  /**
   * Só o lugar sem livro (e o enfeite) ouve o próprio elemento. O livro ouve a **janela** depois de
   * tocado: a prévia da estante move o livro no DOM enquanto ele está na mão, e um elemento que
   * muda de lugar (ou de prateleira) perde os eventos de ponteiro.
   */
  onPointerMove?: (evento: EventoDePonteiro<HTMLElement>) => void
  onPointerUp?: (evento: EventoDePonteiro<HTMLElement>) => void
  onPointerCancel?: () => void
  onClick: (evento: EventoDeMouse<HTMLElement>) => void
  onContextMenu: (evento: EventoDeMouse<HTMLElement>) => void
}

interface Toque {
  livroId: string
  pointerId: number
  x0: number
  y0: number
  caixa: DOMRect
  /** O dedo andou antes de o livro erguer: não é toque nem segurar. */
  desistiu: boolean
}

interface Opcoes {
  onEspiar: (livroId: string) => void
  onAcoes: (livroId: string) => void
  /** Soltou arrastando sobre um lugar. */
  onMover: (livroId: string, alvo: LugarDaEstante) => void
  onTocarLugar: (alvo: LugarDaEstante) => void
  onAcoesDoLugar: (alvo: LugarDaEstante) => void
  /** Soltou um enfeite arrastando sobre outro lugar: `origem` é onde ele estava. */
  onMoverEnfeite: (origem: LugarDaEstante, alvo: LugarDaEstante) => void
}

/** O que a janela e o React têm em comum de um evento de ponteiro. */
interface Ponteiro {
  pointerId: number
  clientX: number
  clientY: number
}

const PARADO: Gesto = { fase: 'parado', livroId: null, enfeite: null, alvo: null, origem: null }

interface Caixa {
  left: number
  right: number
  top: number
  bottom: number
}

interface LugarCapturado {
  lugar: number
  caixa: Caixa
  tipo: 'livro' | 'pilha' | 'vazio'
  /** Numa pilha: o meio, na vertical, de cada livro dela. */
  livros: { id: string; meio: number }[]
}

interface VaoCapturado {
  prateleira: number
  caixa: Caixa
  lugares: LugarCapturado[]
}

/** Onde cada prateleira e cada lugar estavam na tela quando o livro saiu da estante. */
type Geometria = VaoCapturado[]

function caixaDe(elemento: Element): Caixa {
  const r = elemento.getBoundingClientRect()
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
}

/**
 * Tira uma foto da geometria da estante. O alvo do dedo se mede **nela**, e não no que está na tela
 * agora: com a prévia ao vivo os livros se afastam para abrir o lugar do que está na mão, e medir
 * neles faria o alvo mudar por causa do próprio afastamento — a prateleira ficaria tremendo.
 */
function capturarGeometria(): Geometria {
  return [...document.querySelectorAll<HTMLElement>('[data-prateleira]')].map((vao) => ({
    prateleira: Number(vao.dataset['prateleira']),
    caixa: caixaDe(vao),
    lugares: [...vao.querySelectorAll<HTMLElement>('[data-lugar]')].map((el) => {
      const pilha = el.classList.contains('pilha')
      return {
        lugar: Number(el.dataset['lugar']),
        caixa: caixaDe(el),
        tipo: pilha ? 'pilha' : el.hasAttribute('data-livro-id') ? 'livro' : 'vazio',
        livros: pilha
          ? [...el.querySelectorAll<HTMLElement>('[data-livro-id]')].map((livro) => {
              const c = caixaDe(livro)
              return { id: livro.dataset['livroId'] ?? '', meio: (c.top + c.bottom) / 2 }
            })
          : [],
      }
    }),
  }))
}

/**
 * O lugar na coluna do dedo, dentro da prateleira em que ele está.
 *
 * Pela coluna, e não pelo elemento embaixo do dedo: as lombadas têm alturas
 * diferentes, e soltar acima de um livro baixo tem que valer o lugar dele, não
 * cair no vão da prateleira. Qualquer lugar serve, inclusive o do livro na mão
 * — o vão que ele deixa (`data-estado='vazio'`) continua ali, e soltar nele é
 * desistir.
 */
function alvoNaEstante(
  x: number,
  y: number,
  livroNaMao: string | null,
  geometria: Geometria,
): LugarDaEstante | null {
  const dentro = (c: Caixa): boolean => x >= c.left && x <= c.right && y >= c.top && y <= c.bottom

  // A prateleira de baixo pinta por cima da de cima: um livro alto que sobe sobre a de cima é o que o
  // dedo está tocando ali — o último que acerta vence.
  const vao =
    [...geometria].reverse().find((v) => v.lugares.some((l) => dentro(l.caixa))) ??
    geometria.find((v) => dentro(v.caixa))
  if (!vao) return null

  let perto: LugarCapturado | null = null
  let distancia = Infinity
  for (const lugar of vao.lugares) {
    const d = Math.max(lugar.caixa.left - x, x - lugar.caixa.right, 0)
    if (d < distancia) {
      perto = lugar
      distancia = d
    }
    if (d === 0) break
  }

  if (!perto || distancia > FOLGA_DO_ALVO) return null
  const alvo = { prateleira: vao.prateleira, lugar: perto.lugar }
  if (perto.tipo === 'vazio') return alvo // sem livro, não tem lado: o livro toma o lugar

  const lado: LadoDoLivro = x < (perto.caixa.left + perto.caixa.right) / 2 ? 'antes' : 'depois'
  if (perto.tipo === 'pilha') {
    // Em que ponto da pilha o dedo está: quantos livros dela ficam abaixo da linha do dedo — o andar
    // em que o livro na mão entraria (0 é a base; a quantidade de livros, o topo). O meio de cada
    // livro é a fronteira, e o livro na mão não conta, mesmo quando é da própria pilha.
    const abaixo = perto.livros.filter((l) => l.id !== livroNaMao && l.meio > y).length
    return { ...alvo, posicao: abaixo, lado }
  }
  return { ...alvo, lado }
}

function mesmoLugar(a: LugarDaEstante | null, b: LugarDaEstante | null): boolean {
  return a?.prateleira === b?.prateleira && a?.lugar === b?.lugar
}

/** O mesmo lugar **e** o mesmo ponto da pilha: é o que muda o que se desenha enquanto o livro anda. */
export function mesmoAlvo(a: LugarDaEstante | null, b: LugarDaEstante | null): boolean {
  return mesmoLugar(a, b) && a?.posicao === b?.posicao && a?.lado === b?.lado
}

export function useManipularLivros({
  onEspiar,
  onAcoes,
  onMover,
  onTocarLugar,
  onAcoesDoLugar,
  onMoverEnfeite,
}: Opcoes) {
  const [gesto, setGesto] = useState<Gesto>(PARADO)
  /** O lugar sem livro que o dedo segurou o bastante: soltar abre o menu dele. */
  const [lugarSegurado, setLugarSegurado] = useState<LugarDaEstante | null>(null)

  // Os eventos leem o gesto no mesmo instante em que ele muda; o estado do React
  // só chega no próximo render, tarde demais para um `pointermove` seguido.
  const agora = useRef<Gesto>(PARADO)
  const toque = useRef<Toque | null>(null)
  const noLugar = useRef<{ pointerId: number; x0: number; y0: number; pronto: boolean } | null>(
    null,
  )
  const relogio = useRef<number | null>(null)
  const fantasma = useRef<HTMLElement | null>(null)
  const deslocamento = useRef({ dx: 0, dy: 0 })
  const engoleOClique = useRef(false)
  /** A foto da estante tirada quando o livro saiu dela: é nela que o alvo se mede. */
  const geometria = useRef<Geometria | null>(null)
  /** Tira os ouvintes da janela do toque em curso. */
  const limparJanela = useRef<(() => void) | null>(null)

  const mudar = useCallback((proximo: Gesto) => {
    agora.current = proximo
    setGesto(proximo)
  }, [])

  const pararORelogio = useCallback(() => {
    if (relogio.current !== null) window.clearTimeout(relogio.current)
    relogio.current = null
  }, [])

  useEffect(() => pararORelogio, [pararORelogio])
  useEffect(() => () => limparJanela.current?.(), [])

  /**
   * O fantasma anda por `transform` direto no elemento, sem passar pelo React:
   * um `pointermove` por quadro re-renderizando a estante inteira engasga numa
   * WebView.
   */
  const registrarFantasma = useCallback((elemento: HTMLElement | null) => {
    fantasma.current = elemento
    if (!elemento) return
    const { dx, dy } = deslocamento.current
    elemento.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`
  }, [])

  /** Depois de soltar, o `click` que fecha o gesto ainda vem; se ele não vier (o elemento mudou de lugar), libera. */
  function liberarOClique(): void {
    window.setTimeout(() => {
      engoleOClique.current = false
    }, 80)
  }

  function moverToque(evento: Ponteiro): void {
    const t = toque.current
    if (!t || evento.pointerId !== t.pointerId) return

    const dx = evento.clientX - t.x0
    const dy = evento.clientY - t.y0
    const longe = Math.hypot(dx, dy) > TOLERANCIA
    const fase = agora.current.fase

    if (fase === 'parado') {
      if (longe && !t.desistiu) {
        t.desistiu = true
        pararORelogio()
        engoleOClique.current = true
      }
      return
    }

    deslocamento.current = { dx, dy }
    if (fantasma.current) {
      fantasma.current.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`
    }

    if (fase === 'erguido' && !longe) return

    geometria.current ??= capturarGeometria()
    const alvo = alvoNaEstante(evento.clientX, evento.clientY, t.livroId, geometria.current)
    if (fase !== 'arrastando' || !mesmoAlvo(alvo, agora.current.alvo)) {
      mudar({ ...agora.current, fase: 'arrastando', alvo })
    }
  }

  function soltarToque(evento: Ponteiro): void {
    const t = toque.current
    if (!t || evento.pointerId !== t.pointerId) return

    pararORelogio()
    const { fase, alvo } = agora.current
    toque.current = null
    limparJanela.current?.()
    mudar(PARADO)
    if (engoleOClique.current) liberarOClique()

    if (fase === 'erguido') onAcoes(t.livroId)
    else if (fase === 'arrastando' && alvo !== null) onMover(t.livroId, alvo)
  }

  function cancelarToque(): void {
    pararORelogio()
    toque.current = null
    engoleOClique.current = false
    limparJanela.current?.()
    mudar(PARADO)
  }

  /**
   * O toque em curso é ouvido pela **janela**, e não pelo livro: a prévia ao vivo move o livro na mão
   * no DOM (e até de uma prateleira para outra, onde o elemento é outro), e um elemento que muda de
   * lugar perde a captura do ponteiro — o `pointerup` nunca chegaria nele.
   */
  function ouvirJanela(): void {
    limparJanela.current?.()
    const aoMover = (e: PointerEvent): void => {
      moverToque(e)
    }
    const aoSoltar = (e: PointerEvent): void => {
      soltarToque(e)
    }
    const aoCancelar = (e: PointerEvent): void => {
      if (toque.current?.pointerId === e.pointerId) cancelarToque()
    }
    window.addEventListener('pointermove', aoMover)
    window.addEventListener('pointerup', aoSoltar)
    window.addEventListener('pointercancel', aoCancelar)
    limparJanela.current = () => {
      window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('pointerup', aoSoltar)
      window.removeEventListener('pointercancel', aoCancelar)
      limparJanela.current = null
    }
  }

  function manipular(livroId: string): ManipulacaoDaLombada {
    return {
      onPointerDown(evento) {
        // Botão direito é pedido de menu, e chega pelo `contextmenu`.
        if (evento.button !== 0) return

        evento.currentTarget.setPointerCapture(evento.pointerId)
        const caixa = evento.currentTarget.getBoundingClientRect()

        engoleOClique.current = false
        deslocamento.current = { dx: 0, dy: 0 }
        toque.current = {
          livroId,
          pointerId: evento.pointerId,
          x0: evento.clientX,
          y0: evento.clientY,
          caixa,
          desistiu: false,
        }
        ouvirJanela()

        pararORelogio()
        relogio.current = window.setTimeout(() => {
          relogio.current = null
          engoleOClique.current = true
          geometria.current = capturarGeometria()
          mudar({ fase: 'erguido', livroId, enfeite: null, alvo: null, origem: caixa })
        }, ESPERA)
      },

      onClick(evento) {
        if (engoleOClique.current) {
          engoleOClique.current = false
          evento.preventDefault()
          return
        }
        onEspiar(livroId)
      },

      onContextMenu(evento) {
        evento.preventDefault()
        // No toque, segurar já é o gesto do menu, e o Android manda um
        // `contextmenu` no meio do mesmo segurar — abri-lo ali jogaria o menu por
        // cima de um livro que ainda vai ser arrastado. Sem dedo encostado, é o
        // botão direito ou a tecla de menu pedindo, e aí o menu abre.
        if (toque.current) return
        onAcoes(livroId)
      },
    }
  }

  /**
   * Um lugar sem livro — enfeite ou vaga. Tocar cria um livro ali; segurar e soltar
   * parado abre o menu (na soltura e não no meio do segurar, para o dedo não soltar
   * em cima da folha que acabou de abrir).
   *
   * O enfeite (`arrastavel`) também sai do lugar, como o livro: segurar o ergue, e
   * arrastar o leva — a vaga é só um buraco, não há o que levar.
   */
  function manipularLugar(alvo: LugarDaEstante, arrastavel = false): ManipulacaoDaLombada {
    const soltar = (): void => {
      pararORelogio()
      noLugar.current = null
      setLugarSegurado(null)
    }

    return {
      onPointerDown(evento) {
        if (evento.button !== 0) return

        // Sem a captura, um dedo que escorrega para o lugar vizinho deixaria
        // este segurando para sempre — o `pointerup` cairia em outro elemento.
        const botao = evento.currentTarget
        botao.setPointerCapture(evento.pointerId)
        engoleOClique.current = false
        deslocamento.current = { dx: 0, dy: 0 }
        noLugar.current = {
          pointerId: evento.pointerId,
          x0: evento.clientX,
          y0: evento.clientY,
          pronto: false,
        }

        pararORelogio()
        relogio.current = window.setTimeout(() => {
          relogio.current = null
          if (!noLugar.current) return
          noLugar.current.pronto = true
          engoleOClique.current = true
          if (!arrastavel) {
            setLugarSegurado(alvo)
            return
          }
          // A coluna do lugar tem a altura da fileira; o fantasma parte só do enfeite.
          const caixa = (botao.querySelector('.lombada') ?? botao).getBoundingClientRect()
          geometria.current = capturarGeometria()
          mudar({ fase: 'erguido', livroId: null, enfeite: alvo, alvo: null, origem: caixa })
        }, ESPERA)
      },

      onPointerMove(evento) {
        const s = noLugar.current
        if (!s || evento.pointerId !== s.pointerId) return

        const dx = evento.clientX - s.x0
        const dy = evento.clientY - s.y0
        const longe = Math.hypot(dx, dy) > TOLERANCIA

        if (agora.current.enfeite === null) {
          if (!longe) return
          engoleOClique.current = true
          soltar()
          return
        }

        // O enfeite está na mão: anda como o livro.
        deslocamento.current = { dx, dy }
        if (fantasma.current) {
          fantasma.current.style.transform = `translate(${String(dx)}px, ${String(dy)}px)`
        }
        if (agora.current.fase === 'erguido' && !longe) return

        geometria.current ??= capturarGeometria()
        const destino = alvoNaEstante(evento.clientX, evento.clientY, null, geometria.current)
        if (agora.current.fase !== 'arrastando' || !mesmoLugar(destino, agora.current.alvo)) {
          mudar({ ...agora.current, fase: 'arrastando', alvo: destino })
        }
      },

      onPointerUp(evento) {
        const s = noLugar.current
        if (!s || evento.pointerId !== s.pointerId) return

        const { fase, alvo: destino, enfeite } = agora.current
        soltar()
        if (enfeite !== null) {
          mudar(PARADO)
          if (fase === 'erguido') onAcoesDoLugar(alvo)
          else if (fase === 'arrastando' && destino !== null && !mesmoLugar(destino, alvo)) {
            onMoverEnfeite(alvo, destino)
          }
          return
        }
        if (s.pronto) onAcoesDoLugar(alvo)
      },

      onPointerCancel() {
        engoleOClique.current = false
        soltar()
        if (agora.current.enfeite !== null) mudar(PARADO)
      },

      onClick(evento) {
        if (engoleOClique.current) {
          engoleOClique.current = false
          evento.preventDefault()
          return
        }
        onTocarLugar(alvo)
      },

      onContextMenu(evento) {
        evento.preventDefault()
        if (noLugar.current) return
        onAcoesDoLugar(alvo)
      },
    }
  }

  return { gesto, lugarSegurado, manipular, manipularLugar, registrarFantasma }
}
