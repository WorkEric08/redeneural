import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Lombada } from '@/features/estante/Lombada'
import { montarEstante } from '@/features/estante/resumo'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * A estante: seus livros vistos de fora.
 *
 * Sóbria de propósito — textura, luz e a porta de entrada ficam para a passada
 * final de acabamento. O que precisa estar certo aqui é a informação.
 */
export default function Estante() {
  const { livros, neuronios, conexoes, carregado, erro } = usePalacio()

  const estante = useMemo(
    () => montarEstante(livros, neuronios, conexoes),
    [livros, neuronios, conexoes],
  )
  const douradas = useMemo(() => conexoes.filter((c) => c.cross).length, [conexoes])

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-titulo text-2xl font-semibold tracking-tight">Palácio Mental</h1>
        <p className="text-poeira text-sm">
          {carregado
            ? `${contar(livros.length, 'livro', 'livros')} · ${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')}`
            : 'Abrindo o palácio…'}
        </p>
      </header>

      {erro && (
        <p className="text-destructive border-destructive/40 rounded-lg border p-3 text-sm">
          {erro}
        </p>
      )}

      <section className="flex flex-col gap-3">
        {/* A base da estante é uma linha só: a madeira entra no acabamento. */}
        <div className="border-linha flex items-end gap-1.5 overflow-x-auto border-b pb-0">
          {estante.map((item) => (
            <Lombada key={item.livro.id} item={item} />
          ))}
        </div>

        <p className="text-poeira text-xs">
          A altura da lombada é a quantidade de neurônios.
          {douradas > 0 && (
            <>
              {' '}
              O ponto <span className="text-ouro">dourado</span> marca livro com fio saindo para
              outro — {douradas} no palácio.
            </>
          )}
        </p>
      </section>

      {conexoes.length > 0 && (
        <Link
          to="/rede"
          className="border-linha flex items-center justify-between rounded-lg border px-3 py-3 text-sm"
        >
          <span>Ver a rede do palácio</span>
          <span className="text-poeira text-xs">
            {contar(conexoes.length, 'fio', 'fios')} ·{' '}
            <span className="text-ouro">{contar(douradas, 'ponte', 'pontes')}</span>
          </span>
        </Link>
      )}

      <section className="flex flex-col">
        <h2 className="text-poeira mb-2 text-xs tracking-wide uppercase">Livros</h2>
        <ul className="divide-linha divide-y">
          {estante.map((item) => (
            <li key={item.livro.id}>
              <Link to={`/livro/${item.livro.id}`} className="flex items-center gap-3 py-3 text-sm">
                <span
                  className="h-8 w-1 shrink-0 rounded-[1px]"
                  style={{ background: item.livro.cor }}
                  aria-hidden
                />
                <span className="font-titulo min-w-0 flex-1 truncate font-semibold">
                  {item.livro.titulo}
                </span>
                <span className="text-poeira font-dado shrink-0 text-xs tabular-nums">
                  {item.neuronios}
                  {item.saindo > 0 && <span className="text-ouro"> · {item.saindo} ↗</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
