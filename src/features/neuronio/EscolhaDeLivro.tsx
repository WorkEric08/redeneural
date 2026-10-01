import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Id, Livro } from '@/core'

interface Props {
  livros: readonly Livro[]
  /** O livro marcado agora — `null` quando nenhum livro está escolhido. */
  escolhido: Id | null
  onEscolher: (livroId: Id) => void
  /** Linhas a mais antes dos livros (o "Automático" do formulário). */
  antes?: ReactNode
  /** Linhas a mais depois dos livros (o "Criar livro novo" do porto). */
  depois?: ReactNode
}

/**
 * A lista de livros de uma folha de escolha: ponto da cor, nome e o `Check` no
 * escolhido. É a mesma no formulário de neurônio e na pergunta do porto — a
 * pergunta "em que livro?" tem um desenho só no app.
 */
export function EscolhaDeLivro({ livros, escolhido, onEscolher, antes, depois }: Props) {
  return (
    <ul className="cartao flex flex-col">
      {antes}
      {livros.map((l) => (
        <li key={l.id} className="linha-de-lista p-0">
          <button
            type="button"
            onClick={() => {
              onEscolher(l.id)
            }}
            className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: l.cor }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{l.titulo}</span>
            {l.id === escolhido && <Check size={18} aria-hidden className="text-papel shrink-0" />}
          </button>
        </li>
      ))}
      {depois}
    </ul>
  )
}
