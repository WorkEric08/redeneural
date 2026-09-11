import { useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { vizinhosPorNeuronio, type VizinhoDoNeuronio } from '@/features/estante/resumo'
import { Fios } from '@/features/neuronio/Fios'
import { contar, listar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * Um neurônio e o que ele encontrou.
 *
 * Quando chega com `?nasceu=1`, mostra primeiro o aviso do que acabou de
 * conectar. É o momento em que o produto entrega o que prometeu — o usuário só
 * escreveu um texto, e o palácio respondeu com quem ele conversa.
 */
export default function Neuronio() {
  const { neuronioId } = useParams()
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, neuronios, conexoes, carregado, ocupado, apagarNeuronio } = usePalacio()

  const neuronio = neuronios.find((n) => n.id === neuronioId)
  const livro = livros.find((l) => l.id === neuronio?.livroId)

  const vizinhos = useMemo(
    () => vizinhosPorNeuronio(neuronios, livros, conexoes),
    [neuronios, livros, conexoes],
  )

  if (!neuronio) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/" className="text-poeira w-fit py-1 text-sm">
          ← Estante
        </Link>
        <p className="text-poeira text-sm">
          {carregado ? 'Este neurônio não existe mais.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  const meus = vizinhos.get(neuronio.id) ?? []
  const acabouDeNascer = busca.get('nasceu') === '1'

  return (
    <div className="animar-entrada flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        {livro && (
          <Link
            to={`/livro/${livro.id}`}
            className="text-poeira flex w-fit items-center gap-2 py-1 text-sm"
          >
            <span
              className="h-3.5 w-1 shrink-0 rounded-[1px]"
              style={{ background: livro.cor }}
              aria-hidden
            />
            ← {livro.titulo}
          </Link>
        )}

        <div>
          <h1 className="font-titulo text-2xl leading-tight font-semibold tracking-tight">
            {neuronio.titulo}
          </h1>
          {neuronio.processando && <p className="text-poeira text-sm">procurando conexões…</p>}
        </div>
      </header>

      {acabouDeNascer && !neuronio.processando && <Nasceu vizinhos={meus} />}

      {neuronio.conteudo && (
        <p className="text-base leading-relaxed whitespace-pre-wrap">{neuronio.conteudo}</p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-poeira text-xs tracking-wide uppercase">
          {contar(meus.length, 'conexão', 'conexões')}
        </h2>
        <Fios lista={meus} />
      </section>

      <footer className="flex gap-2 pt-2">
        <Link
          to={`/neuronio/${neuronio.id}/editar`}
          className="border-linha flex h-11 flex-1 items-center justify-center rounded-lg border text-sm transition-transform active:scale-[0.98]"
        >
          Editar
        </Link>
        <button
          onClick={() => {
            void apagarNeuronio(neuronio.id).then(() => navegar(livro ? `/livro/${livro.id}` : '/'))
          }}
          disabled={ocupado}
          className="text-poeira hover:text-destructive h-11 px-4 text-sm disabled:opacity-40"
        >
          Apagar
        </button>
      </footer>
    </div>
  )
}

/**
 * O aviso de "conectou com…".
 *
 * A ponte entre livros vem primeiro e sozinha quando existe: é o achado, e
 * misturá-la com as conexões de dentro do próprio livro apagaria justamente o
 * que tem de raro nela.
 */
function Nasceu({ vizinhos }: { vizinhos: readonly VizinhoDoNeuronio[] }) {
  if (vizinhos.length === 0) {
    return (
      <p className="border-linha bg-parede text-poeira sombra-superficie rounded-lg border p-3 text-sm">
        Nasceu sozinho por enquanto. Assim que houver algo parecido no palácio, o fio aparece.
      </p>
    )
  }

  const pontes = vizinhos.filter((v) => v.conexao.cross)
  const dentro = vizinhos.filter((v) => !v.conexao.cross)
  const achado = pontes.length > 0

  return (
    <div
      className={
        achado
          ? 'border-ouro/40 bg-ouro-luz brilho-ouro animar-achado flex flex-col gap-2 rounded-lg border p-3'
          : 'border-linha bg-parede sombra-superficie flex flex-col gap-2 rounded-lg border p-3'
      }
    >
      {pontes.length > 0 && (
        <p className="text-sm">
          <span className="text-ouro brilho-ouro-texto font-semibold">
            {pontes.length === 1 ? 'Achou uma ponte' : `Achou ${String(pontes.length)} pontes`}
          </span>{' '}
          — {listar(pontes.map((p) => `${p.outroTitulo}, em ${p.outroLivro}`))}.
        </p>
      )}

      {dentro.length > 0 && (
        <p className="text-poeira text-sm">
          {pontes.length > 0 ? 'E dentro do livro: ' : 'Conectou com '}
          {listar(dentro.map((d) => d.outroTitulo))}.
        </p>
      )}
    </div>
  )
}
