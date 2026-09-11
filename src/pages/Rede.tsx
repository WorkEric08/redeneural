import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <Link to="/" className="text-poeira w-fit py-1 text-sm">
          ← Estante
        </Link>
        <h1 className="font-titulo text-xl font-semibold tracking-tight">Rede do palácio</h1>
        <p className="text-poeira text-sm">
          {carregado
            ? `${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')} · `
            : 'Abrindo…'}
          {carregado && <span className="text-ouro">{contar(douradas, 'ponte', 'pontes')}</span>}
        </p>
      </header>

      <div className="border-linha bg-sala h-[62vh] min-h-80 overflow-hidden rounded-xl border">
        <Tela
          cena={{ mapa, livros, neuronios, conexoes, graus, livroEmFoco, soAsPontes, selecionado }}
          onSelecionar={setSelecionado}
          controle={controle}
        />
      </div>

      {escolhido ? (
        <div className="border-linha flex flex-col gap-1 rounded-lg border p-3">
          <p className="font-titulo font-semibold">{escolhido.titulo}</p>
          <p className="text-poeira text-xs">
            {livroDoEscolhido?.titulo} ·{' '}
            {contar(graus.get(escolhido.id) ?? 0, 'conexão', 'conexões')}
          </p>
          {livroDoEscolhido && (
            <Link
              to={`/livro/${livroDoEscolhido.id}`}
              className="text-poeira w-fit text-xs underline"
            >
              abrir o livro
            </Link>
          )}
        </div>
      ) : (
        <p className="text-poeira text-xs">
          Arraste para andar, pinça ou roda para aproximar. Toque num neurônio para saber quem é.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setSoAsPontes((v) => !v)
          }}
          aria-pressed={soAsPontes}
          className={
            soAsPontes
              ? 'bg-papel text-sala h-11 rounded-lg px-3 text-xs font-semibold'
              : 'border-linha h-11 rounded-lg border px-3 text-xs'
          }
        >
          Só as pontes
        </button>

        <button
          onClick={() => {
            controle.current?.enquadrar()
          }}
          className="border-linha h-11 rounded-lg border px-3 text-xs"
        >
          Enquadrar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-poeira text-xs">Foco:</span>
        <button
          onClick={() => {
            setLivroEmFoco(null)
          }}
          aria-pressed={livroEmFoco === null}
          className={
            livroEmFoco === null
              ? 'bg-papel text-sala h-9 rounded-full px-3 text-xs font-semibold'
              : 'border-linha h-9 rounded-full border px-3 text-xs'
          }
        >
          tudo
        </button>

        {livros.map((l) => (
          <button
            key={l.id}
            onClick={() => {
              setLivroEmFoco((atual) => (atual === l.id ? null : l.id))
            }}
            aria-pressed={livroEmFoco === l.id}
            className="border-linha flex h-9 items-center gap-2 rounded-full border px-3 text-xs"
            style={
              livroEmFoco === l.id
                ? {
                    borderColor: l.cor,
                    background: `color-mix(in oklab, ${l.cor} 22%, transparent)`,
                  }
                : undefined
            }
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
    </div>
  )
}
