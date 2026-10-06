import { RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { botao } from '@/components/botao'
import { Confirmacao } from '@/components/Confirmacao'
import { Folha } from '@/components/Folha'
import type { AnexoNaTela } from '@/core'

import { dominioDe } from './links'
import { Miniatura } from './Miniatura'
import type { PainelDaPasta } from './painelDaPasta'

interface Props {
  painel: PainelDaPasta | null
  anexos: readonly AnexoNaTela[]
  ocupado: boolean
  onFechar: () => void
  onTrocarPainel: (painel: PainelDaPasta) => void
  onApagar: (anexoId: string) => Promise<boolean>
}

/** O nome do item como a pessoa o reconhece: a legenda, ou o que ele é. */
function nomeDoItem(anexo: AnexoNaTela): string {
  if (anexo.legenda.trim() !== '') return anexo.legenda.trim()
  return anexo.midia.tipo === 'link' ? dominioDe(anexo.midia.url) : 'Imagem sem legenda'
}

/**
 * O que se faz com um item da pasta que se segurou: trocá-lo por outro do mesmo tipo,
 * no mesmo lugar, ou excluí-lo — e o lugar fica livre para outro.
 */
export function AcoesDoItem(props: Props) {
  const { painel, anexos, onFechar } = props
  const anexo = painel ? anexos.find((a) => a.id === painel.anexoId) : undefined

  return (
    <Folha
      aberta={painel !== null}
      rotulo={anexo ? `Item ${nomeDoItem(anexo)}` : 'Item da pasta'}
      onFechar={onFechar}
    >
      {painel &&
        (painel.tipo === 'apagar' ? (
          <Excluir {...props} anexoId={painel.anexoId} />
        ) : anexo ? (
          <Menu {...props} anexo={anexo} />
        ) : (
          <Sumiu onFechar={onFechar} />
        ))}
    </Folha>
  )
}

function Menu({ anexo, onTrocarPainel }: Props & { anexo: AnexoNaTela }) {
  const ehImagem = anexo.midia.tipo === 'imagem'

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Miniatura anexo={anexo} compacta className="size-14 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h2 className="font-titulo line-clamp-2 text-lg leading-snug font-semibold tracking-tight">
            {nomeDoItem(anexo)}
          </h2>
          <p className="text-poeira text-sm">{ehImagem ? 'Imagem' : 'Link'}</p>
        </div>
      </header>

      <ul className="cartao flex flex-col">
        <li className="linha-de-lista p-0">
          {/* `replace`: voltar da edição cai na pasta, e não neste menu de novo. */}
          <Link
            to={`/anexo/${anexo.id}/editar`}
            replace
            className="flex min-h-14 w-full items-center gap-3.5 px-4"
          >
            <RefreshCw size={19} aria-hidden className="text-poeira" />
            {ehImagem ? 'Trocar a imagem' : 'Trocar o link'}
          </Link>
        </li>
        <li className="linha-de-lista p-0">
          <button
            type="button"
            className="text-destructive flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
            onClick={() => {
              onTrocarPainel({ tipo: 'apagar', anexoId: anexo.id })
            }}
          >
            <Trash2 size={19} aria-hidden />
            Excluir
          </button>
        </li>
      </ul>
    </div>
  )
}

function Excluir({ anexoId, anexos, ocupado, onApagar, onFechar }: Props & { anexoId: string }) {
  // Guardado na abertura, como o livro de Apagar: quando a exclusão termina a store já
  // não tem o item, e a pergunta ainda está na tela o instante que leva para fechar.
  const [anexo] = useState(() => anexos.find((a) => a.id === anexoId))

  if (!anexo) return <Sumiu onFechar={onFechar} />
  const ehImagem = anexo.midia.tipo === 'imagem'

  return (
    <Confirmacao
      titulo={`Excluir ${ehImagem ? 'esta imagem' : 'este link'}?`}
      explicacao={`"${nomeDoItem(anexo)}" sai da pasta e o lugar fica livre para outro. Nenhum conceito muda. Não dá para desfazer.`}
      rotulo="Excluir"
      rotuloOcupado="Excluindo…"
      ocupado={ocupado}
      onCancelar={onFechar}
      onConfirmar={() => {
        void onApagar(anexo.id).then((ok) => {
          if (ok) onFechar()
        })
      }}
    />
  )
}

function Sumiu({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-poeira text-sm">Este item não está mais na pasta.</p>
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
