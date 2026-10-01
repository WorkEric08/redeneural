import { Link } from 'react-router-dom'

import type { Id, Livro, NeuronioNaTela } from '@/core'
import { contar } from '@/lib/plural'

import type { PonteAgrupada } from './pontes'

interface Props {
  ponte: PonteAgrupada
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
}

/**
 * O que uma ponte do Mapa junta: os pares de neurônios, um de cada livro, do
 * mais parecido para o menos. Cada nome abre o neurônio — a ponte agrupada é
 * o resumo, e aqui está o que ela resume.
 */
export function ParesDaPonte({ ponte, livros, neuronios }: Props) {
  const livroA = livros.find((l) => l.id === ponte.livroA)
  const livroB = livros.find((l) => l.id === ponte.livroB)
  const titulo = new Map(neuronios.map((n) => [n.id, n.titulo]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="font-titulo text-xl leading-snug font-semibold tracking-tight">
          {livroA?.titulo} e {livroB?.titulo}
        </h2>
        <p className="text-poeira text-sm">
          {contar(ponte.quantidade, 'conexão', 'conexões')} entre os dois livros
        </p>
      </div>
      <ul className="cartao flex flex-col">
        {ponte.pares.map((par) => (
          <li key={`${par.aId}::${par.bId}`} className="linha-de-lista gap-2 py-1.5 pr-4 pl-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <Lado id={par.aId} titulo={titulo.get(par.aId)} cor={livroA?.cor} />
              <Lado id={par.bId} titulo={titulo.get(par.bId)} cor={livroB?.cor} />
            </div>
            <span className="text-poeira font-dado shrink-0 text-xs tabular-nums">
              {Math.round(par.score * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Lado({
  id,
  titulo,
  cor,
}: {
  id: Id
  titulo: string | undefined
  cor: string | undefined
}) {
  return (
    <Link
      to={`/neuronio/${id}`}
      className="active:bg-realce hover:bg-realce/60 flex min-h-11 items-center gap-2.5 rounded-lg px-2 transition-colors"
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: cor ?? 'var(--linha)' }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm">{titulo}</span>
    </Link>
  )
}
