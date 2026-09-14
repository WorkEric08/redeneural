import { CheckSquare, ChevronRight, PencilLine, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { botao } from '@/components/botao'
import { Confirmacao } from '@/components/Confirmacao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { Folha } from '@/components/Folha'
import type { CriterioDeOrdenacao, EtiquetaDePrateleira, Id, Livro, NeuronioNaTela } from '@/core'
import { contar } from '@/lib/plural'
import type { NovoLivro } from '@/store/palacio'

import { FormularioDeLivro } from './FormularioDeLivro'
import { CRITERIOS } from './ordenar'
import type { Painel } from './painel'

interface Props {
  painel: Painel | null
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  pontes: ReadonlyMap<Id, ReadonlyMap<Id, number>>
  etiquetas: readonly EtiquetaDePrateleira[]
  ocupado: boolean
  panoSugerido: string
  onFechar: () => void
  onTrocarPainel: (painel: Painel) => void
  onCriar: (novo: NovoLivro, prateleira: number) => Promise<boolean>
  onEditar: (livroId: string, dados: NovoLivro) => Promise<boolean>
  onApagar: (livroId: string) => Promise<boolean>
  onOrdenar: (criterio: CriterioDeOrdenacao) => void
  onIniciarSelecao: (livroId: string) => void
  onDefinirEtiqueta: (prateleira: number, texto: string) => void
}

/** Quantos neurônios o espiar lista antes de mandar abrir o livro. */
const NEURONIOS_NO_ESPIAR = 6

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
  if (painel.tipo === 'ordenar') return 'Ordenar a estante'
  if (painel.tipo === 'etiqueta') return `Nomear prateleira ${String(painel.prateleira + 1)}`

  const titulo = livros.find((l) => l.id === painel.livroId)?.titulo ?? 'livro'
  const acao = { espiar: 'Espiar', acoes: 'Ações de', editar: 'Editar', apagar: 'Apagar' }
  return `${acao[painel.tipo]} ${titulo}`
}

function Conteudo(props: Props & { painel: Painel }) {
  const { painel, livros, onFechar } = props

  if (painel.tipo === 'novo') {
    return (
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 className="font-titulo text-xl font-semibold tracking-tight">Um livro novo</h2>
          <p className="text-poeira text-sm">Dê um nome à área. Os neurônios vêm depois.</p>
        </header>
        <FormularioDeLivro
          inicial={{ titulo: '', cor: props.panoSugerido, emblema: null }}
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

  if (painel.tipo === 'ordenar') return <Ordenar {...props} />
  if (painel.tipo === 'etiqueta') {
    return <EditarEtiqueta {...props} prateleira={painel.prateleira} />
  }

  // Apagar guarda o livro que abriu: quando o apagar termina, a store já não o
  // tem, e o painel ainda está na tela o instante que leva para fechar.
  if (painel.tipo === 'apagar') return <Apagar {...props} livroId={painel.livroId} />

  const livro = livros.find((l) => l.id === painel.livroId)
  if (!livro) return <Sumiu onFechar={onFechar} />

  if (painel.tipo === 'espiar') return <Espiar {...props} livro={livro} />
  if (painel.tipo === 'acoes') return <Acoes {...props} livro={livro} />

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho livro={livro}>Renomear e trocar o pano</Cabecalho>
      <FormularioDeLivro
        inicial={{ titulo: livro.titulo, cor: livro.cor, emblema: livro.emblema }}
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
        className="h-10 w-1.5 shrink-0 rounded-full"
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
  const aMais = dele.length - NEURONIOS_NO_ESPIAR

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
        <div className="cartao flex flex-col items-start gap-3 px-4 py-4">
          <p className="text-poeira text-sm">Ainda vazio.</p>
          <Link
            to={`/novo?livro=${livro.id}`}
            replace
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            <Plus size={16} aria-hidden />
            Escrever o primeiro neurônio
          </Link>
        </div>
      ) : (
        <ul className="cartao flex flex-col">
          {dele.slice(0, NEURONIOS_NO_ESPIAR).map((n) => (
            <li key={n.id} className="linha-de-lista min-h-12 p-0">
              <Link
                to={`/neuronio/${n.id}`}
                replace
                className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{n.titulo}</span>
                {n.processando && <EtiquetaProcessando />}
                <ChevronRight size={16} aria-hidden className="text-poeira shrink-0" />
              </Link>
            </li>
          ))}
          {aMais > 0 && (
            <li className="linha-de-lista text-poeira min-h-11 py-2 text-xs">
              e mais {contar(aMais, 'neurônio', 'neurônios')} dentro do livro
            </li>
          )}
        </ul>
      )}

      {ligacoes.length > 0 && (
        <section>
          <h3 className="rotulo-de-secao">Pontes com</h3>
          <ul className="flex flex-wrap gap-2">
            {ligacoes.map(({ outro, quantas }) => (
              <li
                key={outro.id}
                className="border-ouro/35 flex h-9 items-center gap-2 rounded-full border pr-3 pl-2.5 text-sm"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
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

      <Link to={`/livro/${livro.id}`} replace className={botao({ tipo: 'primario', largo: true })}>
        Abrir o livro
      </Link>
    </div>
  )
}

/**
 * Um atalho de um toque — não muda o padrão. Reordena cada prateleira pelo
 * critério escolhido, sem mudar quem está em qual; mover à mão continua
 * funcionando normalmente depois.
 */
function Ordenar({ onOrdenar, onFechar }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h2 className="font-titulo text-xl font-semibold tracking-tight">Ordenar a estante</h2>
        <p className="text-poeira text-sm">
          Reordena os livros dentro de cada prateleira. Arrastar à mão continua funcionando depois.
        </p>
      </header>

      <ul className="cartao flex flex-col">
        {CRITERIOS.map(({ criterio, rotulo }) => (
          <li key={criterio} className="linha-de-lista p-0">
            <button
              type="button"
              className="flex min-h-14 w-full items-center px-4 text-left"
              onClick={() => {
                onOrdenar(criterio)
                onFechar()
              }}
            >
              {rotulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * O nome de uma prateleira — puramente visual, não mexe em livro nenhum. Um
 * campo só, porque é só isso que existe: texto e prateleira.
 */
function EditarEtiqueta({
  prateleira,
  etiquetas,
  onDefinirEtiqueta,
  onFechar,
}: Props & { prateleira: number }) {
  const atual = etiquetas.find((e) => e.prateleira === prateleira)?.texto ?? ''
  const [texto, setTexto] = useState(atual)

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(evento) => {
        evento.preventDefault()
        onDefinirEtiqueta(prateleira, texto)
        onFechar()
      }}
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-titulo text-xl font-semibold tracking-tight">
          Nomear prateleira {prateleira + 1}
        </h2>
        <p className="text-poeira text-sm">Só um lembrete visual — não muda nada nos livros.</p>
      </header>

      <input
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value)
        }}
        maxLength={60}
        autoComplete="off"
        enterKeyHint="done"
        placeholder="Ex.: Trabalho"
        className="campo font-titulo h-13 px-4 text-lg"
      />

      <div className="flex gap-3">
        {atual !== '' && (
          <button
            type="button"
            className={botao({ tipo: 'secundario' })}
            onClick={() => {
              onDefinirEtiqueta(prateleira, '')
              onFechar()
            }}
          >
            Remover
          </button>
        )}
        <button type="submit" className={botao({ tipo: 'primario', largo: true })}>
          Salvar
        </button>
      </div>
    </form>
  )
}

function Acoes({
  livro,
  neuronios,
  ocupado,
  onTrocarPainel,
  onFechar,
  onIniciarSelecao,
}: Props & { livro: Livro }) {
  const quantos = neuronios.filter((n) => n.livroId === livro.id).length

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho livro={livro}>{contar(quantos, 'neurônio', 'neurônios')}</Cabecalho>

      <ul className="cartao flex flex-col">
        <li className="linha-de-lista p-0">
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
            onClick={() => {
              onTrocarPainel({ tipo: 'editar', livroId: livro.id })
            }}
          >
            <PencilLine size={19} aria-hidden className="text-poeira" />
            Renomear e trocar o pano
          </button>
        </li>
        <li className="linha-de-lista p-0">
          <Link
            to={`/novo?livro=${livro.id}`}
            replace
            className="flex min-h-14 w-full items-center gap-3.5 px-4"
          >
            <Plus size={19} aria-hidden className="text-poeira" />
            Novo neurônio neste livro
          </Link>
        </li>
        <li className="linha-de-lista p-0">
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
            onClick={() => {
              onIniciarSelecao(livro.id)
              onFechar()
            }}
          >
            <CheckSquare size={19} aria-hidden className="text-poeira" />
            Selecionar vários
          </button>
        </li>
        <li className="linha-de-lista p-0">
          {/* Apagar durante um processamento deixaria o motor gravando o vetor de
              um neurônio cujo livro já não existe. */}
          <button
            type="button"
            className="text-destructive flex min-h-14 w-full items-center gap-3.5 px-4 text-left disabled:opacity-50"
            disabled={ocupado}
            onClick={() => {
              onTrocarPainel({ tipo: 'apagar', livroId: livro.id })
            }}
          >
            <Trash2 size={19} aria-hidden />
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
    <Confirmacao
      titulo={
        quantos > 0
          ? `Apagar ${livro.titulo} e ${contar(quantos, 'neurônio', 'neurônios')} dentro?`
          : `Apagar ${livro.titulo}?`
      }
      explicacao={
        quantos > 0
          ? `Os fios que saem ${quantos === 1 ? 'dele' : 'deles'} vão junto, e o palácio refaz as conexões. Não dá para desfazer.`
          : 'O livro está vazio. Não dá para desfazer.'
      }
      rotulo="Apagar"
      rotuloOcupado="Apagando…"
      ocupado={ocupado}
      onCancelar={onFechar}
      onConfirmar={() => {
        void onApagar(livro.id).then((ok) => {
          if (ok) onFechar()
        })
      }}
    />
  )
}

function Sumiu({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-poeira text-sm">Este livro não está mais na estante.</p>
      <button
        type="button"
        onClick={onFechar}
        className={botao({ tipo: 'secundario', largo: true })}
      >
        Fechar
      </button>
    </div>
  )
}
