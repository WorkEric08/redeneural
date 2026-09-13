import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as EventoDeMouse,
  type PointerEvent as EventoDePonteiro,
} from 'react'

/**
 * O livro como objeto na mão.
 *
 * | Gesto                         | O que faz                                   |
 * | ----------------------------- | ------------------------------------------- |
 * | Tocar                         | Espia (o painel puxa o livro para fora)     |
 * | Segurar                       | Ergue o livro e acende as pontes dele       |
 * | Segurar e soltar parado       | Abre o menu do livro                        |
 * | Segurar, arrastar e soltar    | Troca de lugar com o livro embaixo do dedo  |
 *
 * Tocar é o `click` nativo, e não o `pointerup`: é o que Enter e Espaço também
 * disparam, então o teclado ganha o mesmo "espiar" sem código a mais. Quando o
 * dedo segurou ou arrastou, o clique que o navegador manda no fim é engolido —
 * senão soltar um livro também o espiaria.
 */

/** O mesmo tempo que abre o dial: segurar tem que ter a mesma medida no app inteiro. */
const ESPERA = 380

/** Um dedo que andou mais que isto antes de erguer o livro não estava tocando. */
const TOLERANCIA = 8

/**
 * Lombada é estreita, e o dedo cobre o que está apontando. Sem esta folga, soltar
 * na fresta entre dois livros não acertaria nenhum.
 */
const FOLGA_DO_ALVO = 14

export type FaseDoGesto = 'parado' | 'erguido' | 'arrastando'

export interface Gesto {
  fase: FaseDoGesto
  livroId: string | null
  alvoId: string | null
  /** Onde o livro estava na tela quando saiu da prateleira: é de lá que o fantasma parte. */
  origem: DOMRect | null
}

export interface ManipulacaoDaLombada {
  onPointerDown: (evento: EventoDePonteiro<HTMLElement>) => void
  onPointerMove: (evento: EventoDePonteiro<HTMLElement>) => void
  onPointerUp: (evento: EventoDePonteiro<HTMLElement>) => void
  onPointerCancel: () => void
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
  onTrocar: (a: string, b: string) => void
}

const PARADO: Gesto = { fase: 'parado', livroId: null, alvoId: null, origem: null }

function livroEmbaixo(x: number, y: number, exceto: string): string | null {
  for (const dx of [0, -FOLGA_DO_ALVO, FOLGA_DO_ALVO]) {
    for (const elemento of document.elementsFromPoint(x + dx, y)) {
      const id = elemento.closest<HTMLElement>('[data-livro-id]')?.dataset['livroId']
      if (id && id !== exceto) return id
    }
  }
  return null
}

export function useManipularLivros({ onEspiar, onAcoes, onTrocar }: Opcoes) {
  const [gesto, setGesto] = useState<Gesto>(PARADO)

  // Os eventos leem o gesto no mesmo instante em que ele muda; o estado do React
  // só chega no próximo render, tarde demais para um `pointermove` seguido.
  const agora = useRef<Gesto>(PARADO)
  const toque = useRef<Toque | null>(null)
  const relogio = useRef<number | null>(null)
  const fantasma = useRef<HTMLElement | null>(null)
  const deslocamento = useRef({ dx: 0, dy: 0 })
  const engoleOClique = useRef(false)

  const mudar = useCallback((proximo: Gesto) => {
    agora.current = proximo
    setGesto(proximo)
  }, [])

  const pararORelogio = useCallback(() => {
    if (relogio.current !== null) window.clearTimeout(relogio.current)
    relogio.current = null
  }, [])

  useEffect(() => pararORelogio, [pararORelogio])

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

        pararORelogio()
        relogio.current = window.setTimeout(() => {
          relogio.current = null
          engoleOClique.current = true
          mudar({ fase: 'erguido', livroId, alvoId: null, origem: caixa })
        }, ESPERA)
      },

      onPointerMove(evento) {
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

        const alvoId = livroEmbaixo(evento.clientX, evento.clientY, t.livroId)
        if (fase !== 'arrastando' || alvoId !== agora.current.alvoId) {
          mudar({ ...agora.current, fase: 'arrastando', alvoId })
        }
      },

      onPointerUp(evento) {
        const t = toque.current
        if (!t || evento.pointerId !== t.pointerId) return

        pararORelogio()
        const { fase, alvoId } = agora.current
        toque.current = null
        mudar(PARADO)

        if (fase === 'erguido') onAcoes(t.livroId)
        else if (fase === 'arrastando' && alvoId) onTrocar(t.livroId, alvoId)
      },

      onPointerCancel() {
        pararORelogio()
        toque.current = null
        engoleOClique.current = false
        mudar(PARADO)
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

  return { gesto, manipular, registrarFantasma }
}
