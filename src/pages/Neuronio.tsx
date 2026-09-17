import { PencilLine, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Confirmacao } from '@/components/Confirmacao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { Folha } from '@/components/Folha'
import type { NeuronioNaTela } from '@/core'
import { vizinhosPorNeuronio } from '@/features/estante/resumo'
import { TextoComLinks } from '@/features/neuronio/TextoComLinks'
import { usePalacio } from '@/store/palacio'

/** O que a confirmação guarda no histórico para saber como sair depois de apagar. */
interface EstadoDaConfirmacao {
  /** A tela do neurônio tem uma tela antes dela dentro do app. */
  temDeOndeVeio: boolean
}

/**
 * Um neurônio e o que ele encontrou.
 *
 * O aviso de "conectou com…" morou aqui até 17/09/2026 — quem entrega esse
 * momento agora é a Rede, com uma animação (ver `revelar` em Tela.tsx e
 * `Novo.tsx`), então esta tela nunca mais é o destino de logo-depois-de-criar.
 *
 * Apagar pergunta antes, numa folha que mora na URL (`?apagar=1`), pelo mesmo
 * motivo dos painéis da estante: voltar fecha a pergunta.
 */
export default function Neuronio() {
  const { neuronioId } = useParams()
  const [busca] = useSearchParams()
  const localizacao = useLocation()
  const { key } = localizacao
  const navegar = useNavigate()
  const { livros, neuronios, conexoes, carregado, ocupado, apagarNeuronio } = usePalacio()

  // O apagado continua desenhado o instante entre o motor responder e a
  // navegação sair daqui — senão piscaria "não existe mais" e a folha sumiria
  // sem animação. Os fios vão junto: a frase da folha não pode mudar enquanto
  // ela diz "Apagando…".
  const [apagando, setApagando] = useState<{ neuronio: NeuronioNaTela; fios: number } | null>(null)
  const neuronio =
    neuronios.find((n) => n.id === neuronioId) ??
    (apagando !== null && apagando.neuronio.id === neuronioId ? apagando.neuronio : undefined)
  const livro = livros.find((l) => l.id === neuronio?.livroId)

  const vizinhos = useMemo(
    () => vizinhosPorNeuronio(neuronios, livros, conexoes),
    [neuronios, livros, conexoes],
  )

  if (!neuronio) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo
          voltarPara="/"
          titulo="Neurônio"
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
        <p className="text-poeira pt-6 text-sm">
          {carregado ? 'Este neurônio não existe mais.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  const meus = vizinhos.get(neuronio.id) ?? []
  const fios = apagando?.fios ?? meus.length
  const perguntando = busca.get('apagar') === '1'
  const saida = livro ? `/livro/${livro.id}` : '/'

  function perguntar(): void {
    const proxima = new URLSearchParams(busca)
    proxima.set('apagar', '1')
    const estado: EstadoDaConfirmacao = { temDeOndeVeio: key !== 'default' }
    void navegar({ search: `?${proxima.toString()}` }, { state: estado })
  }

  function desistir(): void {
    // O React Router chama de 'default' a primeira entrada da sessão: sem casa
    // para voltar, a pergunta sai da URL no lugar.
    if (key === 'default') {
      const proxima = new URLSearchParams(busca)
      proxima.delete('apagar')
      const resto = proxima.toString()
      void navegar({ search: resto ? `?${resto}` : '' }, { replace: true })
    } else {
      void navegar(-1)
    }
  }

  function apagar(alvo: NeuronioNaTela): void {
    const veioDeAlgumLugar =
      key !== 'default' && (localizacao.state as EstadoDaConfirmacao | null)?.temDeOndeVeio === true

    setApagando({ neuronio: alvo, fios })
    void apagarNeuronio(alvo.id).then((ok) => {
      if (!ok) {
        setApagando(null)
        return
      }
      // Tira a pergunta e a tela do apagado do histórico de uma vez: voltar
      // depois disso não pode cair num neurônio que não existe mais. Sem tela
      // anterior dentro do app, o livro dele é o lugar óbvio.
      if (veioDeAlgumLugar) void navegar(-2)
      else void navegar(saida, { replace: true })
    })
  }

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara={saida}
        titulo={
          livro ? (
            <Link
              to={`/livro/${livro.id}`}
              className="flex min-w-0 items-center gap-2.5 rounded-lg py-2 pr-2"
            >
              <span
                className="h-5 w-1 shrink-0 rounded-full"
                style={{ background: livro.cor }}
                aria-hidden
              />
              <span className="truncate">{livro.titulo}</span>
            </Link>
          ) : (
            'Neurônio'
          )
        }
        acoes={
          <>
            <Link
              to="/busca"
              aria-label="Buscar"
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <Search size={20} aria-hidden />
            </Link>
            <Link
              to={`/neuronio/${neuronio.id}/editar`}
              aria-label="Editar"
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <PencilLine size={20} aria-hidden />
            </Link>
            {/* Apagar durante um processamento deixaria o motor gravando o
                vetor de quem não existe mais. */}
            <button
              type="button"
              aria-label="Apagar"
              disabled={ocupado}
              onClick={perguntar}
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <Trash2 size={20} aria-hidden />
            </button>
          </>
        }
      />

      <article className="animar-entrada flex flex-col gap-6 pt-5">
        <header className="flex flex-col items-start gap-2.5 px-1">
          <h1 className="texto-do-usuario font-titulo text-[1.75rem] leading-tight font-semibold tracking-tight text-balance">
            {neuronio.titulo}
          </h1>
          {neuronio.processando && <EtiquetaProcessando texto="procurando conexões" />}
        </header>

        {neuronio.conteudo && (
          <TextoComLinks
            texto={neuronio.conteudo}
            className="texto-do-usuario px-1 text-[1.03rem] leading-[1.7] whitespace-pre-wrap"
          />
        )}
      </article>

      <Folha aberta={perguntando} rotulo={`Apagar ${neuronio.titulo}`} onFechar={desistir}>
        <Confirmacao
          titulo={`Apagar “${neuronio.titulo}”?`}
          explicacao={
            fios > 0
              ? `${fios === 1 ? 'O fio que sai dele vai' : `Os ${String(fios)} fios que saem dele vão`} junto, e o palácio refaz as conexões de quem fica. Não dá para desfazer.`
              : 'Ele ainda não tem fios. Não dá para desfazer.'
          }
          rotulo="Apagar"
          rotuloOcupado="Apagando…"
          ocupado={ocupado}
          onCancelar={desistir}
          onConfirmar={() => {
            apagar(neuronio)
          }}
        />
      </Folha>
    </div>
  )
}
