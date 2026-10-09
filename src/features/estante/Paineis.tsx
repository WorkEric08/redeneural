import { ChevronRight, PencilLine, Plus, RectangleVertical, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { botao } from '@/components/botao'
import { Confirmacao } from '@/components/Confirmacao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { Folha } from '@/components/Folha'
import {
  chaveDoLugar,
  LUGARES_POR_PRATELEIRA,
  type AnexoNaTela,
  type Id,
  type Livro,
  type NeuronioNaTela,
  type Vaga,
} from '@/core'
import { contar } from '@/lib/plural'

import type { Painel } from './painel'

interface Props {
  painel: Painel | null
  livros: readonly Livro[]
  vagas: readonly Vaga[]
  quantidadeDePrateleiras: number
  neuronios: readonly NeuronioNaTela[]
  /** Os itens das pastas de acervo — uma pasta espia e apaga contando estes. */
  anexos: readonly AnexoNaTela[]
  pontes: ReadonlyMap<Id, ReadonlyMap<Id, number>>
  ocupado: boolean
  onFechar: () => void
  onTrocarPainel: (painel: Painel) => void
  onApagar: (livroId: string) => Promise<boolean>
  /** "Abrir o livro": quem chama anima o livro saindo da estante e só então troca de tela. */
  onAbrirLivro: (livroId: string) => void
  onTirarEnfeite: (prateleira: number, lugar: number) => Promise<void>
  onPorEnfeite: (prateleira: number, lugar: number) => Promise<void>
}

/** Quantos neurônios o espiar lista antes de mandar abrir o livro. */
const NEURONIOS_NO_ESPIAR = 3

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
  if (painel.tipo === 'lugar') return nomeDoLugar(painel.prateleira, painel.lugar)

  const titulo = livros.find((l) => l.id === painel.livroId)?.titulo ?? 'livro'
  const acao = { espiar: 'Espiar', acoes: 'Ações de', apagar: 'Apagar' }
  return `${acao[painel.tipo]} ${titulo}`
}

function Conteudo(props: Props & { painel: Painel }) {
  const { painel, livros, onFechar } = props

  if (painel.tipo === 'lugar') {
    return <MenuDoLugar {...props} prateleira={painel.prateleira} lugar={painel.lugar} />
  }

  // Apagar guarda o livro que abriu: quando o apagar termina, a store já não o
  // tem, e o painel ainda está na tela o instante que leva para fechar.
  if (painel.tipo === 'apagar') return <Apagar {...props} livroId={painel.livroId} />

  const livro = livros.find((l) => l.id === painel.livroId)
  if (!livro) return <Sumiu onFechar={onFechar} />

  // Só sobra 'acoes' depois dos ifs acima — 'editar' virou rota própria
  // (/livro/:livroId/editar, pedido do usuário, 17/09/2026), não painel.
  if (painel.tipo === 'espiar') {
    return livro.tipo === 'acervo' ? (
      <EspiarPasta {...props} livro={livro} />
    ) : (
      <Espiar {...props} livro={livro} />
    )
  }
  return <Acoes {...props} livro={livro} />
}

/** O que o livro guarda, contado como se fala: neurônios num livro, itens numa pasta. */
function conteudoDe(livro: Livro, quantos: number): string {
  return livro.tipo === 'acervo'
    ? contar(quantos, 'item', 'itens')
    : contar(quantos, 'neurônio', 'neurônios')
}

/**
 * A pasta puxada para fora: os itens dela, pela legenda. Sem pontes — uma
 * pasta não tem neurônio, e um anexo nunca é ponte.
 */
function EspiarPasta({ livro, anexos, onAbrirLivro }: Props & { livro: Livro }) {
  const dela = anexos.filter((a) => a.livroId === livro.id)
  const aMais = dela.length - NEURONIOS_NO_ESPIAR

  return (
    <div className="flex flex-col gap-3">
      <Cabecalho livro={livro}>Pasta · {contar(dela.length, 'item', 'itens')}</Cabecalho>

      {dela.length === 0 ? (
        <div className="cartao flex flex-col items-start gap-3 px-4 py-4">
          <p className="text-poeira text-sm">Ainda vazia.</p>
          <Link
            to={`/novo-anexo?livro=${livro.id}`}
            replace
            className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
          >
            <Plus size={16} aria-hidden />
            Guardar o primeiro item
          </Link>
        </div>
      ) : (
        <ul className="cartao flex flex-col">
          {dela.slice(0, NEURONIOS_NO_ESPIAR).map((a) => (
            <li key={a.id} className="linha-de-lista min-h-11 p-0">
              <Link
                to={`/anexo/${a.id}`}
                replace
                className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-sm"
              >
                <span
                  className={`min-w-0 flex-1 truncate ${a.legenda ? '' : 'text-poeira italic'}`}
                >
                  {a.legenda || 'Sem legenda'}
                </span>
                {a.processando && <EtiquetaProcessando />}
                <ChevronRight size={16} aria-hidden className="text-poeira shrink-0" />
              </Link>
            </li>
          ))}
          {aMais > 0 && (
            <li className="linha-de-lista text-poeira min-h-9 py-1.5 text-xs">
              e mais {contar(aMais, 'item', 'itens')} dentro da pasta
            </li>
          )}
        </ul>
      )}

      <Link
        to={`/livro/${livro.id}`}
        replace
        className={botao({ tipo: 'primario', largo: true })}
        onClick={(evento) => {
          evento.preventDefault()
          onAbrirLivro(livro.id)
        }}
      >
        Abrir a pasta
      </Link>
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
function Espiar({ livro, livros, neuronios, pontes, onAbrirLivro }: Props & { livro: Livro }) {
  const dele = neuronios.filter((n) => n.livroId === livro.id)
  const ligacoes = [...(pontes.get(livro.id) ?? new Map<Id, number>())]
    .map(([id, quantas]) => ({ outro: livros.find((l) => l.id === id), quantas }))
    .filter((p): p is { outro: Livro; quantas: number } => p.outro !== undefined)
    .sort((a, b) => b.quantas - a.quantas)
  const totalDePontes = ligacoes.reduce((soma, p) => soma + p.quantas, 0)
  const aMais = dele.length - NEURONIOS_NO_ESPIAR

  return (
    <div className="flex flex-col gap-3">
      <Cabecalho livro={livro}>
        {contar(dele.length, 'neurônio', 'neurônios')}
        {totalDePontes > 0 && (
          <>
            {' · '}
            <span className="text-ponte brilho-ponte-texto-sm">
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
            <li key={n.id} className="linha-de-lista min-h-11 p-0">
              <Link
                to={`/neuronio/${n.id}`}
                replace
                className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{n.titulo}</span>
                {n.processando && <EtiquetaProcessando />}
                <ChevronRight size={16} aria-hidden className="text-poeira shrink-0" />
              </Link>
            </li>
          ))}
          {aMais > 0 && (
            <li className="linha-de-lista text-poeira min-h-9 py-1.5 text-xs">
              e mais {contar(aMais, 'neurônio', 'neurônios')} dentro do livro
            </li>
          )}
        </ul>
      )}

      {ligacoes.length > 0 && (
        <section>
          <h3 className="rotulo-de-secao">Pontes com</h3>
          <ul className="faixa-rolavel flex gap-2">
            {ligacoes.map(({ outro, quantas }) => (
              <li
                key={outro.id}
                className="border-ponte/35 flex h-9 shrink-0 items-center gap-2 rounded-lg border pr-3 pl-2.5 text-sm"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: outro.cor }}
                  aria-hidden
                />
                {outro.titulo}
                <span className="text-ponte font-dado text-xs tabular-nums">{quantas}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Continua link (o destino é anunciado e o teclado o alcança), mas quem
          navega é o fim da animação — ver AberturaDoLivro. */}
      <Link
        to={`/livro/${livro.id}`}
        replace
        className={botao({ tipo: 'primario', largo: true })}
        onClick={(evento) => {
          evento.preventDefault()
          onAbrirLivro(livro.id)
        }}
      >
        Abrir o livro
      </Link>
    </div>
  )
}

function Acoes({ livro, neuronios, anexos, ocupado, onTrocarPainel }: Props & { livro: Livro }) {
  const ehPasta = livro.tipo === 'acervo'
  const quantos = (ehPasta ? anexos : neuronios).filter((x) => x.livroId === livro.id).length

  return (
    <div className="flex flex-col gap-5">
      <Cabecalho livro={livro}>{conteudoDe(livro, quantos)}</Cabecalho>

      <ul className="cartao flex flex-col">
        <li className="linha-de-lista p-0">
          {/* Rota própria, e não um painel: a tela cheia de editar precisa
              das mesmas informações do livro que /novo-livro tem para criar
              (pedido do usuário, 17/09/2026). `replace`: o painel de ações
              não fica no histórico atrás dela. */}
          <Link
            to={`/livro/${livro.id}/editar`}
            replace
            className="flex min-h-14 w-full items-center gap-3.5 px-4"
          >
            <PencilLine size={19} aria-hidden className="text-poeira" />
            {ehPasta ? 'Editar pasta' : 'Editar livro'}
          </Link>
        </li>
        <li className="linha-de-lista p-0">
          <Link
            to={ehPasta ? `/novo-anexo?livro=${livro.id}` : `/novo?livro=${livro.id}`}
            replace
            className="flex min-h-14 w-full items-center gap-3.5 px-4"
          >
            <Plus size={19} aria-hidden className="text-poeira" />
            {ehPasta ? 'Guardar um item aqui' : 'Novo neurônio neste livro'}
          </Link>
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
            {ehPasta ? 'Apagar pasta' : 'Apagar livro'}
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
  anexos,
  ocupado,
  onApagar,
  onFechar,
}: Props & { livroId: string }) {
  const [livro] = useState(() => livros.find((l) => l.id === livroId))
  const [quantos] = useState(
    () =>
      (livro?.tipo === 'acervo' ? anexos : neuronios).filter((x) => x.livroId === livroId).length,
  )

  if (!livro) return <Sumiu onFechar={onFechar} />

  // Uma pasta não tem fio nenhum: apagá-la não refaz conexão de ninguém.
  const explicacao =
    livro.tipo === 'acervo'
      ? quantos > 0
        ? 'Os links e as imagens vão junto. Nenhum conceito muda. Não dá para desfazer.'
        : 'A pasta está vazia. Não dá para desfazer.'
      : quantos > 0
        ? `Os fios que saem ${quantos === 1 ? 'dele' : 'deles'} vão junto, e o palácio refaz as conexões. Não dá para desfazer.`
        : 'O livro está vazio. Não dá para desfazer.'

  return (
    <Confirmacao
      titulo={
        quantos > 0
          ? `Apagar ${livro.titulo} e ${conteudoDe(livro, quantos)} dentro?`
          : `Apagar ${livro.titulo}?`
      }
      explicacao={explicacao}
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

/** Contado a partir de 1, como se fala — no banco, a partir de 0. */
function nomeDoLugar(prateleira: number, lugar: number): string {
  return `Prateleira ${String(prateleira + 1)}, lugar ${String(lugar + 1)}`
}

/**
 * Um lugar sem livro. O enfeite é cenário, e não objeto — mas é a pessoa que
 * decide se ele fica: tirar deixa a madeira à mostra, pôr enche de novo.
 */
function MenuDoLugar({
  prateleira,
  lugar,
  livros,
  vagas,
  quantidadeDePrateleiras,
  onFechar,
  onTirarEnfeite,
  onPorEnfeite,
}: Props & { prateleira: number; lugar: number }) {
  const chave = chaveDoLugar({ prateleira, ordem: lugar })
  // Guardado na abertura, como o livro de Apagar: a store já troca o enfeite
  // antes de a folha terminar de fechar, e o menu não pode piscar a outra opção.
  const [aberto] = useState(() => vagas.some((v) => chaveDoLugar(v) === chave))

  const foraDaEstante = prateleira >= quantidadeDePrateleiras || lugar >= LUGARES_POR_PRATELEIRA
  if (foraDaEstante || livros.some((l) => chaveDoLugar(l) === chave)) {
    return <Sumiu onFechar={onFechar}>Este lugar não está mais livre.</Sumiu>
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="font-titulo text-xl font-semibold tracking-tight">
          {nomeDoLugar(prateleira, lugar)}
        </h2>
        <p className="text-poeira text-sm">{aberto ? 'Um lugar vazio' : 'Um enfeite'}</p>
      </header>

      <ul className="cartao flex flex-col">
        <li className="linha-de-lista p-0">
          <Link
            to={`/novo-livro?prateleira=${String(prateleira)}&lugar=${String(lugar)}`}
            replace
            className="flex min-h-14 w-full items-center gap-3.5 px-4"
          >
            <Plus size={19} aria-hidden className="text-poeira" />
            Criar um livro aqui
          </Link>
        </li>
        {!aberto && (
          <li className="linha-de-lista p-0">
            <Link
              to={`/enfeite/${String(prateleira)}/${String(lugar)}/editar`}
              replace
              className="flex min-h-14 w-full items-center gap-3.5 px-4"
            >
              <PencilLine size={19} aria-hidden className="text-poeira" />
              Editar o enfeite
            </Link>
          </li>
        )}
        <li className="linha-de-lista p-0">
          <button
            type="button"
            className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
            onClick={() => {
              void (aberto ? onPorEnfeite : onTirarEnfeite)(prateleira, lugar)
              onFechar()
            }}
          >
            {aberto ? (
              <RectangleVertical size={19} aria-hidden className="text-poeira" />
            ) : (
              <Trash2 size={19} aria-hidden className="text-poeira" />
            )}
            {aberto ? 'Pôr um enfeite' : 'Tirar o enfeite'}
          </button>
        </li>
      </ul>
    </div>
  )
}

function Sumiu({
  onFechar,
  children = 'Este livro não está mais na estante.',
}: {
  onFechar: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-poeira text-sm">{children}</p>
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
