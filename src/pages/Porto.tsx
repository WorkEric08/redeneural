import { Anchor } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { noPorto } from '@/features/porto/porto'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * O porto: os neurônios que o palácio não soube onde guardar, esperando a
 * pessoa escolher. Nenhum se perde — só não tem livro ainda. "Guardar em…"
 * abre a mesma pergunta da tela de escrever (`?guardar=`, ver GuardarNoPorto).
 */
export default function Porto() {
  const { neuronios, carregado } = usePalacio()
  const esperando = useMemo(() => noPorto(neuronios), [neuronios])

  return (
    <div className="flex flex-col">
      <BarraDeTopo voltarPara="/" titulo="Porto" />

      <div className="animar-entrada flex flex-col pt-5">
        {!carregado ? (
          <p className="text-poeira px-1 text-sm">Abrindo…</p>
        ) : esperando.length === 0 ? (
          <div className="cartao flex flex-col items-center gap-4 px-6 py-10 text-center">
            <span className="bg-realce text-papel grid size-12 place-items-center rounded-full">
              <Anchor size={22} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-titulo text-lg font-semibold">Nada no porto</p>
              <p className="text-poeira text-sm">
                Quando o palácio não souber onde guardar um neurônio, ele espera aqui.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-poeira px-1 pb-4 text-sm">
              {contar(esperando.length, 'neurônio esperando livro', 'neurônios esperando livro')}
            </p>
            <ul className="flex flex-col gap-3">
              {esperando.map((n) => (
                <li key={n.id} className="cartao flex flex-col">
                  <Link
                    to={`/neuronio/${n.id}`}
                    className="active:bg-realce hover:bg-realce/60 flex min-w-0 flex-col gap-1.5 px-4 pt-4 pb-3 transition-colors"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-titulo min-w-0 truncate text-[1.05rem] leading-snug font-semibold">
                        {n.titulo}
                      </span>
                      {n.processando && <EtiquetaProcessando />}
                    </span>
                    {n.conteudo !== '' && (
                      <span className="text-poeira line-clamp-2 text-sm leading-relaxed">
                        {n.conteudo}
                      </span>
                    )}
                  </Link>
                  <div className="px-4 pb-4">
                    <Link
                      to={{ search: `?guardar=${n.id}` }}
                      className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
                    >
                      Guardar em…
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
