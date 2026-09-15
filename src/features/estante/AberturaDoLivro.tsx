import { useEffectEvent, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import type { Livro } from '@/core'

import type { Abertura } from './abertura'

/** Em ms. Somados, menos de um segundo: abrir livro é gesto de todo dia, não cerimônia. */
const VOO = 460
const ABRIR = 420
const ENTRAR = 240

const AO_CHEGAR = 'cubic-bezier(0.3, 0.7, 0.2, 1)'
const AO_ABRIR = 'cubic-bezier(0.45, 0, 0.2, 1)'

interface Props {
  livro: Livro
  geometria: Abertura
  /** A animação acabou: quem chama troca de tela. */
  onAberto: () => void
}

/**
 * O livro saindo da estante e se abrindo.
 *
 * Parte de lombada para quem olha, exatamente em cima da lombada da prateleira;
 * voa até o meio da tela girando até mostrar a capa; a capa abre para a
 * esquerda; e a sala cobre tudo no instante em que a tela do livro entra — a
 * troca de rota acontece por baixo, sem corte.
 *
 * Só `transform` e `opacity`, que a WebView anima fora da thread principal. Em
 * portal no `body` pelo mesmo motivo do fantasma do arrasto: a fileira recorta
 * o que passa dela, e a tela vive dentro de um `transform`.
 */
export function AberturaDoLivro({ livro, geometria: g, onAberto }: Props) {
  const fundo = useRef<HTMLDivElement>(null)
  const cena = useRef<HTMLDivElement>(null)
  const corpo = useRef<HTMLDivElement>(null)
  const capa = useRef<HTMLDivElement>(null)
  const terminar = useEffectEvent(onAberto)

  // Antes da pintura: o primeiro quadro já tem que ser o livro na prateleira,
  // não um livro no meio da tela que pula para lá.
  useLayoutEffect(() => {
    const f = fundo.current
    const s = cena.current
    const c = corpo.current
    const k = capa.current
    if (!f || !s || !c || !k) return

    const { x, y, escala, escalaX } = g.partida
    const deLombada = `translate3d(${String(x)}px, ${String(y)}px, 0px) scale3d(${String(escalaX)}, ${String(escala)}, ${String(escala)}) rotateY(90deg)`
    const deCapa = 'translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateY(0deg)'
    const aberto = `translate3d(${String(g.deslocamentoAberto)}px, 0px, 0px) scale3d(1.04, 1.04, 1.04) rotateY(0deg)`
    const meiaGrossura = `${String(g.grossura / 2)}px`
    const final = VOO + ABRIR - 80

    const animacoes = [
      f.animate([{ opacity: 0 }, { opacity: 0.86 }], {
        duration: VOO,
        easing: 'ease-out',
        fill: 'forwards',
      }),
      c.animate([{ transform: deLombada }, { transform: deCapa }], {
        duration: VOO,
        easing: AO_CHEGAR,
        fill: 'forwards',
      }),
      // `forwards`, e não `both`: durante a espera esta não pode valer, senão
      // pisaria no voo, que também escreve `transform`.
      c.animate([{ transform: deCapa }, { transform: aberto }], {
        duration: ABRIR,
        delay: VOO,
        easing: AO_ABRIR,
        fill: 'forwards',
      }),
      k.animate(
        [
          { transform: `translateZ(${meiaGrossura}) rotateY(0deg)` },
          { transform: `translateZ(${meiaGrossura}) rotateY(-168deg)` },
        ],
        { duration: ABRIR, delay: VOO, easing: AO_ABRIR, fill: 'forwards' },
      ),
      f.animate([{ opacity: 0.86 }, { opacity: 1 }], {
        duration: ENTRAR,
        delay: final,
        fill: 'forwards',
      }),
      // Na cena, e não no livro: opacidade no livro achataria o 3D (ver .abertura-cena).
      s.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: ENTRAR,
        delay: final,
        fill: 'forwards',
      }),
    ]

    let vivo = true
    void Promise.all(animacoes.map((a) => a.finished)).then(
      () => {
        if (vivo) terminar()
      },
      // Cancelada — voltar no meio, ou a estante saiu da tela. Não abre nada.
      () => undefined,
    )

    return () => {
      vivo = false
      for (const a of animacoes) a.cancel()
    }
  }, [g])

  const estilo = {
    '--pano': livro.cor,
    '--grossura': `${String(g.grossura)}px`,
    '--meia-largura': `${String(g.largura / 2)}px`,
    '--aumento-da-lombada': g.aumentoDaLombada,
    width: g.largura,
    height: g.altura,
    marginLeft: -g.largura / 2,
    marginTop: -g.altura / 2,
  } as CSSProperties

  return createPortal(
    <div className="abertura" aria-hidden>
      <div ref={fundo} className="abertura-fundo" />
      <div ref={cena} className="abertura-cena">
        <div ref={corpo} className="abertura-livro cores-de-antes" style={estilo}>
          <div className="abertura-miolo" />
          <div className="abertura-lombada lombada">
            <span className="lombada-titulo">{livro.titulo}</span>
          </div>
          <div ref={capa} className="abertura-capa">
            <div className="abertura-capa-frente">
              <span className="abertura-titulo">{livro.titulo}</span>
            </div>
            <div className="abertura-capa-verso" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
