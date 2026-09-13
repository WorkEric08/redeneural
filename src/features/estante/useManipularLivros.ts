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
 * | Gesto                         | O que faz                                        |
 * | ----------------------------- | ------------------------------------------------- |
 * | Tocar                         | Espia (o painel puxa o livro para fora)          |
 * | Segurar                       | Ergue o livro e acende as pontes dele            |
 * | Segurar e soltar parado       | Abre o menu do livro                             |
 * | Segurar, arrastar e soltar    | Move para onde soltou — empurra quem já está lá  |
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
  /** O livro embaixo do dedo — é antes dele que o que está na mão vai entrar. */
  alvoId: string | null
  /**
   * Em qual prateleira o dedo está, quando não há um livro embaixo dele — soltar
   * aí manda o livro para o fim daquela prateleira, sem mexer em mais nada.
   * `null` fora de qualquer prateleira: soltar ali não move nada.
   */
  alvoPrateleira: number | null
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
  /**
   * Modo organizar ligado: segurar e arrastar move o livro. Desligado, segurar
   * ainda ergue e acende as pontes — só não vira arrasto — e soltar sempre
   * abre o menu, do mesmo jeito que soltar parado já abria. É o que evita
   * mover um livro sem querer só de segurar de passagem para espiar as pontes.
   */
  organizando: boolean
  onEspiar: (livroId: string) => void
  onAcoes: (livroId: string) => void
  /**
   * Soltou arrastando: `alvoId` é o livro embaixo do dedo (entra antes dele),
   * ou `null` quando soltou em área vazia de `alvoPrateleira` (vai para o fim).
   */
  onMover: (livroId: string, alvoPrateleira: number, alvoId: string | null) => void
}

const PARADO: Gesto = {
  fase: 'parado',
  livroId: null,
  alvoId: null,
  alvoPrateleira: null,
  origem: null,
}

interface Alvo {
  prateleira: number | null
  livroId: string | null
}

function alvoNaEstante(x: number, y: number, exceto: string): Alvo {
  for (const dx of [0, -FOLGA_DO_ALVO, FOLGA_DO_ALVO]) {
    for (const elemento of document.elementsFromPoint(x + dx, y)) {
      const livro = elemento.closest<HTMLElement>('[data-livro-id]')
      const id = livro?.dataset['livroId']
      if (!id || id === exceto) continue

      const vao = livro.closest<HTMLElement>('[data-prateleira]')
      const prateleira = vao?.dataset['prateleira']
      return { prateleira: prateleira === undefined ? null : Number(prateleira), livroId: id }
    }
  }

  // Nenhum livro sob o dedo: ainda pode estar sobre a área vazia de uma
  // prateleira (ou uma prateleira sem livro nenhum).
  for (const elemento of document.elementsFromPoint(x, y)) {
    const vao = elemento.closest<HTMLElement>('[data-prateleira]')
    if (vao) return { prateleira: Number(vao.dataset['prateleira']), livroId: null }
  }

  return { prateleira: null, livroId: null }
}

export function useManipularLivros({ organizando, onEspiar, onAcoes, onMover }: Opcoes) {
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
          mudar({ fase: 'erguido', livroId, alvoId: null, alvoPrateleira: null, origem: caixa })
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
        // Sem o modo organizar, segurar nunca vira arrastar: o livro fica
        // erguido (pontes acesas) até soltar, e soltar sempre abre o menu.
        if (fase === 'erguido' && !organizando) return

        const alvo = alvoNaEstante(evento.clientX, evento.clientY, t.livroId)
        if (
          fase !== 'arrastando' ||
          alvo.livroId !== agora.current.alvoId ||
          alvo.prateleira !== agora.current.alvoPrateleira
        ) {
          mudar({
            ...agora.current,
            fase: 'arrastando',
            alvoId: alvo.livroId,
            alvoPrateleira: alvo.prateleira,
          })
        }
      },

      onPointerUp(evento) {
        const t = toque.current
        if (!t || evento.pointerId !== t.pointerId) return

        pararORelogio()
        const { fase, alvoId, alvoPrateleira } = agora.current
        toque.current = null
        mudar(PARADO)

        if (fase === 'erguido') onAcoes(t.livroId)
        else if (fase === 'arrastando' && alvoPrateleira !== null) {
          onMover(t.livroId, alvoPrateleira, alvoId)
        }
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
