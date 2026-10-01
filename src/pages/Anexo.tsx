import { ExternalLink, PencilLine, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Confirmacao } from '@/components/Confirmacao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { Folha } from '@/components/Folha'
import type { AnexoNaTela } from '@/core'
import { dominioDe, miniaturaDoLink } from '@/features/acervo/links'
import { Miniatura } from '@/features/acervo/Miniatura'
import { conceitosPorAnexo, situacaoDoAnexo } from '@/features/acervo/resumo'
import { TextoComLinks } from '@/features/neuronio/TextoComLinks'
import { ROTULO_DO_PORTO } from '@/features/porto/porto'
import { usePalacio } from '@/store/palacio'

/** O que a confirmação guarda no histórico para saber como sair depois de apagar. */
interface EstadoDaConfirmacao {
  temDeOndeVeio: boolean
}

const EXPLICACAO: Record<'sem-legenda' | 'solto', string> = {
  'sem-legenda': 'Sem legenda, este item fica só na pasta — não aparece na Rede.',
  solto:
    'Nada no palácio se parece com a legenda ainda. Fica só na pasta até aparecer um conceito parecido.',
}

/**
 * Um item de uma pasta: a imagem inteira ou o link, a legenda, e os conceitos
 * que ele escolheu — cada um levando à tela do neurônio.
 *
 * Apagar pergunta numa folha que mora na URL (`?apagar=1`), como na tela do
 * neurônio, e pelo mesmo motivo: voltar fecha a pergunta. Apagar um anexo não
 * reprocessa nada — nenhum conceito dependia dele.
 */
export default function Anexo() {
  const { anexoId } = useParams()
  const [busca] = useSearchParams()
  const localizacao = useLocation()
  const { key } = localizacao
  const navegar = useNavigate()
  const { livros, anexos, vinculos, neuronios, carregado, ocupado, apagarAnexo } = usePalacio()

  // O apagado continua desenhado o instante entre o motor responder e a
  // navegação sair daqui, como na tela do neurônio.
  const [apagando, setApagando] = useState<AnexoNaTela | null>(null)
  const anexo =
    anexos.find((a) => a.id === anexoId) ?? (apagando?.id === anexoId ? apagando : undefined)
  const pasta = livros.find((l) => l.id === anexo?.livroId)
  const conceitos = useMemo(
    () => (anexo ? (conceitosPorAnexo(vinculos, neuronios).get(anexo.id) ?? []) : []),
    [anexo, vinculos, neuronios],
  )

  if (!anexo) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo voltarPara="/" titulo="Item" />
        <p className="text-poeira pt-6 text-sm">
          {carregado ? 'Este item não existe mais.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  const saida = pasta ? `/livro/${pasta.id}` : '/'
  const perguntando = busca.get('apagar') === '1'
  const situacao = situacaoDoAnexo(anexo, conceitos)
  const livroDe = new Map(livros.map((l) => [l.id, l]))

  function perguntar(): void {
    const proxima = new URLSearchParams(busca)
    proxima.set('apagar', '1')
    const estado: EstadoDaConfirmacao = { temDeOndeVeio: key !== 'default' }
    void navegar({ search: `?${proxima.toString()}` }, { state: estado })
  }

  function desistir(): void {
    if (key === 'default') {
      const proxima = new URLSearchParams(busca)
      proxima.delete('apagar')
      const resto = proxima.toString()
      void navegar({ search: resto ? `?${resto}` : '' }, { replace: true })
    } else {
      void navegar(-1)
    }
  }

  function apagar(alvo: AnexoNaTela): void {
    const veioDeAlgumLugar =
      key !== 'default' && (localizacao.state as EstadoDaConfirmacao | null)?.temDeOndeVeio === true

    setApagando(alvo)
    void apagarAnexo(alvo.id).then((ok) => {
      if (!ok) {
        setApagando(null)
        return
      }
      // Tira a pergunta e a tela do apagado do histórico de uma vez — o mesmo
      // da tela do neurônio.
      if (veioDeAlgumLugar) void navegar(-2)
      else void navegar(saida, { replace: true })
    })
  }

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara={saida}
        titulo={
          pasta ? (
            <Link
              to={`/livro/${pasta.id}`}
              className="flex min-w-0 items-center gap-2.5 rounded-lg py-2 pr-2"
            >
              <span
                className="h-5 w-1 shrink-0 rounded-full"
                style={{ background: pasta.cor }}
                aria-hidden
              />
              <span className="truncate">{pasta.titulo}</span>
            </Link>
          ) : (
            'Item'
          )
        }
        acoes={
          <>
            <Link
              to={`/anexo/${anexo.id}/editar`}
              aria-label="Editar"
              className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
            >
              <PencilLine size={20} aria-hidden />
            </Link>
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
        {anexo.midia.tipo === 'imagem' ? (
          <Miniatura anexo={anexo} tamanho="inteira" className="max-h-[70dvh] w-full rounded-2xl" />
        ) : (
          <div className="cartao flex flex-col">
            {/* Sem miniatura (link que não é vídeo), a caixa só repetiria o
                domínio que a linha de baixo já diz. */}
            {miniaturaDoLink(anexo.midia.url) && (
              <Miniatura anexo={anexo} className="aspect-video w-full" />
            )}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-poeira min-w-0 flex-1 truncate text-sm">
                {dominioDe(anexo.midia.url)}
              </span>
              <a
                href={anexo.midia.url}
                target="_blank"
                rel="noopener noreferrer"
                className={botao({ tipo: 'primario', tamanho: 'pequeno' })}
              >
                <ExternalLink size={16} aria-hidden />
                Abrir
              </a>
            </div>
          </div>
        )}

        {anexo.legenda ? (
          <TextoComLinks
            texto={anexo.legenda}
            className="texto-do-usuario px-1 text-[1.03rem] leading-[1.7] whitespace-pre-wrap"
          />
        ) : (
          <p className="text-poeira px-1 text-sm italic">Sem legenda</p>
        )}

        <section>
          <h2 className="rotulo-de-secao">Combina com</h2>
          {situacao === 'processando' && (
            <div className="px-1">
              <EtiquetaProcessando texto="procurando conceitos" />
            </div>
          )}
          {(situacao === 'sem-legenda' || situacao === 'solto') && (
            <p className="text-poeira px-1 text-sm leading-relaxed">{EXPLICACAO[situacao]}</p>
          )}
          {situacao === 'preso' && (
            <ul className="cartao flex flex-col">
              {conceitos.map((c) => {
                const livroDoConceito = c.livroId === null ? undefined : livroDe.get(c.livroId)
                return (
                  <li key={c.id} className="linha-de-lista p-0">
                    <Link
                      to={`/neuronio/${c.id}`}
                      className="flex min-h-14 w-full items-center gap-3 px-4"
                    >
                      <span
                        className="h-6 w-1 shrink-0 rounded-full"
                        style={{ background: livroDoConceito?.cor }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{c.titulo}</span>
                        <span className="text-poeira block truncate text-xs">
                          {livroDoConceito?.titulo ?? ROTULO_DO_PORTO}
                        </span>
                      </span>
                      <span className="text-poeira font-dado text-xs tabular-nums">
                        {String(Math.round(c.score * 100))}%
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </article>

      <Folha aberta={perguntando} rotulo="Apagar este item" onFechar={desistir}>
        <Confirmacao
          titulo="Apagar este item?"
          explicacao={
            anexo.midia.tipo === 'imagem'
              ? 'A imagem sai da pasta e do aparelho. Nenhum conceito muda. Não dá para desfazer.'
              : 'O link sai da pasta. Nenhum conceito muda. Não dá para desfazer.'
          }
          rotulo="Apagar"
          rotuloOcupado="Apagando…"
          ocupado={ocupado}
          onCancelar={desistir}
          onConfirmar={() => {
            apagar(anexo)
          }}
        />
      </Folha>
    </div>
  )
}
