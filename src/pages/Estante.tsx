import { ArrowDownAZ, Grip, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { botao } from '@/components/botao'
import { Movel } from '@/features/estante/Movel'
import { PaineisDaEstante } from '@/features/estante/Paineis'
import { panoSugerido } from '@/features/estante/panos'
import { montarEstante, pontesEntreLivros } from '@/features/estante/resumo'
import { usePainel } from '@/features/estante/usePainel'
import { useTravarRolagem } from '@/hooks/useTravarRolagem'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/** O tempo que o livro recém-criado leva chegando à prateleira (ver `lombada-chegar`). */
const CHEGADA_MS = 900

/**
 * A estante: seus livros vistos de fora — e na mão.
 *
 * A tela inteira é o móvel, então não rola: tudo que ela tem para mostrar cabe
 * nela, e arrastar um livro não pode disputar o dedo com a rolagem.
 */
export default function Estante() {
  useTravarRolagem()

  const {
    livros,
    neuronios,
    conexoes,
    carregado,
    ocupado,
    quantidadeDePrateleiras,
    moverLivro,
    criarLivro,
    editarLivro,
    apagarLivro,
    ordenarEstante,
  } = usePalacio()
  const { painel, abrir, trocar, fechar } = usePainel()
  const [chegandoId, setChegandoId] = useState<string | null>(null)
  // Sem persistência de propósito: é um modo de trabalho, não uma preferência
  // — cada visita à estante começa com o arrastar desligado, para segurar um
  // livro só de passagem nunca movê-lo sem querer.
  const [organizando, setOrganizando] = useState(false)

  const estante = useMemo(
    () => montarEstante(livros, neuronios, conexoes),
    [livros, neuronios, conexoes],
  )
  const pontes = useMemo(() => pontesEntreLivros(neuronios, conexoes), [neuronios, conexoes])

  useEffect(() => {
    if (chegandoId === null) return
    const relogio = window.setTimeout(() => {
      setChegandoId(null)
    }, CHEGADA_MS)
    return () => {
      window.clearTimeout(relogio)
    }
  }, [chegandoId])

  const selecionadoId =
    painel && painel.tipo !== 'novo' && painel.tipo !== 'ordenar' ? painel.livroId : null

  return (
    <div className="animar-entrada flex flex-col gap-5">
      {/* A altura mínima é a tela inteira menos o respiro do `<main>` (5px no
          topo + 24px embaixo, ver App.tsx): o `mt-auto` empurra a contagem até
          a mesma altura do botão de criar (h-14, como .dial-botao).

          Só abaixo de 1024 px: no desktop não existe dial para alinhar (a
          navegação é a coluna fixa — ver Dial.tsx). */}
      <div className="flex min-h-[calc(100dvh_-_29px_-_env(safe-area-inset-bottom))] flex-col lg:min-h-0">
        <Movel
          estante={estante}
          pontes={pontes}
          selecionadoId={selecionadoId}
          chegandoId={chegandoId}
          quantidadeDePrateleiras={quantidadeDePrateleiras}
          organizando={organizando}
          onEspiar={(livroId) => {
            abrir({ tipo: 'espiar', livroId })
          }}
          onAcoes={(livroId) => {
            abrir({ tipo: 'acoes', livroId })
          }}
          onMover={(livroId, prateleira, posicao) => {
            void moverLivro(livroId, prateleira, posicao)
          }}
          onNovo={(prateleira) => {
            abrir({ tipo: 'novo', prateleira })
          }}
        />

        <div className="mt-auto flex h-14 items-center gap-3">
          {/* Os dois botões vêm antes do texto, e não depois: o botão de criar
              (Dial) mora fixo no canto inferior direito, e um botão colocado
              depois de um `flex-1` acaba empurrado até lá — ficaria atrás
              dele, inalcançável (aconteceu com o de organizar). */}
          <button
            type="button"
            aria-pressed={organizando}
            aria-label={organizando ? 'Sair do modo organizar' : 'Entrar no modo organizar'}
            className={botao({ tipo: 'secundario', tamanho: 'icone' })}
            onClick={() => {
              setOrganizando((o) => !o)
            }}
          >
            <Grip size={18} aria-hidden />
          </button>
          <Link
            to="/busca"
            aria-label="Buscar"
            className={botao({ tipo: 'secundario', tamanho: 'icone' })}
          >
            <Search size={18} aria-hidden />
          </Link>
          <button
            type="button"
            aria-label="Ordenar a estante"
            className={botao({ tipo: 'secundario', tamanho: 'icone' })}
            onClick={() => {
              abrir({ tipo: 'ordenar' })
            }}
          >
            <ArrowDownAZ size={18} aria-hidden />
          </button>
          <p className="text-poeira min-w-0 flex-1 truncate text-xs">
            {carregado
              ? `${contar(livros.length, 'livro', 'livros')} · ${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')}`
              : 'Abrindo o palácio…'}
          </p>
        </div>
      </div>

      <PaineisDaEstante
        painel={painel}
        livros={livros}
        neuronios={neuronios}
        pontes={pontes}
        ocupado={ocupado}
        panoSugerido={panoSugerido(livros)}
        onFechar={fechar}
        onTrocarPainel={trocar}
        onCriar={async (novo, prateleira) => {
          const id = await criarLivro(novo, prateleira)
          if (id) setChegandoId(id)
          return id !== null
        }}
        onEditar={editarLivro}
        onApagar={apagarLivro}
        onOrdenar={(criterio) => {
          void ordenarEstante(criterio)
        }}
      />
    </div>
  )
}
