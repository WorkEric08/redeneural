import { Paperclip, Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import type { AnexoNaTela, Livro } from '@/core'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

import { Miniatura } from './Miniatura'
import { conceitosPorAnexo, situacaoDoAnexo, type ConceitoDoAnexo } from './resumo'

/**
 * Uma pasta de acervo aberta: a grade dos links e imagens dela.
 *
 * **Grade também no celular** (2 colunas), divergindo do §6 do mestre, que
 * pede lista vertical abaixo de 768 px — aprovado no plano de 24/09/2026: isto
 * é uma galeria, e imagem em fila única de cartões largos vira uma rolagem sem
 * fim de uma foto por tela.
 *
 * Cada cartão diz com que conceitos o anexo combinou, ou que ele fica só na
 * pasta — é o que explica por que ele aparece (ou não) na Rede.
 */
export function Pasta({ livro }: { livro: Livro }) {
  const { anexos, vinculos, neuronios } = usePalacio()

  const meus = useMemo(() => anexos.filter((a) => a.livroId === livro.id), [anexos, livro.id])
  const conceitos = useMemo(() => conceitosPorAnexo(vinculos, neuronios), [vinculos, neuronios])
  const adicionar = `/novo-anexo?livro=${livro.id}`

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara="/"
        titulo={
          <>
            <span
              className="h-5 w-1 shrink-0 rounded-full"
              style={{ background: livro.cor }}
              aria-hidden
            />
            <span className="truncate">{livro.titulo}</span>
          </>
        }
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

      <div className="animar-entrada flex flex-col pt-5">
        <div className="flex min-h-10 items-center justify-between gap-3 px-1 pb-4">
          <p className="text-poeira text-sm">{contar(meus.length, 'item', 'itens')}</p>
          {meus.length > 0 && (
            <Link to={adicionar} className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}>
              <Plus size={16} aria-hidden />
              Adicionar
            </Link>
          )}
        </div>

        {meus.length === 0 ? (
          <div className="cartao flex flex-col items-center gap-4 px-6 py-10 text-center">
            <span className="bg-realce text-papel grid size-12 place-items-center rounded-full">
              <Paperclip size={22} aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-titulo text-lg font-semibold">Esta pasta ainda está vazia</p>
              <p className="text-poeira text-sm">
                Guarde um link ou uma imagem com uma legenda, e ela se prende aos conceitos
                parecidos.
              </p>
            </div>
            <Link to={adicionar} className={botao({ tipo: 'primario' })}>
              Guardar o primeiro item
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {meus.map((a) => (
              <li key={a.id}>
                <CartaoDoAnexo anexo={a} conceitos={conceitos.get(a.id) ?? []} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function CartaoDoAnexo({
  anexo,
  conceitos,
}: {
  anexo: AnexoNaTela
  conceitos: readonly ConceitoDoAnexo[]
}) {
  const situacao = situacaoDoAnexo(anexo, conceitos)
  const [primeiro] = conceitos

  return (
    <Link
      to={`/anexo/${anexo.id}`}
      className="cartao active:bg-realce hover:bg-realce/60 flex h-full flex-col transition-colors"
    >
      <Miniatura anexo={anexo} className="aspect-[4/3] w-full" />
      <span className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
        {anexo.legenda ? (
          <span className="line-clamp-2 text-sm leading-snug">{anexo.legenda}</span>
        ) : (
          <span className="text-poeira text-sm italic">Sem legenda</span>
        )}

        <span className="text-poeira mt-auto text-xs leading-snug">
          {situacao === 'processando' && <EtiquetaProcessando />}
          {situacao === 'preso' && primeiro && (
            <span className="line-clamp-2">
              com {primeiro.titulo}
              {conceitos.length > 1 && ` e mais ${String(conceitos.length - 1)}`}
            </span>
          )}
          {(situacao === 'solto' || situacao === 'sem-legenda') && 'fica só na pasta'}
        </span>
      </span>
    </Link>
  )
}
