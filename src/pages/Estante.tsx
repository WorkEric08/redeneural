import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Movel } from '@/features/estante/Movel'
import { montarEstante } from '@/features/estante/resumo'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * A estante: seus livros vistos de fora.
 *
 * A porta de entrada ainda fica para depois — o resto do acabamento
 * (madeira, ouro como luz) já chegou aqui.
 */
export default function Estante() {
  const { livros, neuronios, conexoes, carregado, erro } = usePalacio()

  const estante = useMemo(
    () => montarEstante(livros, neuronios, conexoes),
    [livros, neuronios, conexoes],
  )
  const douradas = useMemo(() => conexoes.filter((c) => c.cross).length, [conexoes])

  return (
    <div className="animar-entrada flex flex-col gap-8">
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
        <Movel estante={estante} />

        <p className="text-poeira text-xs">
          A altura da lombada é a quantidade de neurônios.
          {douradas > 0 && (
            <>
              {' '}
              O ponto <span className="text-ouro brilho-ouro-texto-sm">dourado</span> marca livro
              com fio saindo para outro — {douradas} no palácio.
            </>
          )}
        </p>
      </section>

      {conexoes.length > 0 && (
        <Link
          to="/rede"
          className="border-linha bg-parede sombra-superficie flex items-center justify-between rounded-lg border px-3 py-3 text-sm transition-transform active:scale-[0.98]"
        >
          <span>Ver a rede do palácio</span>
          <span className="text-poeira text-xs">
            {contar(conexoes.length, 'fio', 'fios')} ·{' '}
            <span className="text-ouro brilho-ouro-texto-sm">
              {contar(douradas, 'ponte', 'pontes')}
            </span>
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
                  {item.saindo > 0 && (
                    <span className="text-ouro brilho-ouro-texto-sm"> · {item.saindo} ↗</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
