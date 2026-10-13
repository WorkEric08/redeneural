import { Check, Plus } from 'lucide-react'

import { Folha } from '@/components/Folha'
import type { Id, Livro, NeuronioNaTela } from '@/core'
import { EscolhaDeLivro } from '@/features/neuronio/EscolhaDeLivro'
import { useTemaPadrao } from '@/hooks/useTemaPadrao'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

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
  const padrao = useTemaPadrao()
  const neuronios = usePalacio((s) => s.neuronios)

  // O Padrão (docs/estilos-visuais-locus.md, "Onde guardar?"): título e frase de apoio, uma linha por
  // livro — marca da cor, nome, quantos neurônios — e um círculo que se enche no escolhido.
  if (padrao) {
    return (
      <Folha aberta={aberta} rotulo="Onde guardar?" onFechar={onFechar}>
        <h2 className="pd-folha-titulo pd-folha-titulo--com-sub">Onde guardar?</h2>
        <p className="pd-folha-sub text-poeira">
          {neuronio ? `“${neuronio.titulo}”` : 'Escolha o livro deste neurônio.'}
        </p>
        <ul className="pd-linhas-de-livro">
          {livros.map((l) => {
            const escolhido = l.id === (neuronio?.livroId ?? null)
            return (
              <li key={l.id}>
                <button
                  type="button"
                  aria-pressed={escolhido}
                  onClick={() => {
                    onEscolher(l.id)
                  }}
                  className="pd-linha-de-livro"
                >
                  <span className="pd-linha-marca" style={{ background: l.cor }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="pd-linha-nome">{l.titulo}</span>
                    <span className="pd-linha-conta">
                      {contar(
                        neuronios.filter((n) => n.livroId === l.id).length,
                        'neurônio',
                        'neurônios',
                      )}
                    </span>
                  </span>
                  <span className="pd-radio" aria-hidden>
                    {escolhido && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <button type="button" onClick={onCriarLivro} className="pd-criar-livro">
          <Plus size={18} aria-hidden />
          Criar livro novo
        </button>
      </Folha>
    )
  }

  return (
    <Folha aberta={aberta} rotulo="Onde guardar?" onFechar={onFechar}>
      {neuronio && <p className="text-poeira truncate px-1 pb-3 text-sm">“{neuronio.titulo}”</p>}
      <EscolhaDeLivro
        livros={livros}
        escolhido={neuronio?.livroId ?? null}
        onEscolher={onEscolher}
        depois={
          <li className="col-span-2">
            <button type="button" onClick={onCriarLivro} className="opcao">
              <Plus size={16} aria-hidden className="text-poeira shrink-0" />
              <span className="min-w-0 flex-1 truncate">Criar livro novo</span>
            </button>
          </li>
        }
      />
    </Folha>
  )
}
