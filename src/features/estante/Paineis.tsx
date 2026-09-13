import { PencilLine, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Folha } from '@/components/Folha'
import type { Id, Livro, NeuronioNaTela } from '@/core'
import { contar } from '@/lib/plural'
import type { NovoLivro } from '@/store/palacio'

import { FormularioDeLivro } from './FormularioDeLivro'
import type { Painel } from './painel'

interface Props {
  painel: Painel | null
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  pontes: ReadonlyMap<Id, ReadonlyMap<Id, number>>
  ocupado: boolean
  panoSugerido: string
  onFechar: () => void
  onTrocarPainel: (painel: Painel) => void
  onCriar: (novo: NovoLivro, prateleira: number) => Promise<boolean>
  onEditar: (livroId: string, dados: NovoLivro) => Promise<boolean>
  onApagar: (livroId: string) => Promise<boolean>
}

/**
 * Os painéis que a estante abre. Um de cada vez, na mesma folha: trocar do menu
 * para "renomear" troca o conteúdo sem fechar e reabrir.
 */
export function PaineisDaEstante(props: Props) {
  const { painel, livros, onFechar } = props

  return (
    <Folha aberta={painel !== null} rotulo={rotuloDo(painel, livros)} onFechar={onFechar}>
      {painel && <Conteudo {...props} painel={painel} />}
    </Folha>
  )
}

function rotuloDo(painel: Painel | null, livros: readonly Livro[]): string {
  if (!painel) return ''
  if (painel.tipo === 'novo') return 'Um livro novo'

  const titulo = livros.find((l) => l.id === painel.livroId)?.titulo ?? 'livro'
  const acao = { espiar: 'Espiar', acoes: 'Ações de', editar: 'Editar', apagar: 'Apagar' }
  return `${acao[painel.tipo]} ${titulo}`
}

function Conteudo(props: Props & { painel: Painel }) {
  const { painel, livros, onFechar } = props

  if (painel.tipo === 'novo') {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <h2 className="font-titulo text-xl font-semibold tracking-tight">Um livro novo</h2>
          <p className="text-poeira text-sm">Dê um nome à área. Os neurônios vêm depois.</p>
        </header>
        <FormularioDeLivro
          inicial={{ titulo: '', cor: props.panoSugerido }}
          rotuloDeEnvio="Criar livro"
          onCancelar={onFechar}
          onEnviar={(dados) => {
            void props.onCriar(dados, painel.prateleira).then((ok) => {
              if (ok) onFechar()
            })
          }}
        />
      </div>
    )
  }

  // Apagar guarda o livro que abriu: quando o apagar termina, a store já não o
  // tem, e o painel ainda está na tela o instante que leva para fechar.
  if (painel.tipo === 'apagar') return <Apagar {...props} livroId={painel.livroId} />

  const livro = livros.find((l) => l.id === painel.livroId)
  if (!livro) return <Sumiu onFechar={onFechar} />

  if (painel.tipo === 'espiar') return <Espiar {...props} livro={livro} />
  if (painel.tipo === 'acoes') return <Acoes {...props} livro={livro} />

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho livro={livro}>Renomear e trocar o pano</Cabecalho>
      <FormularioDeLivro
        inicial={{ titulo: livro.titulo, cor: livro.cor }}
        rotuloDeEnvio="Salvar"
        onCancelar={onFechar}
        onEnviar={(dados) => {
          void props.onEditar(livro.id, dados).then((ok) => {
            if (ok) onFechar()
          })
        }}
      />
    </div>
  )
}

function Cabecalho({ livro, children }: { livro: Livro; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3">
      <span
        className="h-10 w-1.5 shrink-0 rounded-[1px]"
        style={{ background: livro.cor }}
        aria-hidden
      />
      <div className="min-w-0">
        <h2 className="font-titulo truncate text-xl font-semibold tracking-tight">
          {livro.titulo}
        </h2>
        {children !== undefined && <p className="text-poeira text-sm">{children}</p>}
      </div>
    </header>
  )
}

/**
 * O livro puxado para fora: o que tem dentro e com quem ele conversa, sem sair
 * da estante. Tudo que leva para outra tela usa `replace` — o painel é um passo
 * no histórico, e voltar do livro tem que cair na estante, não no painel.
 */
function Espiar({ livro, livros, neuronios, pontes }: Props & { livro: Livro }) {
  const dele = neuronios.filter((n) => n.livroId === livro.id)
  const ligacoes = [...(pontes.get(livro.id) ?? new Map<Id, number>())]
    .map(([id, quantas]) => ({ outro: livros.find((l) => l.id === id), quantas }))
    .filter((p): p is { outro: Livro; quantas: number } => p.outro !== undefined)
    .sort((a, b) => b.quantas - a.quantas)
  const totalDePontes = ligacoes.reduce((soma, p) => soma + p.quantas, 0)

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho livro={livro}>
        {contar(dele.length, 'neurônio', 'neurônios')}
        {totalDePontes > 0 && (
          <>
            {' · '}
            <span className="text-ouro brilho-ouro-texto-sm">
              {contar(totalDePontes, 'ponte', 'pontes')}
            </span>
          </>
        )}
      </Cabecalho>

      {dele.length === 0 ? (
        <p className="text-poeira text-sm">
          Ainda vazio.{' '}
          <Link to={`/novo?livro=${livro.id}`} replace className="text-papel underline">
            Escrever o primeiro neurônio
          </Link>
        </p>
      ) : (
        <ul className="divide-linha flex flex-col divide-y">
          {dele.map((n) => (
            <li key={n.id}>
              <Link
                to={`/neuronio/${n.id}`}
                replace
                className="flex items-baseline gap-2 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{n.titulo}</span>
                {n.processando && <span className="text-poeira text-xs">processando…</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {ligacoes.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-poeira text-xs tracking-wide uppercase">Pontes com</h3>
          <ul className="flex flex-wrap gap-2">
            {ligacoes.map(({ outro, quantas }) => (
              <li
                key={outro.id}
                className="border-ouro/30 flex items-center gap-2 rounded-full border py-1 pr-3 pl-2 text-sm"
              >
                <span
                  className="h-3.5 w-1 rounded-[1px]"
                  style={{ background: outro.cor }}
                  aria-hidden
                />
                {outro.titulo}
                <span className="text-ouro font-dado text-xs tabular-nums">{quantas}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        to={`/livro/${livro.id}`}
        replace
        className="bg-papel text-sala sombra-superficie flex h-12 items-center justify-center rounded-lg font-semibold transition-transform active:scale-[0.98]"
      >
        Abrir o livro
      </Link>
    </div>
  )
}

function Acoes({ livro, neuronios, ocupado, onTrocarPainel }: Props & { livro: Livro }) {
  const quantos = neuronios.filter((n) => n.livroId === livro.id).length
  const acao =
    'flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors active:bg-estante disabled:opacity-50'

  return (
    <div className="flex flex-col gap-4">
      <Cabecalho livro={livro}>{contar(quantos, 'neurônio', 'neurônios')}</Cabecalho>

      <ul className="-mx-3 flex flex-col">
        <li>
          <button
            type="button"
            className={acao}
            onClick={() => {
              onTrocarPainel({ tipo: 'editar', livroId: livro.id })
            }}
          >
            <PencilLine size={18} aria-hidden className="text-poeira" />
            Renomear e trocar o pano
          </button>
        </li>
        <li>
          <Link to={`/novo?livro=${livro.id}`} replace className={acao}>
            <Plus size={18} aria-hidden className="text-poeira" />
            Novo neurônio neste livro
          </Link>
        </li>
        <li>
          {/* Apagar durante um processamento deixaria o motor gravando o vetor de
              um neurônio cujo livro já não existe. */}
          <button
            type="button"
            className={`${acao} text-destructive`}
            disabled={ocupado}
            onClick={() => {
              onTrocarPainel({ tipo: 'apagar', livroId: livro.id })
            }}
          >
            <Trash2 size={18} aria-hidden />
            Apagar livro
          </button>
        </li>
      </ul>
    </div>
  )
}

function Apagar({
  livroId,
  livros,
  neuronios,
  ocupado,
  onApagar,
  onFechar,
}: Props & { livroId: string }) {
  const [livro] = useState(() => livros.find((l) => l.id === livroId))
  const [quantos] = useState(() => neuronios.filter((n) => n.livroId === livroId).length)

  if (!livro) return <Sumiu onFechar={onFechar} />

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-titulo text-xl font-semibold tracking-tight">
          {quantos > 0
            ? `Apagar ${livro.titulo} e ${contar(quantos, 'neurônio', 'neurônios')} dentro?`
            : `Apagar ${livro.titulo}?`}
        </h2>
        <p className="text-poeira text-sm">
          {quantos > 0
            ? `Os fios que saem ${quantos === 1 ? 'dele' : 'deles'} vão junto, e o palácio refaz as conexões. Não dá para desfazer.`
            : 'O livro está vazio. Não dá para desfazer.'}
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={ocupado}
          className="bg-destructive text-sala h-12 flex-1 rounded-lg font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
          onClick={() => {
            void onApagar(livro.id).then((ok) => {
              if (ok) onFechar()
            })
          }}
        >
          {ocupado ? 'Apagando…' : 'Apagar'}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={onFechar}
          className="border-linha h-12 rounded-lg border px-4 text-sm disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Sumiu({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-poeira text-sm">Este livro não está mais na estante.</p>
      <button
        type="button"
        onClick={onFechar}
        className="border-linha h-12 rounded-lg border px-4 text-sm"
      >
        Fechar
      </button>
    </div>
  )
}
