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

  return (
    <div className="animar-entrada flex flex-col gap-5">
      {erro && (
        <p className="text-destructive border-destructive/40 bg-parede sombra-superficie rounded-lg border p-3 text-sm">
          {erro}
        </p>
      )}

      <Movel estante={estante} />

      <p className="text-poeira text-xs">
        {carregado
          ? `${contar(livros.length, 'livro', 'livros')} · ${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')}`
          : 'Abrindo o palácio…'}
      </p>

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
