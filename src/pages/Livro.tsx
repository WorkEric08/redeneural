import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { vizinhosPorNeuronio } from '@/features/estante/resumo'
import { Fios } from '@/features/neuronio/Fios'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * Um livro aberto: os neurônios dele e os fios que saem de cada um.
 *
 * O fio dourado leva o nome do livro do outro lado — sem isso, "atravessa
 * livros" não quer dizer nada para quem está lendo.
 */
export default function Livro() {
  const { livroId } = useParams()
  const { livros, neuronios, conexoes, carregado } = usePalacio()

  const livro = livros.find((l) => l.id === livroId)
  const meus = useMemo(() => neuronios.filter((n) => n.livroId === livroId), [neuronios, livroId])
  const vizinhos = useMemo(
    () => vizinhosPorNeuronio(neuronios, livros, conexoes),
    [neuronios, livros, conexoes],
  )

  if (!livro) {
    return (
      <div className="flex flex-col gap-4">
        <Voltar />
        <p className="text-poeira text-sm">
          {carregado ? 'Este livro não existe mais.' : 'Abrindo o livro…'}
        </p>
      </div>
    )
  }

  const saindo = meus.reduce(
    (total, n) => total + (vizinhos.get(n.id) ?? []).filter((v) => v.conexao.cross).length,
    0,
  )

  return (
    <div className="animar-entrada flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Voltar />
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-1.5 shrink-0 rounded-[1px]"
            style={{ background: livro.cor }}
            aria-hidden
          />
          <div className="min-w-0">
            <h1 className="font-titulo text-2xl font-semibold tracking-tight">{livro.titulo}</h1>
            <p className="text-poeira text-sm">
              {contar(meus.length, 'neurônio', 'neurônios')}
              {saindo > 0 && (
                <span className="text-ouro brilho-ouro-texto-sm">
                  {' '}
                  · {contar(saindo, 'fio saindo', 'fios saindo')}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {meus.length === 0 && (
        <p className="text-poeira text-sm">
          Este livro ainda está vazio.{' '}
          <Link to={`/novo?livro=${livro.id}`} className="underline">
            Crie o primeiro neurônio
          </Link>
          .
        </p>
      )}

      <ul className="divide-linha flex flex-col divide-y">
        {meus.map((n) => (
          <li key={n.id} className="flex flex-col gap-2 py-4">
            <Link to={`/neuronio/${n.id}`} className="flex items-baseline gap-2">
              <h2 className="font-titulo text-base font-semibold">{n.titulo}</h2>
              {n.processando && <span className="text-poeira text-xs">processando…</span>}
            </Link>

            {n.conteudo && (
              <p className="text-poeira line-clamp-2 text-sm leading-relaxed">{n.conteudo}</p>
            )}

            <Fios lista={vizinhos.get(n.id) ?? []} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Voltar() {
  return (
    <Link to="/" className="text-poeira w-fit py-1 text-sm">
      ← Estante
    </Link>
  )
}
