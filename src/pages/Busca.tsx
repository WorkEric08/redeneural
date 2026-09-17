import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { buscar } from '@/features/busca/buscar'
import { usePalacio } from '@/store/palacio'

/** Quantos neurônios recentes a tela mostra antes de alguém digitar. */
const RECENTES = 8

/**
 * Busca no palácio inteiro — livros pelo título, neurônios pelo título ou
 * conteúdo. Sobre o que a store já tem em memória (`buscar.ts`), então digitar
 * responde na hora, sem tocar o banco.
 *
 * Com o campo vazio a tela não fica em branco: mostra os últimos neurônios
 * escritos (17/09/2026). É a única tela do app que responde "o que eu escrevi
 * por último" — a estante é por assunto, a Rede é por significado, e o livro
 * só mostra o que está dentro dele. A lista já chega ordenada do repositório
 * (ver `porMaisRecente` em dexieRepo.ts), então aqui é só recortar.
 */
export default function Busca() {
  const { livros, neuronios } = usePalacio()
  const [consulta, setConsulta] = useState('')

  // Quem abriu a busca a partir da Rede quer voltar pra lá com a câmera no
  // neurônio, não abrir a tela dele — o link do resultado muda de destino,
  // o resto da busca é o mesmo de sempre.
  const [busca] = useSearchParams()
  const daRede = busca.get('de') === 'rede'

  const resultados = useMemo(
    () => buscar(consulta, livros, neuronios),
    [consulta, livros, neuronios],
  )

  const recentes = useMemo(() => neuronios.slice(0, RECENTES), [neuronios])
  const livroPorId = useMemo(() => new Map(livros.map((l) => [l.id, l])), [livros])

  /** Quem veio da Rede volta para lá com a câmera no neurônio, não para a ficha. */
  const destinoDo = (id: string): string => (daRede ? `/rede?centralizar=${id}` : `/neuronio/${id}`)

  return (
    <div className="flex flex-col">
      <BarraDeTopo voltarPara="/" titulo="Buscar" />

      <div className="animar-entrada flex flex-col gap-4 pt-5">
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
          placeholder="Título ou conteúdo…"
          aria-label="Buscar no palácio"
          className="campo h-13 px-4 text-lg"
        />

        {consulta.trim() === '' ? (
          recentes.length === 0 ? (
            <p className="text-poeira px-1 text-sm">
              Busca em livros e neurônios, pelo título ou pelo conteúdo.
            </p>
          ) : (
            <section>
              <h2 className="rotulo-de-secao">Escritos por último</h2>
              <ul className="cartao flex flex-col">
                {recentes.map((n) => (
                  <LinhaDeNeuronio
                    key={n.id}
                    para={destinoDo(n.id)}
                    titulo={n.titulo}
                    abaixo={livroPorId.get(n.livroId)?.titulo}
                  />
                ))}
              </ul>
            </section>
          )
        ) : resultados.length === 0 ? (
          <p className="text-poeira px-1 text-sm">Nada encontrado para “{consulta.trim()}”.</p>
        ) : (
          <ul className="cartao flex flex-col">
            {resultados.map((r) =>
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
                  abaixo={`${r.livro?.titulo ?? ''}${r.trecho ? ` · ${r.trecho}` : ''}`}
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
}: {
  para: string
  titulo: string
  // `| undefined` explícito: o tsconfig usa `exactOptionalPropertyTypes`, e o
  // livro de um recente pode não ser encontrado.
  abaixo?: string | undefined
}) {
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
