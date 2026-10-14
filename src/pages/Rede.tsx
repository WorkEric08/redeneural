import {
  Anchor,
  ArrowRight,
  Map as IconeDoMapa,
  Maximize,
  Maximize2,
  Search,
  Share2,
  SlidersHorizontal,
  Waypoints,
} from 'lucide-react'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import { Interruptor } from '@/components/Interruptor'
import { OpcoesDoMapa } from '@/features/mapa/OpcoesDoMapa'
import { marcasDoAndamento } from '@/features/executaveis/andamento'
import { ParesDaPonte } from '@/features/mapa/ParesDaPonte'
import { agruparPontes, pontesAMostra, type PonteAgrupada } from '@/features/mapa/pontes'
import { TelaDoMapa } from '@/features/mapa/TelaDoMapa'
import { noPorto, ROTULO_DO_PORTO } from '@/features/porto/porto'
import { grausDoMapa, satelitesDaCena } from '@/features/rede/layout'
import { Tela, type ControleDaTela, type Folgas } from '@/features/rede/Tela'
import { useTemaPadrao } from '@/hooks/useTemaPadrao'
import { useTravarRolagem } from '@/hooks/useTravarRolagem'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * O quanto a barra de topo (com o seletor de modo e a contagem) e os controles
 * do pé cobrem da tela, em px: enquadrar deixa os pontos fora deles. Constante
 * de módulo porque a Tela depende da identidade.
 */
const FOLGAS: Folgas = { topo: 152, base: 112, lados: 28 }
/** No Padrão a barra é só voltar, o seletor e a busca: não há chips nem contagem sob ela. */
const FOLGAS_DO_PADRAO: Folgas = { topo: 84, base: 112, lados: 28 }

/**
 * A rede do palácio, em tela cheia, de dois jeitos (01/10/2026): a
 * **constelação** (por significado) e o **Mapa** (por livro, em ilhas). Abre no
 * último modo usado — na primeira vez, a constelação —, e o pensamento tocado
 * continua tocado ao trocar: o Mapa abre centrado nele.
 *
 * Espelha exatamente o grafo do motor — nada é filtrado ou inventado aqui. Os
 * filtros existem porque um palácio grande vira novelo: focar num livro e
 * mostrar só as pontes são as duas formas de voltar a enxergar.
 */
export default function Rede() {
  // O canvas é do dedo inteiro: arrastar a rede não pode disputar com a rolagem.
  useTravarRolagem()
  const padrao = useTemaPadrao()

  const {
    livros,
    neuronios,
    conexoes,
    anexos,
    vinculos,
    posicoesDaRede,
    mapa,
    modoDaRede: modo,
    carregado,
    moverNeuronioNaRede,
    moverIlhaNoMapa,
    moverNeuronioNoMapa,
    definirModoDaRede,
  } = usePalacio()

  // A folha dos filtros mora na URL, como os painéis da estante: o voltar do
  // Android fecha a folha antes de sair da Rede. A busca manda para cá com
  // `?centralizar=<id>` pelo mesmo motivo do `?chegou=` da estante: lida já
  // na inicialização do estado (nunca de dentro de um efeito, que dispararia
  // um segundo render síncrono à toa), para não precisar reler depois que o
  // efeito mais abaixo limpa a URL.
  const [busca, setBusca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()
  const filtrosAbertos = busca.get('filtros') === '1'
  const chaveDaPonteAberta = busca.get('ponte')
  const [centralizarId] = useState<string | null>(() => busca.get('centralizar'))
  // O pensamento recém-criado (`Novo.tsx` manda para cá em vez de para a tela
  // dele — pedido do usuário, 17/09/2026): ver `revelar` em Tela.tsx.
  const [novoId] = useState<string | null>(() => busca.get('novo'))

  const [livroEmFoco, setLivroEmFoco] = useState<string | null>(null)
  const [soAsPontes, setSoAsPontes] = useState(false)
  // O "Ver todas as pontes" do Mapa: um jeito de olhar agora, como os filtros
  // da Rede — não fica gravado.
  const [todasAsPontes, setTodasAsPontes] = useState(false)
  // Já nasce selecionado se a busca mandou para cá — o cartão de baixo e a
  // vizinhança acesa aparecem no mesmo instante da câmera se movendo. O
  // recém-criado **não** entra aqui: ele só seleciona (se tiver vizinho) ao
  // fim da própria animação de revelação, não no instante em que a tela monta.
  const [selecionado, setSelecionado] = useState<string | null>(() => centralizarId)
  // Um item de pasta tocado — e um ou outro, nunca os dois: o cartão do pé é
  // de quem foi tocado por último.
  const [anexoSelecionado, setAnexoSelecionado] = useState<string | null>(null)
  const escolherNeuronio = useCallback((id: string | null) => {
    setSelecionado(id)
    setAnexoSelecionado(null)
  }, [])
  const escolherAnexo = useCallback((id: string) => {
    setAnexoSelecionado(id)
    setSelecionado(null)
  }, [])
  const controle = useRef<ControleDaTela>(null)

  function trocarModo(novo: typeof modo): void {
    // O Mapa não tem satélites: um item tocado na constelação deixa de estar.
    if (novo === 'mapa') setAnexoSelecionado(null)
    void definirModoDaRede(novo)
  }

  // Trocou de modo com um pensamento tocado: a tela nova abre centrada nele. Roda
  // depois do enquadramento da tela que acabou de montar (efeito de filho comita
  // antes do do pai).
  const centrarNoEscolhido = useEffectEvent(() => {
    if (selecionado) controle.current?.focar(selecionado)
  })
  useEffect(() => {
    centrarNoEscolhido()
  }, [modo])

  function fecharFolha(): void {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }

  useEffect(() => {
    if (!busca.get('centralizar') && !busca.get('novo')) return
    const proxima = new URLSearchParams(busca)
    proxima.delete('centralizar')
    proxima.delete('novo')
    setBusca(proxima, { replace: true })
  }, [busca, setBusca])

  // O cálculo pesado já aconteceu no Worker (`@/core/motor/redeLayout`) — aqui
  // só converte o formato de transporte (plano, serializável) para o Map que o
  // canvas usa.
  const posicoes = useMemo(() => new Map(Object.entries(posicoesDaRede)), [posicoesDaRede])
  const graus = useMemo(() => grausDoMapa(conexoes), [conexoes])
  const satelites = useMemo(() => satelitesDaCena(anexos, vinculos), [anexos, vinculos])
  // O andamento das ideias dos livros executáveis (adormecidas, feitas, fazendo, para fazer) — com o
  // relógio de quando a tela abriu, como na tela do livro.
  const [agora] = useState(() => new Date())
  const { adormecidas, feitas, fazendo, paraFazer } = useMemo(
    () => marcasDoAndamento(neuronios, livros, agora),
    [neuronios, livros, agora],
  )
  // As pontes do Mapa, uma por par de livros: o canvas desenha e toca, e a
  // folha da ponte lista o que ela junta — a mesma conta para os dois.
  const pontesDoMapa = useMemo(
    () => agruparPontes(conexoes, new Map(neuronios.map((n) => [n.id, n.livroId]))),
    [conexoes, neuronios],
  )
  const ponteAberta = pontesDoMapa.find((p) => p.chave === chaveDaPonteAberta) ?? null
  const abrirPonte = useCallback(
    (ponte: PonteAgrupada) => {
      void navegar({ search: `?${new URLSearchParams({ ponte: ponte.chave }).toString()}` })
    },
    [navegar],
  )

  // Leva a câmera até o pensamento que a busca escolheu. Roda depois do
  // enquadramento inicial da Tela (efeito de filho comita antes do efeito do
  // pai), então sobrescreve a câmera corretamente. Só a câmera, e não a
  // seleção: essa já nasceu certa lá em cima, sem depender de um efeito.
  useEffect(() => {
    if (!centralizarId) return
    controle.current?.focar(centralizarId)
  }, [centralizarId])

  // O pensamento recém-criado: mesma ordem de motivos do efeito acima — a Tela
  // já monta enquadrando tudo sozinha, e é sobre essa câmera que a revelação
  // parte quando aproxima até ele (e seleciona, se tiver vizinho).
  useEffect(() => {
    if (!novoId) return
    controle.current?.revelar(novoId)
  }, [novoId])

  const pontes = conexoes.filter((c) => c.cross).length
  const noMapa = Object.values(mapa.ilhas).reduce((s, i) => s + Object.keys(i.pontos).length, 0)
  const escolhido = neuronios.find((n) => n.id === selecionado)
  const livroDoEscolhido = livros.find((l) => l.id === escolhido?.livroId)
  const anexoEscolhido = anexos.find((a) => a.id === anexoSelecionado)
  const pastaDoEscolhido = livros.find((l) => l.id === anexoEscolhido?.livroId)
  const filtrando = livroEmFoco !== null || soAsPontes
  const livroFocado = livros.find((l) => l.id === livroEmFoco)
  const esperandoNoPorto = noPorto(neuronios).length
  // No Mapa o cartão traz o começo do texto: é a ficha de quem foi achado no
  // mapa. A Rede continua como era.
  const resumo =
    (modo === 'mapa' || padrao) && escolhido ? escolhido.conteudo.replace(/\s+/g, ' ').trim() : ''

  // O cartão do Padrão fala de fios e pontes de quem foi tocado, ou do tamanho da ilha no Mapa.
  const pontesDoEscolhido = escolhido
    ? conexoes.filter((c) => c.cross && (c.aId === escolhido.id || c.bId === escolhido.id)).length
    : 0
  const ilhaDoEscolhido = livroDoEscolhido ? mapa.ilhas[livroDoEscolhido.id] : undefined
  const rodapeDoCartao = escolhido
    ? modo === 'mapa'
      ? `Ilha de ${contar(Object.keys(ilhaDoEscolhido?.pontos ?? {}).length, 'pensamento', 'pensamentos')}`
      : `${contar(graus.get(escolhido.id) ?? 0, 'fio', 'fios')} · ${contar(pontesDoEscolhido, 'ponte', 'pontes')}`
    : ''

  // O seletor de modo: no Padrão é uma pílula no meio da barra de topo.
  const seletorDeModo = (
    <div role="group" aria-label="Como ver a rede" className="pd-modo">
      <button
        type="button"
        aria-pressed={modo === 'rede'}
        onClick={() => {
          trocarModo('rede')
        }}
      >
        Rede
      </button>
      <button
        type="button"
        aria-pressed={modo === 'mapa'}
        onClick={() => {
          trocarModo('mapa')
        }}
      >
        Mapa
      </button>
    </div>
  )

  return (
    <div className="flex flex-col">
      {/* Por baixo de tudo e fora de qualquer `.animar-entrada`: o `transform`
          da animação viraria referência para o `fixed`, e a constelação
          nasceria deslocada. */}
      <div className="fixed inset-0 z-0 lg:left-52">
        {modo === 'mapa' ? (
          <TelaDoMapa
            mapa={mapa}
            livros={livros}
            neuronios={neuronios}
            conexoes={conexoes}
            graus={graus}
            pontes={pontesDoMapa}
            todasAsPontes={todasAsPontes}
            adormecidas={adormecidas}
            feitas={feitas}
            fazendo={fazendo}
            paraFazer={paraFazer}
            selecionado={selecionado}
            onSelecionar={escolherNeuronio}
            onTocarPonte={abrirPonte}
            onMoverIlha={moverIlhaNoMapa}
            onMoverNeuronio={moverNeuronioNoMapa}
            controle={controle}
            folgas={padrao ? FOLGAS_DO_PADRAO : FOLGAS}
          />
        ) : (
          <Tela
            cena={{
              posicoes,
              livros,
              neuronios,
              conexoes,
              graus,
              livroEmFoco,
              soAsPontes,
              selecionado,
              satelites,
              anexoSelecionado,
              adormecidas,
              feitas,
              fazendo,
              paraFazer,
            }}
            onSelecionar={escolherNeuronio}
            onSelecionarAnexo={escolherAnexo}
            onArrastarNeuronio={moverNeuronioNaRede}
            controle={controle}
            folgas={padrao ? FOLGAS_DO_PADRAO : FOLGAS}
          />
        )}
      </div>

      <BarraDeTopo
        voltarPara="/"
        titulo={padrao ? seletorDeModo : 'Rede'}
        acoes={
          // `de=rede`: um resultado de pensamento volta para cá centralizado,
          // em vez de abrir a tela dele — é a Rede que pediu a busca.
          <Link
            to="/busca?de=rede"
            aria-label="Busca global"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
        }
      />

      {!padrao && (
        <div
          role="group"
          aria-label="Como ver a rede"
          className="relative z-10 flex gap-2 px-1 pt-3"
        >
          <button
            type="button"
            aria-pressed={modo === 'rede'}
            onClick={() => {
              trocarModo('rede')
            }}
            className="chip"
          >
            <Share2 size={15} aria-hidden />
            Rede
          </button>
          <button
            type="button"
            aria-pressed={modo === 'mapa'}
            onClick={() => {
              trocarModo('mapa')
            }}
            className="chip"
          >
            <IconeDoMapa size={15} aria-hidden />
            Mapa
          </button>
        </div>
      )}

      {/* Deixa o toque passar: por baixo da contagem ainda é a rede. */}
      {padrao ? null : modo === 'mapa' ? (
        <p className="text-poeira pointer-events-none relative z-10 px-1 pt-2 text-sm">
          {carregado
            ? `${contar(Object.keys(mapa.ilhas).length, 'ilha', 'ilhas')} · ${contar(noMapa, 'pensamento', 'pensamentos')}`
            : 'Abrindo…'}
        </p>
      ) : (
        <p className="text-poeira pointer-events-none relative z-10 px-1 pt-2 text-sm">
          {carregado
            ? `${contar(neuronios.length, 'pensamento', 'pensamentos')} · ${contar(conexoes.length, 'conexão', 'conexões')} · `
            : 'Abrindo…'}
          {carregado && (
            <span className="text-ponte brilho-ponte-texto-sm">
              {contar(pontes, 'ponte', 'pontes')}
            </span>
          )}
          {livroFocado && ` · foco em ${livroFocado.titulo}`}
          {soAsPontes && ' · só as pontes'}
        </p>
      )}

      {anexoEscolhido && padrao && (
        <div className="pd-cartao-rede">
          <div className="pd-cartao-rede-topo">
            <div className="pd-cartao-rede-titulo texto-do-usuario">
              {anexoEscolhido.legenda || 'Sem legenda'}
            </div>
            <div className="pd-pilula">
              <span
                className="marca-do-livro"
                style={{
                  background: pastaDoEscolhido?.cor ?? 'var(--linha)',
                  width: 6,
                  height: 14,
                }}
                aria-hidden
              />
              {pastaDoEscolhido?.titulo}
            </div>
          </div>
          <div className="pd-cartao-rede-pe">
            <span>{anexoEscolhido.midia.tipo === 'imagem' ? 'Imagem' : 'Link'}</span>
            <Link to={`/anexo/${anexoEscolhido.id}`} className="pd-abrir">
              Abrir
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {anexoEscolhido && !padrao && (
        <div className="cartao fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-xl items-center gap-3 py-3 pr-3 pl-4 lg:left-[calc(13rem+1rem)]">
          <span
            className="h-9 w-1 shrink-0 rounded-full"
            style={{ background: pastaDoEscolhido?.cor ?? 'var(--linha)' }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-titulo truncate font-semibold">{anexoEscolhido.legenda}</p>
            <p className="text-poeira truncate text-xs">
              {pastaDoEscolhido?.titulo} ·{' '}
              {anexoEscolhido.midia.tipo === 'imagem' ? 'imagem' : 'link'}
            </p>
          </div>
          <Link
            to={`/anexo/${anexoEscolhido.id}`}
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            Abrir
          </Link>
        </div>
      )}

      {escolhido && padrao && (
        <div className="pd-cartao-rede">
          <div className="pd-cartao-rede-topo">
            <div className="pd-cartao-rede-titulo texto-do-usuario">{escolhido.titulo}</div>
            <div className="pd-pilula">
              {livroDoEscolhido ? (
                <span
                  className="marca-do-livro"
                  style={{ background: livroDoEscolhido.cor, width: 6, height: 14 }}
                  aria-hidden
                />
              ) : (
                <span className="pd-marca-pontilhada" aria-hidden />
              )}
              {livroDoEscolhido?.titulo ?? ROTULO_DO_PORTO}
            </div>
          </div>
          {resumo && <p className="pd-cartao-rede-texto">{resumo}</p>}
          <div className="pd-cartao-rede-pe">
            <span>{rodapeDoCartao}</span>
            <Link to={`/neuronio/${escolhido.id}`} className="pd-abrir">
              Abrir
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      )}

      {escolhido && !padrao && (
        <div className="cartao fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-xl items-center gap-3 py-3 pr-3 pl-4 lg:left-[calc(13rem+1rem)]">
          <span
            className={`w-1 shrink-0 rounded-full ${resumo ? 'self-stretch' : 'h-9'}`}
            style={{ background: livroDoEscolhido?.cor ?? 'var(--linha)' }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-titulo truncate font-semibold">{escolhido.titulo}</p>
            <p className="text-poeira truncate text-xs">
              {livroDoEscolhido?.titulo ?? ROTULO_DO_PORTO} ·{' '}
              {contar(graus.get(escolhido.id) ?? 0, 'conexão', 'conexões')}
            </p>
            {resumo && <p className="text-papel/85 mt-1 line-clamp-2 text-xs">{resumo}</p>}
          </div>
          <Link
            to={`/neuronio/${escolhido.id}`}
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            Abrir
          </Link>
        </div>
      )}

      {/* No pé, à esquerda e na altura do botão de criar, que mora à direita —
          a mesma fileira da estante. */}
      <div className="pd-pe-da-rede fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 z-10 flex h-14 items-center gap-3 lg:left-[calc(13rem+1rem)]">
        <button
          type="button"
          aria-label="Enquadrar a rede"
          className={botao({ tipo: 'secundario', tamanho: 'icone' })}
          onClick={() => {
            controle.current?.enquadrar()
          }}
        >
          {padrao ? <Maximize size={19} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
        </button>
        <button
          type="button"
          aria-label={modo === 'mapa' ? 'Pontes e legenda do mapa' : 'Filtros da rede'}
          aria-pressed={modo === 'mapa' ? todasAsPontes : filtrando}
          className={botao({ tipo: 'secundario', tamanho: 'icone' })}
          onClick={() => {
            void navegar({ search: '?filtros=1' })
          }}
        >
          <SlidersHorizontal size={18} aria-hidden />
        </button>
        {/* O porto no Mapa: quem não tem livro não tem ilha, e é aqui que se vê
            que alguém espera. Leva à lista do porto, o mesmo fluxo de lá. */}
        {modo === 'mapa' && esperandoNoPorto > 0 && (
          <Link
            to="/porto"
            aria-label={`${String(esperandoNoPorto)} no porto`}
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            <Anchor size={16} aria-hidden />
            <span aria-hidden>
              {String(esperandoNoPorto)}
              {/* Num celular de 320 px, só o número: o botão de criar mora logo ao lado. */}
              <span className="max-[359px]:hidden"> no porto</span>
            </span>
          </Link>
        )}
      </div>

      <Folha
        aberta={filtrosAbertos && modo === 'mapa'}
        rotulo="Pontes e legenda do mapa"
        onFechar={fecharFolha}
      >
        <OpcoesDoMapa
          todasAsPontes={todasAsPontes}
          onAlternarPontes={() => {
            setTodasAsPontes((v) => !v)
          }}
          escondidas={pontesDoMapa.length - pontesAMostra(pontesDoMapa).length}
        />
      </Folha>

      <Folha aberta={ponteAberta !== null} rotulo="O que esta ponte junta" onFechar={fecharFolha}>
        {ponteAberta && <ParesDaPonte ponte={ponteAberta} livros={livros} neuronios={neuronios} />}
      </Folha>

      <Folha
        aberta={filtrosAbertos && modo === 'rede'}
        rotulo="Filtros da rede"
        onFechar={fecharFolha}
      >
        {padrao ? (
          <div className="flex flex-col">
            <h2 className="pd-folha-titulo">Filtros</h2>
            <h3 className="rotulo-de-secao pd-secao-da-folha">Mostrar</h3>
            <div className="pd-linha-interruptor">
              <div className="min-w-0 flex-1">
                <p className="pd-linha-interruptor-titulo">Só as pontes</p>
                <p className="pd-linha-interruptor-desc">
                  Esconde as conexões de dentro de cada livro
                </p>
              </div>
              <Interruptor ligado={soAsPontes} onMudar={setSoAsPontes} rotulo="Só as pontes" />
            </div>

            <h3 className="rotulo-de-secao pd-secao-da-folha">Livro em foco</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setLivroEmFoco(null)
                }}
                aria-pressed={livroEmFoco === null}
                className="chip shrink-0"
              >
                Todos
              </button>
              {livros.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLivroEmFoco((atual) => (atual === l.id ? null : l.id))
                  }}
                  aria-pressed={livroEmFoco === l.id}
                  className="chip shrink-0"
                >
                  <span className="pd-ponto-livro" style={{ background: l.cor }} aria-hidden />
                  {l.titulo}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="rotulo-de-secao">Mostrar</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSoAsPontes((v) => !v)
                  }}
                  aria-pressed={soAsPontes}
                  className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
                >
                  {/* O ícone acende na cor de ponte porque é o desenho da ponte —
                    o botão em si continua sem ela. */}
                  <Waypoints
                    size={16}
                    aria-hidden
                    className={soAsPontes ? 'text-ponte' : 'text-poeira'}
                  />
                  Só as pontes
                </button>
              </div>
            </section>

            <section>
              <h2 className="rotulo-de-secao">Foco</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLivroEmFoco(null)
                  }}
                  aria-pressed={livroEmFoco === null}
                  className="chip shrink-0"
                >
                  Tudo
                </button>

                {livros.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLivroEmFoco((atual) => (atual === l.id ? null : l.id))
                    }}
                    aria-pressed={livroEmFoco === l.id}
                    className="chip shrink-0"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: l.cor }}
                      aria-hidden
                    />
                    {l.titulo}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </Folha>
    </div>
  )
}
