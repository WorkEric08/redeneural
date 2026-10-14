import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * O campo de nome do livro, que mostra o que a lombada vai mostrar (13/10/2026): as letras que
 * cabem na zona do título aparecem como foram escritas, e as que ficariam de fora — as que a
 * lombada corta com reticências — aparecem apagadas, no próprio campo. `visiveis` vem de
 * `letrasVisiveis` (a mesma conta da lombada).
 *
 * O texto do `<input>` fica transparente e uma camada por cima, que copia a fonte, o recuo e a
 * rolagem dele, desenha as duas partes — o cursor, a seleção e o teclado continuam sendo os do input.
 */
export function CampoDoNome({
  valor,
  aoMudar,
  visiveis,
  placeholder,
  className,
}: {
  valor: string
  aoMudar: (novo: string) => void
  /** Quantas letras, do começo do que está escrito, cabem na lombada. */
  visiveis: number
  placeholder: string
  className?: string
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const camada = useRef<HTMLSpanElement>(null)
  const texto = useRef<HTMLSpanElement>(null)

  const sincronizar = useCallback(() => {
    const input = entrada.current
    const cam = camada.current
    const tex = texto.current
    if (!input || !cam || !tex) return
    const css = getComputedStyle(input)
    cam.style.fontFamily = css.fontFamily
    cam.style.fontSize = css.fontSize
    cam.style.fontWeight = css.fontWeight
    cam.style.fontStyle = css.fontStyle
    cam.style.lineHeight = css.lineHeight
    cam.style.letterSpacing = css.letterSpacing
    cam.style.paddingLeft = `calc(${css.paddingLeft} + ${css.borderLeftWidth})`
    cam.style.paddingRight = `calc(${css.paddingRight} + ${css.borderRightWidth})`
    tex.style.transform = `translateX(${String(-input.scrollLeft)}px)`
  }, [])

  useLayoutEffect(sincronizar)

  const letras = [...valor]
  const aparece = letras.slice(0, visiveis).join('')
  const cortado = letras.slice(visiveis).join('')

  return (
    <span className="campo-do-nome">
      <input
        ref={entrada}
        aria-label="Nome"
        value={valor}
        onChange={(evento) => {
          aoMudar(evento.target.value)
        }}
        onScroll={sincronizar}
        maxLength={120}
        autoComplete="off"
        enterKeyHint="done"
        placeholder={placeholder}
        className={className ? `${className} campo-do-nome-entrada` : 'campo-do-nome-entrada'}
      />
      <span ref={camada} className="campo-do-nome-camada" aria-hidden>
        <span ref={texto} className="campo-do-nome-texto">
          {aparece}
          {cortado && <span className="campo-do-nome-cortado">{cortado}</span>}
        </span>
      </span>
    </span>
  )
}
