import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
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
 * Cada neurônio é um cartão com duas setas, de dois toques diferentes:
 * `ChevronDown` expande os fios ali mesmo (ficam escondidos até o toque —
 * pedido do usuário, 17/09/2026; antes ficavam sempre abertos, e uma lista
 * de 10+ fios por neurônio engolia a tela), e `ChevronRight`, sempre visível,
 * abre a tela cheia do neurônio — é como se lê o texto inteiro, não só a
 * prévia de duas linhas daqui. O fio de ponte leva o nome do livro do outro
 * lado: sem isso, "atravessa livros" não quer dizer nada para quem está lendo.
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
  // Cada cartão abre e fecha por conta própria — ver os fios de dois
  // neurônios ao mesmo tempo, comparando, é um uso legítimo desta tela.
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(new Set())

  function alternar(id: string): void {
    setAbertos((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

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
      <div className="animar-entrada flex flex-col pt-5">
        <p className="text-poeira px-1 pb-4 text-sm">
          {contar(meus.length, 'neurônio', 'neurônios')}
          {saindo > 0 && (
            <span className="text-ponte brilho-ponte-texto-sm">
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
            {meus.map((n) => {
              const aberto = abertos.has(n.id)
              return (
                <li key={n.id} className="cartao">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => {
                        alternar(n.id)
                      }}
                      aria-expanded={aberto}
                      className="active:bg-realce hover:bg-realce/60 flex min-w-0 flex-1 flex-col gap-1.5 px-4 pt-4 pb-3 text-left transition-colors"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-titulo min-w-0 truncate text-[1.05rem] leading-snug font-semibold">
                          {n.titulo}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {n.processando && <EtiquetaProcessando />}
                          {/* A seta dos fios: só o indicador de que há algo
                              ali — o toque é no botão inteiro, não só nela. */}
                          <ChevronDown
                            size={18}
                            aria-hidden
                            className={`text-poeira shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
                          />
                        </span>
                      </span>
                      {n.conteudo && (
                        <span className="text-poeira line-clamp-2 text-sm leading-relaxed">
                          {n.conteudo}
                        </span>
                      )}
                    </button>

                    {/* A segunda seta, sempre à mostra — não escondida atrás
                        de expandir: é o caminho direto para ler o texto
                        inteiro na tela do neurônio (pedido do usuário,
                        17/09/2026). Alvo de toque à parte do botão de
                        expandir, para os dois gestos não disputarem o dedo. */}
                    <Link
                      to={`/neuronio/${n.id}`}
                      aria-label={`Abrir ${n.titulo}`}
                      className="hover:bg-realce/60 active:bg-realce flex shrink-0 items-center px-4 transition-colors"
                    >
                      <ChevronRight size={20} aria-hidden className="text-poeira" />
                    </Link>
                  </div>

                  {aberto && (
                    <div className="border-linha border-t px-2 py-2">
                      <Fios lista={vizinhos.get(n.id) ?? []} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
