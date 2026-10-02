import { Check, Hammer } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Id, Livro } from '@/core'

interface Props {
  livros: readonly Livro[]
  /** O livro marcado agora — `null` quando nenhum livro está escolhido. */
  escolhido: Id | null
  onEscolher: (livroId: Id) => void
  /** Opção a mais antes dos livros (o "Automático" do formulário), na largura toda. */
  antes?: ReactNode
  /** Opção a mais depois dos livros (o "Criar livro novo" do porto), na largura toda. */
  depois?: ReactNode
}

/**
 * Os livros de uma folha de escolha: ponto da cor, nome e o `Check` no
 * escolhido. É a mesma no formulário de neurônio e na pergunta do porto — a
 * pergunta "em que livro?" tem um desenho só no app.
 *
 * Em duas colunas de opções compactas (e não uma lista de linhas altas): com
 * uma estante de oito livros, a lista passava da metade da tela e a folha tinha
 * que rolar; assim cabem quatro fileiras. As opções a mais (`antes`/`depois`)
 * ocupam a largura toda — são `<li>` que pedem `col-span-2`.
 */
export function EscolhaDeLivro({ livros, escolhido, onEscolher, antes, depois }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {antes}
      {livros.map((l) => (
        <li key={l.id} className="min-w-0">
          <button
            type="button"
            aria-pressed={l.id === escolhido}
            onClick={() => {
              onEscolher(l.id)
            }}
            className="opcao"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: l.cor }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{l.titulo}</span>
            {l.executavel && (
              <Hammer size={14} aria-label="executável" className="text-poeira shrink-0" />
            )}
            {l.id === escolhido && <Check size={16} aria-hidden className="text-papel shrink-0" />}
          </button>
        </li>
      ))}
      {depois}
    </ul>
  )
}
