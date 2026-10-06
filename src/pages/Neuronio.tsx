import { ExternalLink, Hammer, PencilLine, Search, Trash2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Confirmacao } from '@/components/Confirmacao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { Folha } from '@/components/Folha'
import { VisorDeImagens } from '@/components/VisorDeImagens'
import { estadoVisivel, type NeuronioNaTela } from '@/core'
import { vizinhosPorNeuronio } from '@/features/estante/resumo'
import { ROTULO_DO_ESTADO } from '@/features/executaveis/estados'
import { FolhaDeEstado } from '@/features/executaveis/FolhaDeEstado'
import { FolhaDeExecutaveis } from '@/features/executaveis/FolhaDeExecutaveis'
import { FolhaDeixarDeSerExecutavel } from '@/features/executaveis/FolhaDeixarDeSerExecutavel'
import { IconeDoEstado } from '@/features/executaveis/IconeDoEstado'
import { ImagemDoResultado } from '@/features/executaveis/ImagemDoResultado'
import { useCriarLivroExecutavel } from '@/features/executaveis/useCriarLivroExecutavel'
import { TextoComLinks } from '@/features/neuronio/TextoComLinks'
import { useVisorNaUrl } from '@/hooks/useVisorNaUrl'
import { ROTULO_DO_PORTO } from '@/features/porto/porto'
import { usePalacio } from '@/store/palacio'

/**
 * A caixa do andamento ("Para fazer", "Fazendo", "Feita") e a do "Resultado" são a mesma:
 * a mesma largura, a mesma altura e o mesmo desenho (07/10/2026, pedido do usuário), e
 * **fixa** — o tamanho não muda com o status. 128 px cabem o mais longo ("Para fazer", com
 * o ícone). O "Resultado" fica sob o andamento, e "Deixar de ser executável" ao lado.
 */
const CAIXA_DO_ANDAMENTO = 'w-32'

/** O que a confirmação guarda no histórico para saber como sair depois de apagar. */
interface EstadoDaConfirmacao {
  /** A tela do neurônio tem uma tela antes dela dentro do app. */
  temDeOndeVeio: boolean
}

/**
 * Um neurônio e o que ele encontrou.
 *
 * O aviso de "conectou com…" morou aqui até 17/09/2026 — quem entrega esse
 * momento agora é a Rede, com uma animação (ver `revelar` em Tela.tsx e
 * `Novo.tsx`), então esta tela nunca mais é o destino de logo-depois-de-criar.
 *
 * Apagar pergunta antes, numa folha que mora na URL (`?apagar=1`), pelo mesmo
 * motivo dos painéis da estante: voltar fecha a pergunta.
 *
 * Num livro executável (01/10/2026) a ideia mostra o andamento, que muda numa
 * folha (`?estado=1`), e o link do resultado quando está feita. Fora dele, o
 * "Tornar executável" leva a ideia para um livro executável — com um só, direto;
 * com vários ou nenhum, numa folha (`?executar=1`) que escolhe ou cria. E o contrário
 * (07/10/2026): "Deixar de ser executável" a leva de volta a um livro comum, à escolha
 * ou pelo texto (`?desfazer=1`) — o andamento fica guardado, sem aparecer.
 *
 * Feita, a ideia mostra o link e a imagem do resultado, se tiver.
 */
export default function Neuronio() {
  const { neuronioId } = useParams()
  const [busca] = useSearchParams()
  const localizacao = useLocation()
  const { key } = localizacao
  const navegar = useNavigate()
  const {
    livros,
    neuronios,
    conexoes,
    carregado,
    ocupado,
    apagarNeuronio,
    guardarNeuronio,
    definirEstado,
    lerImagemDoResultado,
    avisar,
    tocar,
  } = usePalacio()
  const criarLivroExecutavel = useCriarLivroExecutavel()

  // A imagem do resultado, ampliada: no meio da tela, com o fundo desfocado. Mora na URL
  // (`?ver=`), para o voltar do Android fechar. Uma imagem só — sem setas.
  const idsDoVisor = useMemo(() => (neuronioId ? [neuronioId] : []), [neuronioId])
  const visor = useVisorNaUrl(idsDoVisor)
  const carregarDoVisor = useCallback(
    (id: string) => lerImagemDoResultado(id, 'inteira'),
    [lerImagemDoResultado],
  )

  // O apagado continua desenhado o instante entre o motor responder e a
  // navegação sair daqui — senão piscaria "não existe mais" e a folha sumiria
  // sem animação. Os fios vão junto: a frase da folha não pode mudar enquanto
  // ela diz "Apagando…".
  const [apagando, setApagando] = useState<{ neuronio: NeuronioNaTela; fios: number } | null>(null)
  const neuronio =
    neuronios.find((n) => n.id === neuronioId) ??
    (apagando !== null && apagando.neuronio.id === neuronioId ? apagando.neuronio : undefined)
  const livro = livros.find((l) => l.id === neuronio?.livroId)

  const vizinhos = useMemo(
    () => vizinhosPorNeuronio(neuronios, livros, conexoes),
    [neuronios, livros, conexoes],
  )

  // Abrir uma ideia de livro executável é um toque: o relógio do adormecer
  // recomeça, e ela acorda se dormia. Uma vez por ideia aberta.
  const idParaTocar = livro?.executavel && neuronio ? neuronio.id : null
  useEffect(() => {
    if (idParaTocar) void tocar(idParaTocar)
  }, [idParaTocar, tocar])

  if (!neuronio) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo
          voltarPara="/"
          titulo="Neurônio"
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
          {carregado ? 'Este neurônio não existe mais.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  const meus = vizinhos.get(neuronio.id) ?? []
  const fios = apagando?.fios ?? meus.length
  const perguntando = busca.get('apagar') === '1'
  const mudandoEstado = busca.get('estado') === '1'
  const escolhendoExecutavel = busca.get('executar') === '1'
  const desfazendo = busca.get('desfazer') === '1'
  const estado = estadoVisivel(neuronio, livro)
  const executaveis = livros.filter((l) => l.tipo === 'conceitos' && l.executavel)
  const comuns = livros.filter((l) => l.tipo === 'conceitos' && !l.executavel)
  const saida = livro ? `/livro/${livro.id}` : neuronio.livroId === null ? '/porto' : '/'

  function perguntar(): void {
    const proxima = new URLSearchParams(busca)
    proxima.set('apagar', '1')
    const estado: EstadoDaConfirmacao = { temDeOndeVeio: key !== 'default' }
    void navegar({ search: `?${proxima.toString()}` }, { state: estado })
  }

  function desistir(): void {
    // O React Router chama de 'default' a primeira entrada da sessão: sem casa
    // para voltar, a pergunta sai da URL no lugar.
    if (key === 'default') {
      const proxima = new URLSearchParams(busca)
      proxima.delete('apagar')
      const resto = proxima.toString()
      void navegar({ search: resto ? `?${resto}` : '' }, { replace: true })
    } else {
      void navegar(-1)
    }
  }

  function abrir(painel: 'estado' | 'executar' | 'desfazer'): void {
    void navegar({ search: `?${painel}=1` })
  }

  function fecharPainel(): void {
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }

  /** Guarda num livro executável — "para fazer" — e diz onde ficou. */
  function levarPara(livroId: string, deUmaFolha: boolean): void {
    const destino = livros.find((l) => l.id === livroId)
    if (!neuronio) return
    void guardarNeuronio(neuronio.id, livroId).then((ok) => {
      if (!ok) return
      if (deUmaFolha) fecharPainel()
      avisar(`Agora em ${destino?.titulo ?? 'um livro executável'}, para fazer.`)
    })
  }

  /** Volta a um livro comum — o escolhido, ou, com `null`, o que o palácio achar pelo texto. */
  function tirarDeExecutavel(livroId: string | null): void {
    if (!neuronio) return
    void guardarNeuronio(neuronio.id, livroId).then((ok) => {
      if (!ok) return
      fecharPainel()
      const destino = livros.find((l) => l.id === livroId)
      avisar(destino ? `Agora em ${destino.titulo}.` : 'Saiu dos executáveis.')
    })
  }

  function tornarExecutavel(): void {
    const [unico] = executaveis
    if (executaveis.length === 1 && unico) levarPara(unico.id, false)
    else abrir('executar')
  }

  function apagar(alvo: NeuronioNaTela): void {
    const veioDeAlgumLugar =
      key !== 'default' && (localizacao.state as EstadoDaConfirmacao | null)?.temDeOndeVeio === true

    setApagando({ neuronio: alvo, fios })
    void apagarNeuronio(alvo.id).then((ok) => {
      if (!ok) {
        setApagando(null)
        return
      }
      // Tira a pergunta e a tela do apagado do histórico de uma vez: voltar
      // depois disso não pode cair num neurônio que não existe mais. Sem tela
      // anterior dentro do app, o livro dele é o lugar óbvio.
      if (veioDeAlgumLugar) void navegar(-2)
      else void navegar(saida, { replace: true })
    })
  }

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara={saida}
        titulo={
          livro ? (
            <Link
              to={`/livro/${livro.id}`}
              className="flex min-w-0 items-center gap-2.5 rounded-lg py-2 pr-2"
            >
              <span
                className="h-5 w-1 shrink-0 rounded-full"
                style={{ background: livro.cor }}
                aria-hidden
              />
              <span className="truncate">{livro.titulo}</span>
            </Link>
          ) : neuronio.livroId === null ? (
            // No porto: o lugar do nome do livro diz isso, e tocar pergunta
            // onde guardar — a mesma pergunta da tela de escrever.
            <Link
              to={{ search: `?guardar=${neuronio.id}` }}
              className="flex min-w-0 items-center gap-2.5 rounded-lg py-2 pr-2"
            >
              <span className="border-poeira size-2 shrink-0 rounded-full border" aria-hidden />
              <span className="truncate">{ROTULO_DO_PORTO}</span>
            </Link>
          ) : (
            'Neurônio'
          )
        }
        acoes={
          <>
            <Link
              to="/busca"
              aria-label="Buscar"
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <Search size={20} aria-hidden />
            </Link>
            <Link
              to={`/neuronio/${neuronio.id}/editar`}
              aria-label="Editar"
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <PencilLine size={20} aria-hidden />
            </Link>
            {/* Apagar durante um processamento deixaria o motor gravando o
                vetor de quem não existe mais. */}
            <button
              type="button"
              aria-label="Apagar"
              disabled={ocupado}
              onClick={perguntar}
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <Trash2 size={20} aria-hidden />
            </button>
          </>
        }
      />

      <article className="animar-entrada flex flex-col gap-6 pt-5">
        <header className="flex flex-col items-start gap-2.5 px-1">
          <h1 className="texto-do-usuario font-titulo text-[1.75rem] leading-tight font-semibold tracking-tight text-balance">
            {neuronio.titulo}
          </h1>
          {neuronio.processando && <EtiquetaProcessando texto="procurando conexões" />}
          <div className="flex flex-wrap gap-2">
            {neuronio.livroId === null && (
              <Link
                to={{ search: `?guardar=${neuronio.id}` }}
                className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
              >
                Guardar em…
              </Link>
            )}
            {estado ? (
              // Duas colunas: o andamento e, sob ele, o resultado (a mesma caixa); ao lado do
              // andamento, o "Deixar de ser executável".
              <div className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    abrir('estado')
                  }}
                  aria-label={`Andamento: ${ROTULO_DO_ESTADO[estado]}`}
                  className={`${botao({ tipo: 'secundario', tamanho: 'pequeno' })} ${CAIXA_DO_ANDAMENTO} col-start-1 row-start-1`}
                >
                  <IconeDoEstado estado={estado} tamanho={16} />
                  {ROTULO_DO_ESTADO[estado]}
                </button>
                {estado === 'feita' && neuronio.resultadoLink && (
                  <a
                    href={neuronio.resultadoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${botao({ tipo: 'secundario', tamanho: 'pequeno' })} ${CAIXA_DO_ANDAMENTO} col-start-1 row-start-2`}
                  >
                    <ExternalLink size={15} aria-hidden />
                    Resultado
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    abrir('desfazer')
                  }}
                  disabled={ocupado || comuns.length === 0}
                  // Numa tela estreita o texto quebra em duas linhas, e o botão cresce.
                  className={`${botao({ tipo: 'fantasma', tamanho: 'pequeno' })} col-start-2 row-start-1 h-auto! min-h-11 justify-self-start py-1 text-left`}
                >
                  <Undo2 size={15} aria-hidden className="shrink-0" />
                  <span className="leading-tight">Deixar de ser executável</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={tornarExecutavel}
                disabled={ocupado}
                className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
              >
                <Hammer size={15} aria-hidden />
                Tornar executável
              </button>
            )}
          </div>
        </header>

        {neuronio.conteudo && (
          <TextoComLinks
            texto={neuronio.conteudo}
            className="texto-do-usuario px-1 text-[1.03rem] leading-[1.7] whitespace-pre-wrap"
          />
        )}

        {/* O que saiu da ideia, quando ela está feita: a imagem inteira, na proporção dela. */}
        {estado === 'feita' && neuronio.resultadoImagem && (
          <section aria-labelledby="resultado-imagem" className="flex flex-col">
            <h2 id="resultado-imagem" className="rotulo-de-secao">
              Resultado
            </h2>
            <button
              type="button"
              aria-label="Ampliar a imagem do resultado"
              onClick={() => {
                visor.abrir(neuronio.id)
              }}
              className="block w-full cursor-zoom-in"
            >
              <ImagemDoResultado
                neuronio={neuronio}
                tamanho="inteira"
                className="max-h-96 w-full rounded-2xl"
              />
            </button>
          </section>
        )}
      </article>

      {neuronio.resultadoImagem && (
        <VisorDeImagens
          aberto={visor.aberto}
          imagens={[
            { id: neuronio.id, mime: neuronio.resultadoImagem.mime, rotulo: neuronio.titulo },
          ]}
          indice={0}
          onIndice={visor.trocar}
          carregar={carregarDoVisor}
          onFechar={visor.fechar}
        />
      )}

      <FolhaDeEstado
        aberta={mudandoEstado && estado !== null}
        neuronio={neuronio}
        estadoAtual={estado}
        onDefinir={(novo, link, imagem) => definirEstado(neuronio.id, novo, link, imagem)}
        onFechar={fecharPainel}
      />

      <FolhaDeExecutaveis
        aberta={escolhendoExecutavel && estado === null}
        executaveis={executaveis}
        escolhido={null}
        onEscolher={(livroId) => {
          levarPara(livroId, true)
        }}
        onCriar={criarLivroExecutavel}
        onFechar={fecharPainel}
      />

      <FolhaDeixarDeSerExecutavel
        aberta={desfazendo && estado !== null}
        livros={comuns}
        onEscolher={tirarDeExecutavel}
        onFechar={fecharPainel}
      />

      <Folha aberta={perguntando} rotulo={`Apagar ${neuronio.titulo}`} onFechar={desistir}>
        <Confirmacao
          titulo={`Apagar “${neuronio.titulo}”?`}
          explicacao={
            fios > 0
              ? `${fios === 1 ? 'O fio que sai dele vai' : `Os ${String(fios)} fios que saem dele vão`} junto, e o palácio refaz as conexões de quem fica. Não dá para desfazer.`
              : 'Ele ainda não tem fios. Não dá para desfazer.'
          }
          rotulo="Apagar"
          rotuloOcupado="Apagando…"
          ocupado={ocupado}
          onCancelar={desistir}
          onConfirmar={() => {
            apagar(neuronio)
          }}
        />
      </Folha>
    </div>
  )
}
