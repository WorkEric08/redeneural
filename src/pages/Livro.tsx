import { BookOpen, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { vizinhosPorNeuronio } from '@/features/estante/resumo'
import { Fios } from '@/features/neuronio/Fios'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * Um livro aberto: os neurônios dele e os fios que saem de cada um.
 *
 * Cada neurônio é um cartão — o título e o começo do texto levam ao neurônio, e
 * os fios embaixo levam a quem ele está ligado. O fio dourado leva o nome do
 * livro do outro lado: sem isso, "atravessa livros" não quer dizer nada para
 * quem está lendo.
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
      <div className="flex flex-col">
        <BarraDeTopo
          voltarPara="/"
          titulo="Livro"
          acoes={
            <Link
              to="/busca"
              aria-label="Buscar"
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <Search size={20} aria-hidden />
            </Link>
          }
        />
        <p className="text-poeira pt-6 text-sm">
          {carregado ? 'Este livro não está mais na estante.' : 'Abrindo o livro…'}
        </p>
      </div>
    )
  }

  const saindo = meus.reduce(
    (total, n) => total + (vizinhos.get(n.id) ?? []).filter((v) => v.conexao.cross).length,
    0,
  )

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara="/"
        titulo={
          <>
            <span
              className="h-5 w-1 shrink-0 rounded-full"
              style={{ background: livro.cor }}
              aria-hidden
            />
            <span className="truncate">{livro.titulo}</span>
          </>
        }
        acoes={
          <Link
            to="/busca"
            aria-label="Buscar"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
        }
      />

      {/* A barra de topo fica fora da animação de entrada: um ancestral animado
          vira a raiz do desfoque dela, e o que rola por baixo deixa de borrar. */}
      <div className="animar-entrada flex flex-col">
        <p className="text-poeira px-1 pt-5 pb-4 text-sm">
          {contar(meus.length, 'neurônio', 'neurônios')}
          {saindo > 0 && (
            <span className="text-ouro brilho-ouro-texto-sm">
              {' '}
              · {contar(saindo, 'fio saindo', 'fios saindo')}
            </span>
          )}
        </p>

        {meus.length === 0 ? (
          <div className="cartao flex flex-col items-center gap-4 px-6 py-10 text-center">
            <span className="bg-realce text-papel grid size-12 place-items-center rounded-full">
              <BookOpen size={22} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-titulo text-lg font-semibold">Este livro ainda está vazio</p>
              <p className="text-poeira text-sm">
                Todo conceito que você escrever aqui vira um neurônio.
              </p>
            </div>
            <Link to={`/novo?livro=${livro.id}`} className={botao({ tipo: 'primario' })}>
              Escrever o primeiro neurônio
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {meus.map((n) => (
              <li key={n.id} className="cartao">
                <Link
                  to={`/neuronio/${n.id}`}
                  className="active:bg-realce hover:bg-realce/60 flex flex-col gap-1.5 px-4 pt-4 pb-3 transition-colors"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-titulo text-[1.05rem] leading-snug font-semibold">
                      {n.titulo}
                    </span>
                    {n.processando && <EtiquetaProcessando />}
                  </span>
                  {n.conteudo && (
                    <span className="text-poeira line-clamp-2 text-sm leading-relaxed">
                      {n.conteudo}
                    </span>
                  )}
                </Link>

                <div className="border-linha border-t px-2 py-1">
                  <Fios lista={vizinhos.get(n.id) ?? []} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
