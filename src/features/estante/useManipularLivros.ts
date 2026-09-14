import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as EventoDeMouse,
  type PointerEvent as EventoDePonteiro,
} from 'react'

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
}

export interface Gesto {
  fase: FaseDoGesto
  livroId: string | null
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
  /** Soltou arrastando sobre um lugar. */
  onMover: (livroId: string, alvo: LugarDaEstante) => void
  onTocarLugar: (alvo: LugarDaEstante) => void
  onAcoesDoLugar: (alvo: LugarDaEstante) => void
}

const PARADO: Gesto = { fase: 'parado', livroId: null, alvo: null, origem: null }

/**
 * O lugar na coluna do dedo, dentro da prateleira em que ele está.
 *
 * Pela coluna, e não pelo elemento embaixo do dedo: as lombadas têm alturas
 * diferentes, e soltar acima de um livro baixo tem que valer o lugar dele, não
 * cair no vão da prateleira. Qualquer lugar serve, inclusive o do livro na mão
 * — o vão que ele deixa (`data-estado='vazio'`) continua ali, e soltar nele é
 * desistir.
 */
function alvoNaEstante(x: number, y: number): LugarDaEstante | null {
  const vao = document
    .elementsFromPoint(x, y)
    .map((elemento) => elemento.closest<HTMLElement>('[data-prateleira]'))
    .find((achado) => achado !== null)
  if (!vao) return null

  let perto: HTMLElement | null = null
  let distancia = Infinity
  for (const lugar of vao.querySelectorAll<HTMLElement>('[data-lugar]')) {
    const caixa = lugar.getBoundingClientRect()
    const d = Math.max(caixa.left - x, x - caixa.right, 0)
    if (d < distancia) {
      perto = lugar
      distancia = d
    }
    if (d === 0) break
  }

  if (!perto || distancia > FOLGA_DO_ALVO) return null
  return { prateleira: Number(vao.dataset['prateleira']), lugar: Number(perto.dataset['lugar']) }
}

function mesmoLugar(a: LugarDaEstante | null, b: LugarDaEstante | null): boolean {
  return a?.prateleira === b?.prateleira && a?.lugar === b?.lugar
}

export function useManipularLivros({
  onEspiar,
  onAcoes,
  onMover,
  onTocarLugar,
  onAcoesDoLugar,
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
          mudar({ fase: 'erguido', livroId, alvo: null, origem: caixa })
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

        const alvo = alvoNaEstante(evento.clientX, evento.clientY)
        if (fase !== 'arrastando' || !mesmoLugar(alvo, agora.current.alvo)) {
          mudar({ ...agora.current, fase: 'arrastando', alvo })
        }
      },

      onPointerUp(evento) {
        const t = toque.current
        if (!t || evento.pointerId !== t.pointerId) return

        pararORelogio()
        const { fase, alvo } = agora.current
        toque.current = null
        mudar(PARADO)

        if (fase === 'erguido') onAcoes(t.livroId)
        else if (fase === 'arrastando' && alvo !== null) onMover(t.livroId, alvo)
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

  /**
   * Um lugar sem livro — enfeite ou vaga. Não sai do lugar, então o gesto é só
   * tocar ou segurar: o mesmo "segurar e soltar parado" do livro abre o menu,
   * na soltura e não no meio do segurar, para o dedo não soltar em cima da
   * folha que acabou de abrir.
   */
  function manipularLugar(alvo: LugarDaEstante): ManipulacaoDaLombada {
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
        evento.currentTarget.setPointerCapture(evento.pointerId)
        engoleOClique.current = false
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
          setLugarSegurado(alvo)
        }, ESPERA)
      },

      onPointerMove(evento) {
        const s = noLugar.current
        if (!s || evento.pointerId !== s.pointerId) return
        if (Math.hypot(evento.clientX - s.x0, evento.clientY - s.y0) <= TOLERANCIA) return

        engoleOClique.current = true
        soltar()
      },

      onPointerUp(evento) {
        const s = noLugar.current
        if (!s || evento.pointerId !== s.pointerId) return

        soltar()
        if (s.pronto) onAcoesDoLugar(alvo)
      },

      onPointerCancel() {
        engoleOClique.current = false
        soltar()
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
