import { useEffect, useRef } from 'react'
import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useTemaPadrao } from '@/hooks/useTemaPadrao'

import { usePalacio } from '@/store/palacio'

/** Erro fica mais tempo: é o que a pessoa precisa ler, não só perceber. */
const DURACAO_AVISO_MS = 3500
const DURACAO_ERRO_MS = 6000
const CLASSE_DO_BOTAO =
  '-my-3 -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 font-semibold underline-offset-4 hover:underline'
/** Com um botão, o mesmo tempo do erro: dá tempo de ler e de tocar. */
const DURACAO_COM_ACAO_MS = 6000

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
 *
 * Pode ter um botão (01/10/2026): o "Mudar" depois de o Porto escolher o livro
 * de um pensamento. O botão é um link para uma busca na tela atual, e não uma
 * função — o aviso sobrevive à tela que o pediu.
 */
export function Aviso() {
  const erro = usePalacio((s) => s.erro)
  const aviso = usePalacio((s) => s.aviso)
  const acao = usePalacio((s) => s.acaoDoAviso)
  const duracaoPedida = usePalacio((s) => s.duracaoDoAviso)
  const dispensar = usePalacio((s) => s.dispensarAvisos)
  const caixa = useRef<HTMLDivElement>(null)
  const padrao = useTemaPadrao()

  const mensagem = erro ?? aviso
  // Um erro por cima tira o botão do aviso: ele falaria de outra coisa.
  const botao = erro === null ? acao : null

  useEffect(() => {
    const el = caixa.current
    if (!el) return

    if (el.matches(':popover-open')) el.hidePopover()
    if (mensagem === null) return

    el.showPopover()
    // Um erro manda no tempo; fora dele, a duração que quem avisou pediu vale mais que a de sempre.
    const duracao =
      erro !== null
        ? DURACAO_ERRO_MS
        : (duracaoPedida ?? (botao !== null ? DURACAO_COM_ACAO_MS : DURACAO_AVISO_MS))
    const relogio = window.setTimeout(dispensar, duracao)
    return () => {
      window.clearTimeout(relogio)
    }
  }, [mensagem, erro, botao, duracaoPedida, dispensar])

  return (
    <div
      ref={caixa}
      popover="manual"
      role={erro === null ? 'status' : 'alert'}
      data-tipo={erro === null ? 'aviso' : 'erro'}
      className="aviso"
      onClick={dispensar}
    >
      {botao === null ? (
        padrao ? (
          <span className="pd-aviso">
            {erro !== null && <CircleAlert size={20} aria-hidden className="pd-aviso-icone" />}
            {mensagem}
          </span>
        ) : (
          mensagem
        )
      ) : (
        <span className="flex items-center gap-3">
          <span className="min-w-0 flex-1">{mensagem}</span>
          {'aoTocar' in botao ? (
            <button
              type="button"
              onClick={(evento) => {
                // O toque no aviso o dispensa; aqui a ação ainda pode trazer um aviso novo ("Movimento
                // desfeito"), que o clique subindo apagaria.
                evento.stopPropagation()
                botao.aoTocar()
              }}
              className={CLASSE_DO_BOTAO}
            >
              {botao.rotulo}
            </button>
          ) : (
            <Link to={{ search: botao.busca }} className={CLASSE_DO_BOTAO}>
              {botao.rotulo}
            </Link>
          )}
        </span>
      )}
    </div>
  )
}
