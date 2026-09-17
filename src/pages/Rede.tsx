import { Maximize2, Search, SlidersHorizontal, Waves, Waypoints } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import { grausDoMapa } from '@/features/rede/layout'
import { Tela, type ControleDaTela, type Folgas } from '@/features/rede/Tela'
import { useTravarRolagem } from '@/hooks/useTravarRolagem'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * O quanto a barra de topo (com a contagem) e os controles do pé cobrem da
 * constelação, em px: enquadrar deixa os pontos fora deles. Constante de
 * módulo porque a Tela depende da identidade.
 */
const FOLGAS: Folgas = { topo: 104, base: 112, lados: 28 }

/**
 * A rede do palácio: uma constelação, em tela cheia.
 *
 * Espelha exatamente o grafo do motor — nada é filtrado ou inventado aqui. Os
 * filtros existem porque um palácio grande vira novelo: focar num livro e
 * mostrar só as pontes são as duas formas de voltar a enxergar.
 */
export default function Rede() {
  // O canvas é do dedo inteiro: arrastar a rede não pode disputar com a rolagem.
  useTravarRolagem()

  const { livros, neuronios, conexoes, posicoesDaRede, carregado, moverNeuronioNaRede } =
    usePalacio()

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
  const [centralizarId] = useState<string | null>(() => busca.get('centralizar'))

  const [livroEmFoco, setLivroEmFoco] = useState<string | null>(null)
  const [soAsPontes, setSoAsPontes] = useState(false)
  // Desligado por padrão: a câmera para exatamente onde o dedo soltou, como
  // sempre. Ligado, soltar arrastando a rede projeta um pouco de deslize na
  // direção do gesto — pedido do usuário, 16/09/2026. Sem persistência, como
  // os outros filtros desta folha: é um jeito de navegar agora, não uma
  // preferência gravada do palácio.
  const [deslizarNavegacao, setDeslizarNavegacao] = useState(false)
  // Já nasce selecionado se a busca mandou para cá — o cartão de baixo e a
  // vizinhança acesa aparecem no mesmo instante da câmera se movendo.
  const [selecionado, setSelecionado] = useState<string | null>(() => centralizarId)
  const controle = useRef<ControleDaTela>(null)

  function fecharFiltros(): void {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }

  useEffect(() => {
    if (!busca.get('centralizar')) return
    const proxima = new URLSearchParams(busca)
    proxima.delete('centralizar')
    setBusca(proxima, { replace: true })
  }, [busca, setBusca])

  // O cálculo pesado já aconteceu no Worker (`@/core/motor/redeLayout`) — aqui
  // só converte o formato de transporte (plano, serializável) para o Map que o
  // canvas usa.
  const posicoes = useMemo(() => new Map(Object.entries(posicoesDaRede)), [posicoesDaRede])
  const graus = useMemo(() => grausDoMapa(conexoes), [conexoes])

  // Leva a câmera até o neurônio que a busca escolheu. Roda depois do
  // enquadramento inicial da Tela (efeito de filho comita antes do efeito do
  // pai), então sobrescreve a câmera corretamente. Só a câmera, e não a
  // seleção: essa já nasceu certa lá em cima, sem depender de um efeito.
  useEffect(() => {
    if (!centralizarId) return
    controle.current?.focar(centralizarId)
  }, [centralizarId])

  const pontes = conexoes.filter((c) => c.cross).length
  const escolhido = neuronios.find((n) => n.id === selecionado)
  const livroDoEscolhido = livros.find((l) => l.id === escolhido?.livroId)
  const filtrando = livroEmFoco !== null || soAsPontes
  const livroFocado = livros.find((l) => l.id === livroEmFoco)

  return (
    <div className="flex flex-col">
      {/* Por baixo de tudo e fora de qualquer `.animar-entrada`: o `transform`
          da animação viraria referência para o `fixed`, e a constelação
          nasceria deslocada. */}
      <div className="fixed inset-0 z-0 lg:left-52">
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
          }}
          onSelecionar={setSelecionado}
          onArrastarNeuronio={moverNeuronioNaRede}
          controle={controle}
          folgas={FOLGAS}
          deslizarNavegacao={deslizarNavegacao}
        />
      </div>

      <BarraDeTopo
        voltarPara="/"
        titulo="Rede do palácio"
        acoes={
          // `de=rede`: um resultado de neurônio volta para cá centralizado,
          // em vez de abrir a tela dele — é a Rede que pediu a busca.
          <Link
            to="/busca?de=rede"
            aria-label="Buscar"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
        }
      />

      {/* Deixa o toque passar: por baixo da contagem ainda é a rede. */}
      <p className="text-poeira pointer-events-none relative z-10 px-1 pt-3 text-sm">
        {carregado
          ? `${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')} · `
          : 'Abrindo…'}
        {carregado && (
          <span className="text-ponte brilho-ponte-texto-sm">
            {contar(pontes, 'ponte', 'pontes')}
          </span>
        )}
        {livroFocado && ` · foco em ${livroFocado.titulo}`}
        {soAsPontes && ' · só as pontes'}
      </p>

      {escolhido && (
        <div className="cartao fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-xl items-center gap-3 py-3 pr-3 pl-4 lg:left-[calc(13rem+1rem)]">
          <span
            className="h-9 w-1 shrink-0 rounded-full"
            style={{ background: livroDoEscolhido?.cor }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-titulo truncate font-semibold">{escolhido.titulo}</p>
            <p className="text-poeira truncate text-xs">
              {livroDoEscolhido?.titulo} ·{' '}
              {contar(graus.get(escolhido.id) ?? 0, 'conexão', 'conexões')}
            </p>
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
      <div className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 z-10 flex h-14 items-center gap-3 lg:left-[calc(13rem+1rem)]">
        <button
          type="button"
          aria-label="Enquadrar a rede"
          className={botao({ tipo: 'secundario', tamanho: 'icone' })}
          onClick={() => {
            controle.current?.enquadrar()
          }}
        >
          <Maximize2 size={18} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Filtros da rede"
          aria-pressed={filtrando}
          className={botao({ tipo: 'secundario', tamanho: 'icone' })}
          onClick={() => {
            void navegar({ search: '?filtros=1' })
          }}
        >
          <SlidersHorizontal size={18} aria-hidden />
        </button>
      </div>

      <Folha aberta={filtrosAbertos} rotulo="Filtros da rede" onFechar={fecharFiltros}>
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
              <button
                type="button"
                onClick={() => {
                  setDeslizarNavegacao((v) => !v)
                }}
                aria-pressed={deslizarNavegacao}
                className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
              >
                <Waves size={16} aria-hidden />
                Deslizar navegação
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
      </Folha>
    </div>
  )
}
