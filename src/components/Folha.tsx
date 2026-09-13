import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  aberta: boolean
  /** Nome acessível do painel — "Espiar Música", "Um livro novo". */
  rotulo: string
  onFechar: () => void
  children: ReactNode
}

/**
 * Painel que sobe de baixo no celular e vira diálogo a partir do tablet
 * (CLAUDE.md §6).
 *
 * `<dialog>` nativo com `showModal`, e não uma div com z-index: ele vai para a
 * camada do topo, fora de qualquer `transform` ou `overflow` dos ancestrais,
 * prende o foco lá dentro, fecha no Esc e deixa o resto da tela inerte — tudo
 * sem dependência. Quem decide se está aberto é quem chama, pela URL; esta
 * folha só obedece.
 */
export function Folha({ aberta, rotulo, onFechar, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return

    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  return (
    <dialog
      ref={dialogo}
      className="folha"
      aria-label={rotulo}
      onCancel={(evento) => {
        // O Esc fecha pela URL, como o botão voltar — senão o diálogo some e a
        // busca continua dizendo que ele está aberto.
        evento.preventDefault()
        onFechar()
      }}
      onClick={(evento) => {
        // Clique no próprio <dialog>, fora do corpo, é clique no fundo escuro.
        if (evento.target === evento.currentTarget) onFechar()
      }}
    >
      <div className="folha-corpo">{children}</div>
    </dialog>
  )
}
