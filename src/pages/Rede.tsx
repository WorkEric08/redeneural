import { Maximize2, Waypoints } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { grausDoMapa, montarMapa } from '@/features/rede/layout'
import { Tela, type ControleDaTela } from '@/features/rede/Tela'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * A rede do palácio: a visão afastada.
 *
 * Espelha exatamente o grafo do motor — nada é filtrado ou inventado aqui. Os
 * dois controles existem porque um palácio grande vira novelo: focar num livro e
 * mostrar só as pontes são as duas formas de voltar a enxergar.
 */
export default function Rede() {
  const { livros, neuronios, conexoes, carregado } = usePalacio()

  const [livroEmFoco, setLivroEmFoco] = useState<string | null>(null)
  const [soAsPontes, setSoAsPontes] = useState(false)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const controle = useRef<ControleDaTela>(null)

  // O mapa é caro e determinístico: só refaz quando o palácio muda de forma.
  const mapa = useMemo(() => montarMapa(livros, neuronios, conexoes), [livros, neuronios, conexoes])
  const graus = useMemo(() => grausDoMapa(conexoes), [conexoes])

  const douradas = conexoes.filter((c) => c.cross).length
  const escolhido = neuronios.find((n) => n.id === selecionado)
  const livroDoEscolhido = livros.find((l) => l.id === escolhido?.livroId)

  return (
    <div className="flex flex-col">
      <BarraDeTopo voltarPara="/" titulo="Rede do palácio" />

      <div className="animar-entrada flex flex-col gap-4 pt-5">
        <p className="text-poeira px-1 text-sm">
          {carregado
            ? `${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')} · `
            : 'Abrindo…'}
          {carregado && (
            <span className="text-ouro brilho-ouro-texto-sm">
              {contar(douradas, 'ponte', 'pontes')}
            </span>
          )}
        </p>

        {/* O retângulo fica como era, cores inclusive (`cores-de-antes`): ele
            ainda vai ser trabalhado à parte. */}
        <div className="cores-de-antes border-linha bg-sala h-[62vh] min-h-80 overflow-hidden rounded-xl border">
          <Tela
            cena={{
              mapa,
              livros,
              neuronios,
              conexoes,
              graus,
              livroEmFoco,
              soAsPontes,
              selecionado,
            }}
            onSelecionar={setSelecionado}
            controle={controle}
          />
        </div>

        {/* Mesma altura com e sem escolhido: tocar num neurônio não pode
            empurrar os controles de baixo para fora do lugar do dedo. */}
        {escolhido ? (
          <div className="cartao flex min-h-[4.5rem] items-center gap-3 py-3 pr-3 pl-4">
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
        ) : (
          <p className="text-poeira flex min-h-[4.5rem] items-center px-1 text-sm leading-relaxed">
            Arraste para andar, pinça ou roda para aproximar. Toque num neurônio para saber quem é.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSoAsPontes((v) => !v)
            }}
            aria-pressed={soAsPontes}
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            {/* O ícone acende em ouro porque é o desenho da ponte — o botão em
                si continua sem ouro. */}
            <Waypoints size={16} aria-hidden className={soAsPontes ? 'text-ouro' : 'text-poeira'} />
            Só as pontes
          </button>

          <button
            type="button"
            onClick={() => {
              controle.current?.enquadrar()
            }}
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            <Maximize2 size={16} aria-hidden className="text-poeira" />
            Enquadrar
          </button>
        </div>

        <section className="pt-2">
          <h2 className="rotulo-de-secao">Foco</h2>
          <div className="faixa-rolavel -mx-4 flex gap-2 px-4 md:mx-0 md:flex-wrap md:px-0">
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
    </div>
  )
}
