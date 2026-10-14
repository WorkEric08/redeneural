import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { EstadoVazio } from '@/components/EstadoVazio'
import { useTemaPadrao } from '@/hooks/useTemaPadrao'
import { buscar } from '@/features/busca/buscar'
import { ROTULO_DO_PORTO } from '@/features/porto/porto'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/** Quantos pensamentos recentes a tela mostra antes de alguém digitar. */
const RECENTES = 8

/**
 * Busca **só por palavra exata** (15/10/2026), sobre o que a store já tem em
 * memória (`buscar.ts`). A busca por sentido — a frase passando pelo modelo — e
 * o seletor entre os dois jeitos saíram a pedido do usuário.
 *
 * Tem dois escopos (15/10/2026), escolhidos por quem abre a tela:
 * - **Busca global** (`/busca`) — o palácio inteiro: livros pelo título,
 *   pensamentos pelo título ou pelo conteúdo inteiro. Abre da estante, da Rede e
 *   das telas que não são de um livro.
 * - **Buscar local** (`/busca?livro=<id>`) — só os pensamentos daquele livro, que
 *   abre da lupa de dentro do livro (comum ou executável). Não lista livros.
 *
 * Com o campo vazio a tela não fica em branco: mostra os últimos pensamentos
 * escritos (17/09/2026). É a única tela do app que responde "o que eu escrevi
 * por último" — a estante é por assunto, a Rede é por significado, e o livro
 * só mostra o que está dentro dele. A lista já chega ordenada do repositório
 * (ver `porMaisRecente` em dexieRepo.ts), então aqui é só recortar.
 */
export default function Busca() {
  const { livros, neuronios } = usePalacio()
  const [consulta, setConsulta] = useState('')
  const padrao = useTemaPadrao()

  // Quem abriu a busca a partir da Rede quer voltar pra lá com a câmera no
  // pensamento, não abrir a tela dele — o link do resultado muda de destino,
  // o resto da busca é o mesmo de sempre.
  const [busca] = useSearchParams()
  const daRede = busca.get('de') === 'rede'
  // Escopo local: só os pensamentos do livro de onde a lupa foi tocada.
  const livroLocal = busca.get('livro')
  const local = livroLocal !== null
  const doEscopo = useMemo(
    () => (local ? neuronios.filter((n) => n.livroId === livroLocal) : neuronios),
    [local, livroLocal, neuronios],
  )

  const porPalavra = useMemo(
    () => buscar(consulta, local ? [] : livros, doEscopo),
    [consulta, local, livros, doEscopo],
  )

  const recentes = useMemo(() => doEscopo.slice(0, RECENTES), [doEscopo])
  const livroPorId = useMemo(() => new Map(livros.map((l) => [l.id, l])), [livros])

  /** Quem veio da Rede volta para lá com a câmera no pensamento, não para a ficha. */
  const destinoDo = (id: string): string => (daRede ? `/rede?centralizar=${id}` : `/neuronio/${id}`)

  const termo = consulta.trim()
  const rotuloDoCampo = local ? 'Buscar neste livro' : 'Buscar na rede'

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
      placeholder={local ? 'Buscar neste livro…' : 'Título ou conteúdo…'}
      aria-label={rotuloDoCampo}
    />
  )

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara={local ? `/livro/${livroLocal}` : '/'}
        titulo={
          padrao ? (
            <label className="pd-busca-campo">
              <Search size={18} aria-hidden />
              {campo}
            </label>
          ) : local ? (
            'Buscar local'
          ) : (
            'Busca global'
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
              placeholder={local ? 'Buscar neste livro…' : 'Título ou conteúdo…'}
              aria-label={rotuloDoCampo}
              className="campo h-13 px-4 text-lg"
            />
          )}
        </div>

        {termo === '' ? (
          recentes.length === 0 ? (
            <p className="text-poeira px-1 text-sm">
              {local
                ? 'Este livro ainda não tem pensamentos.'
                : 'Busca em livros e pensamentos, pelo título ou pelo conteúdo.'}
            </p>
          ) : (
            <section>
              <h2 className="rotulo-de-secao">
                {padrao ? (
                  <>
                    <span>Escritos por último</span>
                    <span>{contar(recentes.length, 'pensamento', 'pensamentos')}</span>
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
                      local
                        ? undefined
                        : n.livroId === null
                          ? ROTULO_DO_PORTO
                          : livroPorId.get(n.livroId)?.titulo
                    }
                    cor={n.livroId === null ? undefined : livroPorId.get(n.livroId)?.cor}
                    conteudo={n.conteudo}
                    padrao={padrao}
                  />
                ))}
              </ul>
            </section>
          )
        ) : porPalavra.length === 0 ? (
          padrao ? (
            <EstadoVazio
              icone={<Search size={28} aria-hidden />}
              titulo="Nada encontrado"
              texto="Tente outras palavras."
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
                  abaixo={
                    local
                      ? r.trecho
                      : `${r.livro?.titulo ?? ROTULO_DO_PORTO}${r.trecho ? ` · ${r.trecho}` : ''}`
                  }
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
