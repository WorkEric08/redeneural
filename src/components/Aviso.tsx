import { useEffect, useRef } from 'react'

import { usePalacio } from '@/store/palacio'

/** Erro fica mais tempo: é o que a pessoa precisa ler, não só perceber. */
const DURACAO_AVISO_MS = 3500
const DURACAO_ERRO_MS = 6000

/**
 * O aviso flutuante: erros e confirmações sobem no pé da tela e somem sozinhos.
 *
 * É um popover, para morar na camada do topo — um painel (`<dialog>` modal)
 * também mora lá, e um aviso comum ficaria atrás do fundo desfocado dele.
 * Reabrir a cada mensagem nova põe o aviso no topo dessa camada, acima de um
 * painel que tenha aberto depois dele.
 *
 * Tocar dispensa. Com um painel aberto o toque não chega (o resto da tela fica
 * inerte), mas o tempo continua correndo.
 */
export function Aviso() {
  const erro = usePalacio((s) => s.erro)
  const aviso = usePalacio((s) => s.aviso)
  const dispensar = usePalacio((s) => s.dispensarAvisos)
  const caixa = useRef<HTMLDivElement>(null)

  const mensagem = erro ?? aviso

  useEffect(() => {
    const el = caixa.current
    if (!el) return

    if (el.matches(':popover-open')) el.hidePopover()
    if (mensagem === null) return

    el.showPopover()
    const relogio = window.setTimeout(dispensar, erro === null ? DURACAO_AVISO_MS : DURACAO_ERRO_MS)
    return () => {
      window.clearTimeout(relogio)
    }
  }, [mensagem, erro, dispensar])

  return (
    <div
      ref={caixa}
      popover="manual"
      role={erro === null ? 'status' : 'alert'}
      data-tipo={erro === null ? 'aviso' : 'erro'}
      className="aviso"
      onClick={dispensar}
    >
      {mensagem}
    </div>
  )
}
