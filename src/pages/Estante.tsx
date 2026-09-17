import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { botao } from '@/components/botao'
import type { Livro } from '@/core'
import { AberturaDoLivro } from '@/features/estante/AberturaDoLivro'
import { geometriaDaAbertura, type Abertura } from '@/features/estante/abertura'
import { Movel } from '@/features/estante/Movel'
import { PaineisDaEstante } from '@/features/estante/Paineis'
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
    vagas,
    neuronios,
    conexoes,
    carregado,
    ocupado,
    quantidadeDePrateleiras,
    intensidadeDaLuz,
    moverLivro,
    apagarLivro,
    tirarEnfeite,
    porEnfeite,
  } = usePalacio()
  const { painel, abrir, trocar, fechar } = usePainel()
  const navegar = useNavigate()
  const [busca, setBusca] = useSearchParams()
  // O livro nasce em `/novo-livro` (tela cheia) e volta para cá com
  // `?chegou=`, para a estante animar a chegada na prateleira — daí ler a
  // busca já na inicialização, e não numa reação a ela (o efeito abaixo só
  // limpa a URL, sem repetir esta leitura).
  const [chegandoId, setChegandoId] = useState<string | null>(() => busca.get('chegou'))

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

  // `chegou` já foi lido na inicialização do estado acima — aqui só some da
  // URL, sem mexer em mais nada que esteja ali (um painel, por exemplo —
  // embora os dois não devessem coincidir na prática).
  useEffect(() => {
    if (!busca.get('chegou')) return
    const proxima = new URLSearchParams(busca)
    proxima.delete('chegou')
    setBusca(proxima, { replace: true })
  }, [busca, setBusca])

  // O livro saindo da estante. Só vale enquanto o espiar dele está na URL:
  // voltar no meio da animação tira o espiar, e com ele a animação — senão o
  // fim dela trocaria a estante pelo livro no histórico.
  const [abrindo, setAbrindo] = useState<{ livro: Livro; geometria: Abertura } | null>(null)
  const abrindoAgora =
    abrindo && painel?.tipo === 'espiar' && painel.livroId === abrindo.livro.id ? abrindo : null

  function abrirLivro(livroId: string): void {
    const livro = livros.find((l) => l.id === livroId)
    const lombada = document.querySelector(`[data-livro-id="${CSS.escape(livroId)}"]`)
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!livro || !lombada || semMovimento) {
      void navegar(`/livro/${livroId}`, { replace: true })
      return
    }
    setAbrindo({
      livro,
      geometria: geometriaDaAbertura(
        lombada.getBoundingClientRect(),
        window.innerWidth,
        window.innerHeight,
      ),
    })
  }

  const selecionadoId = painel && painel.tipo !== 'lugar' ? painel.livroId : null
  const lugarEscolhido =
    painel?.tipo === 'lugar' ? { prateleira: painel.prateleira, lugar: painel.lugar } : null

  return (
    <div className="animar-entrada flex flex-col gap-5">
      {/* A altura mínima é a tela inteira menos o respiro do `<main>` (0px no
          topo, 24px embaixo, ver App.tsx): o `mt-auto` empurra a contagem até
          a mesma altura do botão de criar (h-14, como .dial-botao).

          Só abaixo de 1024 px: no desktop não existe dial para alinhar (a
          navegação é a coluna fixa — ver Dial.tsx). */}
      <div className="flex min-h-[calc(100dvh_-_24px_-_env(safe-area-inset-bottom))] flex-col lg:min-h-0">
        <Movel
          estante={estante}
          vagas={vagas}
          pontes={pontes}
          selecionadoId={selecionadoId}
          lugarEscolhido={lugarEscolhido}
          abrindoId={abrindoAgora?.livro.id ?? null}
          chegandoId={chegandoId}
          quantidadeDePrateleiras={quantidadeDePrateleiras}
          intensidadeDaLuz={intensidadeDaLuz}
          onEspiar={(livroId) => {
            // Um espiar novo nunca herda a abertura de um anterior que foi
            // desistida no meio — senão ela recomeçaria sozinha.
            setAbrindo(null)
            abrir({ tipo: 'espiar', livroId })
          }}
          onAcoes={(livroId) => {
            abrir({ tipo: 'acoes', livroId })
          }}
          onMover={(livroId, prateleira, lugar) => {
            void moverLivro(livroId, prateleira, lugar)
          }}
          onNovo={(prateleira, lugar) => {
            void navegar(`/novo-livro?prateleira=${String(prateleira)}&lugar=${String(lugar)}`)
          }}
          onAcoesDoLugar={(prateleira, lugar) => {
            abrir({ tipo: 'lugar', prateleira, lugar })
          }}
        />

        <div className="mt-auto flex h-14 items-center gap-3">
          {/* O botão vem antes do texto, e não depois: o botão de criar
              (Dial) mora fixo no canto inferior direito, e um botão
              colocado depois de um `flex-1` acaba empurrado até lá —
              ficaria atrás dele, inalcançável. */}
          <Link
            to="/busca"
            aria-label="Buscar"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
          <p className="text-poeira min-w-0 flex-1 truncate text-xs">
            {carregado
              ? `${contar(livros.length, 'livro', 'livros')} · ${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')}`
              : 'Abrindo o palácio…'}
          </p>
        </div>
      </div>

      <PaineisDaEstante
        // Enquanto o livro sai da estante a folha some, mas a URL continua no
        // espiar: quem troca de tela é o fim da animação, com `replace`, e o
        // voltar do livro cai na estante como antes.
        painel={abrindoAgora ? null : painel}
        livros={livros}
        vagas={vagas}
        quantidadeDePrateleiras={quantidadeDePrateleiras}
        neuronios={neuronios}
        pontes={pontes}
        ocupado={ocupado}
        onFechar={fechar}
        onTrocarPainel={trocar}
        onApagar={apagarLivro}
        onAbrirLivro={abrirLivro}
        onTirarEnfeite={tirarEnfeite}
        onPorEnfeite={porEnfeite}
      />

      {abrindoAgora && (
        <AberturaDoLivro
          livro={abrindoAgora.livro}
          geometria={abrindoAgora.geometria}
          onAberto={() => {
            void navegar(`/livro/${abrindoAgora.livro.id}`, { replace: true })
          }}
        />
      )}
    </div>
  )
}
