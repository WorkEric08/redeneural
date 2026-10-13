import { Search, Sparkles, WholeWord } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { EstadoVazio } from '@/components/EstadoVazio'
import { useTemaPadrao } from '@/hooks/useTemaPadrao'
import { buscar, resultadosPorSentido } from '@/features/busca/buscar'
import { useBuscaPorSentido } from '@/features/busca/useBuscaPorSentido'
import { ROTULO_DO_PORTO } from '@/features/porto/porto'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/** Quantos neurônios recentes a tela mostra antes de alguém digitar. */
const RECENTES = 8

/**
 * Busca no palácio inteiro, de dois jeitos (30/09/2026):
 *
 * - **Por sentido** — o padrão. A frase passa pelo mesmo modelo que lê os
 *   neurônios, e voltam os que se parecem com ela mesmo sem dividir uma
 *   palavra (`buscarPorSentido`, no núcleo, dentro do Worker).
 * - **Palavra exata** — livros pelo título, neurônios pelo título ou pelo
 *   conteúdo inteiro, sobre o que a store já tem em memória (`buscar.ts`). É a
 *   que garante achar um trecho do fim de um texto longo: o modelo só lê os
 *   primeiros 2500 caracteres.
 *
 * Abre no último modo que a pessoa escolheu (pedido do usuário, 30/09/2026) —
 * gravado como preferência do palácio, como a luz da estante. Quem nunca
 * escolheu começa em "Por sentido".
 *
 * Com o campo vazio a tela não fica em branco: mostra os últimos neurônios
 * escritos (17/09/2026). É a única tela do app que responde "o que eu escrevi
 * por último" — a estante é por assunto, a Rede é por significado, e o livro
 * só mostra o que está dentro dele. A lista já chega ordenada do repositório
 * (ver `porMaisRecente` em dexieRepo.ts), então aqui é só recortar.
 */
export default function Busca() {
  const { livros, neuronios, modoDaBusca: modo, definirModoDaBusca } = usePalacio()
  const [consulta, setConsulta] = useState('')
  const padrao = useTemaPadrao()

  // Quem abriu a busca a partir da Rede quer voltar pra lá com a câmera no
  // neurônio, não abrir a tela dele — o link do resultado muda de destino,
  // o resto da busca é o mesmo de sempre.
  const [busca] = useSearchParams()
  const daRede = busca.get('de') === 'rede'

  const porPalavra = useMemo(
    () => (modo === 'exata' ? buscar(consulta, livros, neuronios) : []),
    [modo, consulta, livros, neuronios],
  )
  const sentido = useBuscaPorSentido(consulta, modo === 'sentido')
  const porSentido = useMemo(
    () => (sentido.ids ? resultadosPorSentido(sentido.ids, livros, neuronios) : []),
    [sentido.ids, livros, neuronios],
  )

  const recentes = useMemo(() => neuronios.slice(0, RECENTES), [neuronios])
  const livroPorId = useMemo(() => new Map(livros.map((l) => [l.id, l])), [livros])

  /** Quem veio da Rede volta para lá com a câmera no neurônio, não para a ficha. */
  const destinoDo = (id: string): string => (daRede ? `/rede?centralizar=${id}` : `/neuronio/${id}`)

  const termo = consulta.trim()

  const campo = (
    <input
      type="search"
      value={consulta}
      onChange={(evento) => {
        setConsulta(evento.target.value)
      }}
      autoFocus
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="search"
      placeholder={modo === 'sentido' ? 'Descreva o que procura…' : 'Título ou conteúdo…'}
      aria-label="Buscar no palácio"
    />
  )

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara="/"
        titulo={
          padrao ? (
            <label className="pd-busca-campo">
              <Search size={18} aria-hidden />
              {campo}
            </label>
          ) : (
            'Buscar'
          )
        }
      />

      <div className="animar-entrada pd-conteudo flex flex-col gap-4 pt-5">
        <div className="flex flex-col gap-2.5">
          {!padrao && (
            <input
              type="search"
              value={consulta}
              onChange={(evento) => {
                setConsulta(evento.target.value)
              }}
              // O ponto inteiro desta tela é digitar assim que ela abre — diferente
              // da folha, que evita autofoco para não abrir o teclado sem pedido.
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder={modo === 'sentido' ? 'Descreva o que procura…' : 'Título ou conteúdo…'}
              aria-label="Buscar no palácio"
              className="campo h-13 px-4 text-lg"
            />
          )}

          <div role="group" aria-label="Como buscar" className="flex gap-2">
            <button
              type="button"
              aria-pressed={modo === 'sentido'}
              onClick={() => {
                void definirModoDaBusca('sentido')
              }}
              className="chip"
            >
              {!padrao && <Sparkles size={15} aria-hidden />}
              Por sentido
            </button>
            <button
              type="button"
              aria-pressed={modo === 'exata'}
              onClick={() => {
                void definirModoDaBusca('exata')
              }}
              className="chip"
            >
              {!padrao && <WholeWord size={15} aria-hidden />}
              Palavra exata
            </button>
          </div>
        </div>

        {termo === '' ? (
          recentes.length === 0 ? (
            <p className="text-poeira px-1 text-sm">
              Busca em livros e neurônios, pelo título ou pelo conteúdo.
            </p>
          ) : (
            <section>
              <h2 className="rotulo-de-secao">
                {padrao ? (
                  <>
                    <span>Escritos por último</span>
                    <span>{contar(recentes.length, 'neurônio', 'neurônios')}</span>
                  </>
                ) : (
                  'Escritos por último'
                )}
              </h2>
              <ul className={padrao ? 'pd-resultados' : 'cartao flex flex-col'}>
                {recentes.map((n) => (
                  <LinhaDeNeuronio
                    key={n.id}
                    para={destinoDo(n.id)}
                    titulo={n.titulo}
                    abaixo={
                      n.livroId === null ? ROTULO_DO_PORTO : livroPorId.get(n.livroId)?.titulo
                    }
                    cor={n.livroId === null ? undefined : livroPorId.get(n.livroId)?.cor}
                    conteudo={n.conteudo}
                    padrao={padrao}
                  />
                ))}
              </ul>
            </section>
          )
        ) : modo === 'sentido' ? (
          sentido.falhou ? (
            <p className="text-poeira px-1 text-sm">
              Não deu para buscar por sentido agora. A palavra exata continua funcionando.
            </p>
          ) : porSentido.length === 0 ? (
            padrao && !sentido.procurando ? (
              <EstadoVazio
                icone={<Search size={28} aria-hidden />}
                titulo="Nada encontrado"
                texto="Tente outras palavras ou mude para “Palavra exata”."
              />
            ) : (
              <p className="text-poeira px-1 text-sm" aria-live="polite">
                {sentido.procurando ? 'Procurando…' : `Nada parecido com “${termo}”.`}
              </p>
            )
          ) : (
            // Enquanto a consulta nova não volta, a lista da anterior fica — mais
            // apagada, em vez de piscar a cada tecla.
            <div>
              {padrao && (
                <h2 className="rotulo-de-secao">
                  <span>Resultados</span>
                  <span>{contar(porSentido.length, 'neurônio', 'neurônios')}</span>
                </h2>
              )}
              <ul
                aria-busy={sentido.procurando}
                className={`${padrao ? 'pd-resultados' : 'cartao flex flex-col'} transition-opacity ${sentido.procurando ? 'opacity-60' : ''}`}
              >
                {porSentido.map((r) => (
                  <LinhaDeNeuronio
                    key={r.neuronio.id}
                    para={destinoDo(r.neuronio.id)}
                    titulo={r.neuronio.titulo}
                    abaixo={`${r.livro?.titulo ?? ROTULO_DO_PORTO}${r.trecho ? ` · ${r.trecho}` : ''}`}
                    cor={r.livro?.cor}
                    conteudo={r.neuronio.conteudo}
                    padrao={padrao}
                  />
                ))}
              </ul>
            </div>
          )
        ) : porPalavra.length === 0 ? (
          padrao ? (
            <EstadoVazio
              icone={<Search size={28} aria-hidden />}
              titulo="Nada encontrado"
              texto="Tente outras palavras ou mude para “Por sentido”."
            />
          ) : (
            <p className="text-poeira px-1 text-sm">Nada encontrado para “{termo}”.</p>
          )
        ) : (
          <ul className={padrao ? 'pd-resultados' : 'cartao flex flex-col'}>
            {porPalavra.map((r) =>
              r.tipo === 'livro' ? (
                <li key={`livro-${r.livro.id}`} className="linha-de-lista p-0">
                  <Link
                    to={`/livro/${r.livro.id}`}
                    className="flex min-h-14 w-full items-center gap-3 px-4"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ background: r.livro.cor }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium">
                      {r.livro.titulo}
                    </span>
                    <span className="text-poeira shrink-0 text-xs">Livro</span>
                  </Link>
                </li>
              ) : (
                <LinhaDeNeuronio
                  key={`neuronio-${r.neuronio.id}`}
                  para={destinoDo(r.neuronio.id)}
                  titulo={r.neuronio.titulo}
                  abaixo={`${r.livro?.titulo ?? ROTULO_DO_PORTO}${r.trecho ? ` · ${r.trecho}` : ''}`}
                  cor={r.livro?.cor}
                  conteudo={r.neuronio.conteudo}
                  padrao={padrao}
                />
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

/** A mesma linha serve para um resultado e para um recente — só muda o que vem abaixo do título. */
function LinhaDeNeuronio({
  para,
  titulo,
  abaixo,
  cor,
  conteudo,
  padrao,
}: {
  para: string
  titulo: string
  // `| undefined` explícito: o tsconfig usa `exactOptionalPropertyTypes`, e o
  // livro de um recente pode não ser encontrado.
  abaixo?: string | undefined
  cor?: string | undefined
  conteudo?: string | undefined
  padrao?: boolean
}) {
  // O Padrão (pranchas "Busca"): o título, o livro com a marca da cor e o começo do texto.
  if (padrao === true) {
    return (
      <li className="pd-resultado">
        <Link to={para}>
          <span className="pd-resultado-titulo texto-do-usuario">{titulo}</span>
          {abaixo !== undefined && abaixo !== '' && (
            <span className="pd-resultado-meta">
              <span
                className="pd-ponto-livro"
                style={{ background: cor ?? 'var(--linha)' }}
                aria-hidden
              />
              {abaixo}
            </span>
          )}
          {conteudo !== undefined && conteudo !== '' && (
            <span className="pd-resultado-texto">{conteudo}</span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <li className="linha-de-lista p-0">
      <Link
        to={para}
        className="flex min-h-14 w-full min-w-0 flex-col justify-center gap-0.5 px-4 py-2.5"
      >
        <span className="truncate text-[0.95rem] font-medium">{titulo}</span>
        {abaixo !== undefined && abaixo !== '' && (
          <span className="text-poeira truncate text-xs">{abaixo}</span>
        )}
      </Link>
    </li>
  )
}
