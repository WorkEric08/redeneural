import { useLayoutEffect, useRef, type RefObject } from 'react'

const DURACAO_MS = 180
const NOME = 'estante-movimento'

interface Posicao {
  x: number
  y: number
}

/** Quem é quem entre uma pintura e a seguinte: o livro pelo id, o lugar sem livro pela prateleira e o índice. */
function chaveDe(elemento: HTMLElement): string | null {
  const livro = elemento.dataset['livroId']
  if (livro) return `l:${livro}`
  const vao = elemento.closest<HTMLElement>('[data-prateleira]')
  const lugar = elemento.dataset['lugar']
  if (vao && lugar !== undefined) return `e:${vao.dataset['prateleira'] ?? ''}:${lugar}`
  return null
}

/**
 * Faz o que se afasta deslizar, em vez de pular (a técnica FLIP): quando a prévia da estante muda o
 * que está em cada lugar, cada livro e cada enfeite parte de onde estava na tela e anda até onde
 * ficou.
 *
 * Só anima enquanto há um livro na mão (e na pintura logo depois de soltá-lo): o resto das mudanças
 * da estante — carregar, girar a tela, criar um livro — não é movimento de quem o dedo está
 * levando. Mas as posições são medidas **em toda pintura**, para a próxima animação nunca partir de
 * uma posição velha.
 *
 * Anima só `translate` (o compositor cuida, sem refazer layout), em soma ao que o elemento já
 * tiver — o livro deitado se centra com um `translate` próprio.
 */
export function useAnimarMovimento(
  raiz: RefObject<HTMLElement | null>,
  /** O que muda quando a estante muda: as prateleiras já montadas. */
  pintura: unknown,
  /** Há um livro na mão. */
  arrastando: boolean,
): void {
  const posicoes = useRef(new Map<string, Posicao>())
  const eraArrasto = useRef(false)

  useLayoutEffect(() => {
    const el = raiz.current
    if (!el) return

    const animar = arrastando || eraArrasto.current
    eraArrasto.current = arrastando
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const novas = new Map<string, Posicao>()
    const itens = el.querySelectorAll<HTMLElement>(
      '.movel-fila [data-livro-id], .movel-fila .lugar',
    )
    for (const item of itens) {
      const chave = chaveDe(item)
      if (chave === null) continue

      // Uma animação em curso deixa o elemento fora do lugar dele: lê onde ele está **de verdade**,
      // e quanto falta para a animação terminar, para a seguinte continuar dali.
      const visual = item.getBoundingClientRect()
      for (const a of item.getAnimations()) if (a.id === NOME) a.cancel()
      const real = item.getBoundingClientRect()
      novas.set(chave, { x: real.left, y: real.top })

      const antes = posicoes.current.get(chave)
      if (!animar || reduzido || !antes) continue
      const dx = antes.x + (visual.left - real.left) - real.left
      const dy = antes.y + (visual.top - real.top) - real.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue

      item.animate([{ translate: `${String(dx)}px ${String(dy)}px` }, { translate: '0px 0px' }], {
        id: NOME,
        duration: DURACAO_MS,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        composite: 'add',
      })
    }
    posicoes.current = novas
  }, [raiz, pintura, arrastando])
}
