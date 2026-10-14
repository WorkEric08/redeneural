import { BookOpen, Check, ChevronDown, ChevronRight, Search, Sunrise } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { BlocoDeTitulo } from '@/components/BlocoDeTitulo'
import { botao } from '@/components/botao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import {
  ESTADOS_DA_IDEIA,
  estaAdormecida,
  estadoVisivel,
  type EstadoDaIdeia,
  type NeuronioNaTela,
} from '@/core'
import { Pasta } from '@/features/acervo/Pasta'
import { vizinhosPorNeuronio } from '@/features/estante/resumo'
import { ROTULO_DO_ESTADO, TITULO_DA_SECAO } from '@/features/executaveis/estados'
import { IconeDoEstado } from '@/features/executaveis/IconeDoEstado'
import { FolhaDeEstado } from '@/features/executaveis/FolhaDeEstado'
import { Fios } from '@/features/neuronio/Fios'
import { useTemaPadrao } from '@/hooks/useTemaPadrao'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * Um livro aberto: os pensamentos dele e os fios que saem de cada um.
 *
 * Cada pensamento é um cartão com duas setas, de dois toques diferentes:
 * `ChevronDown` expande os fios ali mesmo (ficam escondidos até o toque —
 * pedido do usuário, 17/09/2026; antes ficavam sempre abertos, e uma lista
 * de 10+ fios por pensamento engolia a tela), e `ChevronRight`, sempre visível,
 * abre a tela cheia do pensamento — é como se lê o texto inteiro, não só a
 * prévia de duas linhas daqui. O fio de ponte leva o nome do livro do outro
 * lado: sem isso, "atravessa livros" não quer dizer nada para quem está lendo.
 *
 * Um livro executável (01/10/2026) separa as ideias pelo andamento — "Fazendo",
 * "Para fazer" e "Feitas" —, e cada cartão ganha à esquerda o círculo do
 * estado, que abre a folha de mudar (`?estado=<id>`, na URL como os outros
 * painéis: o voltar fecha).
 *
 * As que ficaram paradas mais que os dias do livro moram numa seção à parte,
 * "Adormecidas", **no começo da tela e à mostra** — são as que pedem um olhar —,
 * sem cobrança e sem cor de alerta. Cada uma tem "Acordar", e mudar o estado ou
 * abrir a ideia também acorda. O relógio é o de quando a tela abriu: acordar
 * uma ideia aqui a tira da seção na hora, mesmo num livro de 0 dias. Quem fica
 * **recolhida**, só com a contagem, é "Feitas" (14/10/2026; antes era o
 * contrário): o que já terminou abre num toque na seta.
 */
export default function Livro() {
  const { livroId } = useParams()
  const padrao = useTemaPadrao()
  const { livros, neuronios, conexoes, carregado, definirEstado, tocar } = usePalacio()
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()
  const estadoAberto = busca.get('estado')

  const livro = livros.find((l) => l.id === livroId)
  const meus = useMemo(() => neuronios.filter((n) => n.livroId === livroId), [neuronios, livroId])
  const vizinhos = useMemo(
    () => vizinhosPorNeuronio(neuronios, livros, conexoes),
    [neuronios, livros, conexoes],
  )
  // Cada cartão abre e fecha por conta própria — ver os fios de dois
  // pensamentos ao mesmo tempo, comparando, é um uso legítimo desta tela.
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(new Set())
  // Calculado na hora de mostrar, com o relógio de quando a tela abriu.
  const [agora] = useState(() => new Date())
  const [verFeitas, setVerFeitas] = useState(false)

  function fecharEstado(): void {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }

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
              aria-label="Busca global"
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

  // Uma pasta de acervo abre como galeria, não como lista de pensamentos.
  if (livro.tipo === 'acervo') return <Pasta livro={livro} />

  const saindo = meus.reduce(
    (total, n) => total + (vizinhos.get(n.id) ?? []).filter((v) => v.conexao.cross).length,
    0,
  )

  const escolhidoParaEstado = livro.executavel ? meus.find((n) => n.id === estadoAberto) : undefined

  const dormindo = (n: NeuronioNaTela): boolean => estaAdormecida(n, livro, agora)
  // No Padrão o livro executável abre com o bloco de título (rótulo, nome grande e resumo), e a
  // barra de cima fica só com voltar e busca.
  const comBloco = padrao && livro.executavel
  const fazendo = meus.filter((n) => !dormindo(n) && estadoVisivel(n, livro) === 'fazendo').length

  const adormecidas = meus.filter(dormindo)
  const feitas = meus.filter((n) => !dormindo(n) && estadoVisivel(n, livro) === 'feita')

  /** O título de uma seção do livro executável: o nome e a contagem. */
  function cabecalhoDaSecao(titulo: string, quantas: number) {
    return (
      <h2 className="rotulo-de-secao">
        {padrao ? (
          <>
            <span>{titulo}</span>
            <span>{String(quantas)}</span>
          </>
        ) : (
          `${titulo} · ${String(quantas)}`
        )}
      </h2>
    )
  }

  function cartao(n: NeuronioNaTela, estado: EstadoDaIdeia | null, adormecida = false) {
    const aberto = abertos.has(n.id)

    // O Padrão (docs/estilos-visuais-locus.md, "Livro" e "Livro executável"): cada pensamento é um
    // cartão com o texto à esquerda e dois botões redondos à direita — a seta dos fios, solta, e
    // a de abrir, num círculo de campo. Numa ideia executável a linha vira uma linha de lista,
    // sem cartão, com o círculo do andamento à frente.
    if (padrao) {
      return (
        <li key={n.id} className={estado ? 'pd-ideia' : 'pd-neuronio'}>
          <div className={`pd-neuronio-linha ${adormecida ? 'opacity-60' : ''}`}>
            {estado && (
              <Link
                to={{ search: `?estado=${n.id}` }}
                aria-label={`Andamento de ${n.titulo}: ${ROTULO_DO_ESTADO[estado]}`}
                className="pd-estado"
                data-estado={estado}
              >
                {estado === 'feita' && <Check size={15} aria-hidden strokeWidth={2.5} />}
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                alternar(n.id)
              }}
              aria-expanded={aberto}
              className="pd-neuronio-texto"
            >
              <span className="pd-neuronio-titulo texto-do-usuario">
                {n.titulo}
                {n.processando && <EtiquetaProcessando />}
              </span>
              {n.conteudo && <span className="pd-neuronio-previa">{n.conteudo}</span>}
            </button>
            {!estado && (
              <button
                type="button"
                onClick={() => {
                  alternar(n.id)
                }}
                aria-label={aberto ? 'Esconder os fios' : 'Mostrar os fios'}
                aria-expanded={aberto}
                className="pd-icone"
              >
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={`transition-transform ${aberto ? 'rotate-180' : ''}`}
                />
              </button>
            )}
            <Link
              to={`/neuronio/${n.id}`}
              aria-label={`Abrir ${n.titulo}`}
              className={estado ? 'pd-icone' : 'pd-icone pd-icone--campo'}
            >
              <ChevronRight size={18} aria-hidden />
            </Link>
          </div>

          {aberto && (
            <div className="pd-fios">
              <Fios lista={vizinhos.get(n.id) ?? []} />
            </div>
          )}

          {adormecida && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  void tocar(n.id)
                }}
                className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
              >
                <Sunrise size={15} aria-hidden />
                Acordar
              </button>
            </div>
          )}
        </li>
      )
    }

    return (
      <li key={n.id} className="cartao">
        <div className={`flex items-stretch ${adormecida ? 'opacity-70' : ''}`}>
          {estado && (
            // O círculo do andamento, com alvo de toque próprio: mudar o
            // estado não pode disputar o dedo com abrir os fios.
            <Link
              to={{ search: `?estado=${n.id}` }}
              aria-label={`Andamento de ${n.titulo}: ${ROTULO_DO_ESTADO[estado]}`}
              className="text-poeira hover:bg-realce/60 active:bg-realce flex shrink-0 items-center pr-1 pl-4 transition-colors"
            >
              <IconeDoEstado estado={estado} tamanho={20} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              alternar(n.id)
            }}
            aria-expanded={aberto}
            className="active:bg-realce hover:bg-realce/60 flex min-w-0 flex-1 flex-col gap-1.5 px-4 pt-4 pb-3 text-left transition-colors"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-titulo line-clamp-2 min-w-0 text-[1.05rem] leading-snug font-semibold [overflow-wrap:anywhere]">
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
              <span className="text-poeira line-clamp-2 text-sm leading-relaxed">{n.conteudo}</span>
            )}
          </button>

          {/* A segunda seta, sempre à mostra — não escondida atrás
                de expandir: é o caminho direto para ler o texto
                inteiro na tela do pensamento (pedido do usuário,
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

        {adormecida && (
          <div className="border-linha flex justify-end border-t px-3 py-2">
            <button
              type="button"
              onClick={() => {
                void tocar(n.id)
              }}
              className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
            >
              <Sunrise size={15} aria-hidden />
              Acordar
            </button>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara="/"
        titulo={
          comBloco ? (
            ''
          ) : (
            <>
              <span
                className="marca-do-livro h-5 w-1 shrink-0 rounded-full"
                style={{ background: livro.cor }}
                aria-hidden
              />
              <span className="truncate">{livro.titulo}</span>
            </>
          )
        }
        acoes={
          <Link
            to={`/busca?livro=${livro.id}`}
            aria-label="Buscar local"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
        }
      />

      {/* A barra de topo fica fora da animação de entrada: um ancestral animado
          vira a raiz do desfoque dela, e o que rola por baixo deixa de borrar. */}
      <div className="animar-entrada pd-conteudo flex flex-col pt-5">
        {comBloco && (
          <BlocoDeTitulo
            rotulo="Livro executável"
            titulo={livro.titulo}
            cor={livro.cor}
            sub={`${contar(meus.length, 'pensamento', 'pensamentos')}${fazendo > 0 ? ` · ${String(fazendo)} fazendo` : ''}`}
          />
        )}
        <p className="pd-sub text-poeira px-1 pb-4 text-sm" hidden={comBloco}>
          {contar(meus.length, 'pensamento', 'pensamentos')}
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
                {livro.executavel
                  ? 'Toda ideia que você escrever aqui começa em “Para fazer”.'
                  : 'Todo conceito que você escrever aqui vira um pensamento.'}
              </p>
            </div>
            <Link to={`/novo?livro=${livro.id}`} className={botao({ tipo: 'primario' })}>
              Escrever o primeiro pensamento
            </Link>
          </div>
        ) : livro.executavel ? (
          <div className="flex flex-col gap-6">
            {adormecidas.length > 0 && (
              <section aria-label="Adormecidas">
                {cabecalhoDaSecao('Adormecidas', adormecidas.length)}
                <ul className="pd-lista flex flex-col gap-3">
                  {adormecidas.map((n) => cartao(n, estadoVisivel(n, livro), true))}
                </ul>
              </section>
            )}

            {ESTADOS_DA_IDEIA.filter((estado) => estado !== 'feita').map((estado) => {
              const daSecao = meus.filter((n) => !dormindo(n) && estadoVisivel(n, livro) === estado)
              if (daSecao.length === 0) return null
              return (
                <section key={estado} aria-label={TITULO_DA_SECAO[estado]}>
                  {cabecalhoDaSecao(TITULO_DA_SECAO[estado], daSecao.length)}
                  <ul className="pd-lista flex flex-col gap-3">
                    {daSecao.map((n) => cartao(n, estado))}
                  </ul>
                </section>
              )
            })}

            {feitas.length > 0 && (
              <section aria-label={TITULO_DA_SECAO.feita}>
                <button
                  type="button"
                  onClick={() => {
                    setVerFeitas((v) => !v)
                  }}
                  aria-expanded={verFeitas}
                  className={
                    padrao
                      ? 'pd-recolhida'
                      : 'rotulo-de-secao flex min-h-11 w-full items-center gap-1.5 text-left'
                  }
                >
                  {TITULO_DA_SECAO.feita} · {String(feitas.length)}
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={`transition-transform ${verFeitas ? 'rotate-180' : ''}`}
                  />
                </button>
                {verFeitas && (
                  <ul className="pd-lista flex flex-col gap-3">
                    {feitas.map((n) => cartao(n, 'feita'))}
                  </ul>
                )}
              </section>
            )}
          </div>
        ) : (
          <ul className="pd-lista flex flex-col gap-3">{meus.map((n) => cartao(n, null))}</ul>
        )}
      </div>

      {livro.executavel && (
        <FolhaDeEstado
          aberta={escolhidoParaEstado !== undefined}
          neuronio={escolhidoParaEstado}
          estadoAtual={escolhidoParaEstado ? estadoVisivel(escolhidoParaEstado, livro) : null}
          onDefinir={(estado, link, imagem) =>
            escolhidoParaEstado
              ? definirEstado(escolhidoParaEstado.id, estado, link, imagem)
              : Promise.resolve(false)
          }
          onFechar={fecharEstado}
          onManter={() => {
            if (escolhidoParaEstado) void tocar(escolhidoParaEstado.id)
          }}
        />
      )}
    </div>
  )
}
