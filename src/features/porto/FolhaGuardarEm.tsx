import { Plus } from 'lucide-react'

import { Folha } from '@/components/Folha'
import type { Id, Livro, NeuronioNaTela } from '@/core'
import { EscolhaDeLivro } from '@/features/neuronio/EscolhaDeLivro'

interface Props {
  aberta: boolean
  neuronio: NeuronioNaTela | undefined
  /** Só livros de conceitos: um neurônio não mora numa pasta. */
  livros: readonly Livro[]
  onEscolher: (livroId: Id) => void
  onCriarLivro: () => void
  onFechar: () => void
}

/**
 * "Onde guardar?" — a pergunta do porto, e o "Mudar" depois de o Porto
 * escolher sozinho. Fechar sem escolher deixa o neurônio onde ele está: no
 * porto, ou no livro que já tinha.
 */
export function FolhaGuardarEm({
  aberta,
  neuronio,
  livros,
  onEscolher,
  onCriarLivro,
  onFechar,
}: Props) {
  return (
    <Folha aberta={aberta} rotulo="Onde guardar?" onFechar={onFechar}>
      {neuronio && <p className="text-poeira truncate px-1 pb-3 text-sm">“{neuronio.titulo}”</p>}
      <EscolhaDeLivro
        livros={livros}
        escolhido={neuronio?.livroId ?? null}
        onEscolher={onEscolher}
        depois={
          <li className="linha-de-lista p-0">
            <button
              type="button"
              onClick={onCriarLivro}
              className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
            >
              <Plus size={18} aria-hidden className="text-poeira -mx-0.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">Criar livro novo</span>
            </button>
          </li>
        }
      />
    </Folha>
  )
}
