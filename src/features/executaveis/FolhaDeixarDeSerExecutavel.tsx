import { Sparkles } from 'lucide-react'

import { Folha } from '@/components/Folha'
import type { Id, Livro } from '@/core'
import { EscolhaDeLivro } from '@/features/neuronio/EscolhaDeLivro'

interface Props {
  aberta: boolean
  /** Só os livros de conceitos que não são executáveis — para onde a ideia pode voltar. */
  livros: readonly Livro[]
  /** `null` é "Automático": o motor escolhe pelo texto. */
  onEscolher: (livroId: Id | null) => void
  onFechar: () => void
}

/**
 * "Para qual livro ela volta?" — o desfazer do "Tornar executável" (07/10/2026). A ideia sai
 * do livro executável para um livro comum, à escolha, ou para onde o palácio achar pelo
 * texto. O andamento fica guardado na ideia, sem aparecer; entrar de novo num livro
 * executável recomeça em "para fazer", como qualquer entrada.
 */
export function FolhaDeixarDeSerExecutavel({ aberta, livros, onEscolher, onFechar }: Props) {
  return (
    <Folha aberta={aberta} rotulo="Deixar de ser executável" onFechar={onFechar}>
      <p className="text-poeira px-1 pb-3 text-sm">Em qual livro ela fica?</p>
      <EscolhaDeLivro
        livros={livros}
        escolhido={null}
        onEscolher={onEscolher}
        antes={
          <li className="col-span-2">
            <button
              type="button"
              onClick={() => {
                onEscolher(null)
              }}
              className="opcao py-1.5"
            >
              <Sparkles size={16} aria-hidden className="text-poeira shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">Automático</span>
                <span className="text-poeira block truncate text-xs">
                  O palácio escolhe pelo sentido
                </span>
              </span>
            </button>
          </li>
        }
      />
    </Folha>
  )
}
