import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as EventoDeMouse,
  type PointerEvent as EventoDePonteiro,
} from 'react'

/** O mesmo tempo que abre o dial e ergue um livro: segurar tem a mesma medida no app inteiro. */
const ESPERA = 380

/** Um dedo que andou mais que isto não estava segurando: estava rolando ou arrastando. */
const TOLERANCIA = 8

/**
 * Segurar um elemento por 380 ms (ou clicar com o botão direito) chama `aoSegurar`.
 * Para itens de uma lista que também se tocam: o toque continua sendo o `click` de
 * sempre, e o clique que chega no fim de um segurar é engolido — senão soltar o dedo
 * também abriria o item.
 *
 * Quem rola a lista cancela sozinho: andar mais de 8 px, ou o navegador tomar o
 * gesto para rolar (`pointercancel`), apaga o tempo.
 */
export function useSegurar(aoSegurar: () => void) {
  const relogio = useRef<number | null>(null)
  const origem = useRef<{ x: number; y: number } | null>(null)
  const segurou = useRef(false)

  const parar = useCallback(() => {
    if (relogio.current !== null) window.clearTimeout(relogio.current)
    relogio.current = null
  }, [])

  useEffect(() => parar, [parar])

  return {
    onPointerDown(evento: EventoDePonteiro<HTMLElement>) {
      segurou.current = false
      // Botão direito é pedido de menu, e chega pelo `contextmenu`.
      if (evento.button !== 0) return

      origem.current = { x: evento.clientX, y: evento.clientY }
      parar()
      relogio.current = window.setTimeout(() => {
        relogio.current = null
        segurou.current = true
        aoSegurar()
      }, ESPERA)
    },

    onPointerMove(evento: EventoDePonteiro<HTMLElement>) {
      const o = origem.current
      if (!o || relogio.current === null) return
      if (Math.hypot(evento.clientX - o.x, evento.clientY - o.y) > TOLERANCIA) parar()
    },

    onPointerUp: parar,
    onPointerCancel: parar,

    onClick(evento: EventoDeMouse<HTMLElement>) {
      if (!segurou.current) return
      segurou.current = false
      evento.preventDefault()
    },

    onContextMenu(evento: EventoDeMouse<HTMLElement>) {
      evento.preventDefault()
      // No toque, segurar já chamou (ou vai chamar) o menu, e o Android manda um
      // `contextmenu` no meio do mesmo gesto — abrir de novo o duplicaria. Sem dedo
      // encostado, é o botão direito ou a tecla de menu pedindo.
      if (relogio.current !== null || segurou.current) return
      aoSegurar()
    },
  }
}
