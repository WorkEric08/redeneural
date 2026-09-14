import { Search, X, ZoomIn, ZoomOut } from 'lucide-react'
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
    intensidadeDaLuz,
    moverLivro,
    criarLivro,
    editarLivro,
    apagarLivro,
    moverVariosLivros,
  } = usePalacio()
  const { painel, abrir, trocar, fechar } = usePainel()
  const [chegandoId, setChegandoId] = useState<string | null>(null)
  // Sem persistência de propósito: é um jeito de olhar a estante agora, não uma
  // preferência gravada — cada visita volta ao tamanho normal.
  const [visaoGeral, setVisaoGeral] = useState(false)
  // Vazio: modo de seleção desligado. Ganhar o primeiro id já liga o modo —
  // não precisa de uma flag a mais (ver Movel.tsx).
  const [selecionados, setSelecionados] = useState<ReadonlySet<string>>(new Set())
  const selecionando = selecionados.size > 0

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

  const selecionadoId = painel && painel.tipo !== 'novo' ? painel.livroId : null

  function alternarSelecao(livroId: string): void {
    setSelecionados((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(livroId)) proximo.delete(livroId)
      else proximo.add(livroId)
      return proximo
    })
  }

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
          intensidadeDaLuz={intensidadeDaLuz}
          visaoGeral={visaoGeral}
          selecionados={selecionados}
          onEspiar={(livroId) => {
            abrir({ tipo: 'espiar', livroId })
          }}
          onAcoes={(livroId) => {
            abrir({ tipo: 'acoes', livroId })
          }}
          onAlternarSelecao={alternarSelecao}
          onMoverSelecionadosPara={(prateleira) => {
            void moverVariosLivros([...selecionados], prateleira).then(() => {
              setSelecionados(new Set())
            })
          }}
          onMover={(livroId, prateleira, posicao) => {
            void moverLivro(livroId, prateleira, posicao)
          }}
          onNovo={(prateleira) => {
            abrir({ tipo: 'novo', prateleira })
          }}
        />

        {selecionando ? (
          <div className="mt-auto flex h-14 items-center gap-3">
            {/* Substitui a fileira normal — a mesma folga do botão de criar
                (Dial) no canto inferior direito vale aqui também. */}
            <button
              type="button"
              aria-label="Cancelar seleção"
              className={botao({ tipo: 'secundario', tamanho: 'icone' })}
              onClick={() => {
                setSelecionados(new Set())
              }}
            >
              <X size={18} aria-hidden />
            </button>
            <p className="text-poeira min-w-0 flex-1 truncate text-xs">
              {contar(selecionados.size, 'livro selecionado', 'livros selecionados')} · toque numa
              prateleira vazia para mover
            </p>
          </div>
        ) : (
          <div className="mt-auto flex h-14 items-center gap-3">
            {/* Os dois botões vêm antes do texto, e não depois: o botão de
                criar (Dial) mora fixo no canto inferior direito, e um botão
                colocado depois de um `flex-1` acaba empurrado até lá —
                ficaria atrás dele, inalcançável. */}
            <button
              type="button"
              aria-pressed={visaoGeral}
              aria-label={visaoGeral ? 'Voltar ao tamanho normal' : 'Ver a estante inteira'}
              className={botao({ tipo: 'secundario', tamanho: 'icone' })}
              onClick={() => {
                setVisaoGeral((v) => !v)
              }}
            >
              {visaoGeral ? <ZoomIn size={18} aria-hidden /> : <ZoomOut size={18} aria-hidden />}
            </button>
            <Link
              to="/busca"
              aria-label="Buscar"
              className={botao({ tipo: 'secundario', tamanho: 'icone' })}
            >
              <Search size={18} aria-hidden />
            </Link>
            <p className="text-poeira min-w-0 flex-1 truncate text-xs">
              {carregado
                ? `${contar(livros.length, 'livro', 'livros')} · ${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')}`
                : 'Abrindo o palácio…'}
            </p>
          </div>
        )}
      </div>

      <PaineisDaEstante
        painel={painel}
        livros={livros}
        neuronios={neuronios}
        pontes={pontes}
        ocupado={ocupado}
        panoSugerido={panoSugerido(livros)}
        intensidadeDaLuz={intensidadeDaLuz}
        onFechar={fechar}
        onTrocarPainel={trocar}
        onCriar={async (novo, prateleira) => {
          const id = await criarLivro(novo, prateleira)
          if (id) setChegandoId(id)
          return id !== null
        }}
        onEditar={editarLivro}
        onApagar={apagarLivro}
        onIniciarSelecao={(livroId) => {
          setSelecionados(new Set([livroId]))
        }}
      />
    </div>
  )
}
