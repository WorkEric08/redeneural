import { Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { restantesNaPasta, type AnexoNaTela, type Livro, type TipoDeItem } from '@/core'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

import { dominioDe } from './links'
import { Miniatura } from './Miniatura'
import { conceitosPorAnexo, situacaoDoAnexo, type ConceitoDoAnexo } from './resumo'

/**
 * Uma pasta de acervo aberta: as imagens dela numa grade e os links numa lista.
 *
 * Cabem 8 imagens e 8 links (07/10/2026). A tela não desenha os oito lugares: cada
 * seção termina com um só "+", que diz quantos ainda cabem — o número desce a cada
 * item guardado, e o "+" some quando a seção enche.
 *
 * **Grade também no celular** (2 colunas), divergindo do §6 do mestre, que
 * pede lista vertical abaixo de 768 px — aprovado no plano de 24/09/2026: imagem em
 * fila única de cartões largos vira uma rolagem sem fim de uma foto por tela. Os
 * links, que não têm o que ver, vão em lista.
 *
 * Cada item diz com que conceitos o anexo combinou, ou que ele fica só na
 * pasta — é o que explica por que ele aparece (ou não) na Rede.
 */
export function Pasta({ livro }: { livro: Livro }) {
  const { anexos, vinculos, neuronios } = usePalacio()

  const meus = useMemo(() => anexos.filter((a) => a.livroId === livro.id), [anexos, livro.id])
  const imagens = useMemo(() => meus.filter((a) => a.midia.tipo === 'imagem'), [meus])
  const links = useMemo(() => meus.filter((a) => a.midia.tipo === 'link'), [meus])
  const conceitos = useMemo(() => conceitosPorAnexo(vinculos, neuronios), [vinculos, neuronios])
  const restantes = useMemo(() => restantesNaPasta(anexos, livro.id), [anexos, livro.id])

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

      <div className="animar-entrada flex flex-col gap-6 pt-5">
        <section aria-labelledby="pasta-imagens" className="flex flex-col">
          <h2 id="pasta-imagens" className="rotulo-de-secao">
            Imagens
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {imagens.map((a) => (
              <li key={a.id}>
                <CartaoDaImagem anexo={a} conceitos={conceitos.get(a.id) ?? []} />
              </li>
            ))}
            {restantes.imagem > 0 && (
              <li>
                <Adicionar livroId={livro.id} tipo="imagem" restantes={restantes.imagem} />
              </li>
            )}
          </ul>
        </section>

        <section aria-labelledby="pasta-links" className="flex flex-col">
          <h2 id="pasta-links" className="rotulo-de-secao">
            Links
          </h2>
          <ul className="flex flex-col gap-2">
            {links.map((a) => (
              <li key={a.id}>
                <LinhaDoLink anexo={a} conceitos={conceitos.get(a.id) ?? []} />
              </li>
            ))}
            {restantes.link > 0 && (
              <li>
                <Adicionar livroId={livro.id} tipo="link" restantes={restantes.link} />
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}

const NOME_DO_TIPO: Record<TipoDeItem, { um: string; varios: string }> = {
  imagem: { um: 'imagem', varios: 'imagens' },
  link: { um: 'link', varios: 'links' },
}

/**
 * O único "+" de uma seção, com o que ainda cabe nela. Leva ao formulário já no tipo
 * certo. É a mesma altura de uma linha de link e a mesma proporção de um cartão de
 * imagem, para a grade e a lista não pularem quando ele some.
 */
function Adicionar({
  livroId,
  tipo,
  restantes,
}: {
  livroId: string
  tipo: TipoDeItem
  restantes: number
}) {
  const nome = NOME_DO_TIPO[tipo]
  const falta = contar(restantes, nome.um, nome.varios)

  return (
    <Link
      to={`/novo-anexo?livro=${livroId}&tipo=${tipo}`}
      aria-label={`Adicionar ${nome.um}. Cabem mais ${falta}.`}
      className={`border-linha text-poeira active:bg-realce hover:bg-realce/60 flex items-center justify-center gap-2 rounded-2xl border border-dashed transition-colors ${
        tipo === 'imagem' ? 'aspect-[4/3] flex-col' : 'min-h-14 px-4'
      }`}
    >
      <Plus size={tipo === 'imagem' ? 26 : 20} aria-hidden />
      <span className="text-sm tabular-nums" aria-hidden>
        {restantes}
      </span>
    </Link>
  )
}

function CartaoDaImagem({
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

/** Um link: o rosto dele, a legenda e o domínio — uma linha, para a lista de oito se ler de uma vez. */
function LinhaDoLink({
  anexo,
  conceitos,
}: {
  anexo: AnexoNaTela
  conceitos: readonly ConceitoDoAnexo[]
}) {
  const situacao = situacaoDoAnexo(anexo, conceitos)
  const [primeiro] = conceitos
  const dominio = anexo.midia.tipo === 'link' ? dominioDe(anexo.midia.url) : ''

  return (
    <Link
      to={`/anexo/${anexo.id}`}
      className="cartao active:bg-realce hover:bg-realce/60 flex min-h-16 items-center gap-3 p-2 transition-colors"
    >
      <Miniatura anexo={anexo} compacta className="size-12 shrink-0 rounded-xl" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {anexo.legenda ? (
          <span className="line-clamp-1 text-sm leading-snug">{anexo.legenda}</span>
        ) : (
          <span className="text-poeira text-sm italic">Sem legenda</span>
        )}
        <span className="text-poeira truncate text-xs leading-snug">
          {dominio}
          {situacao === 'processando' && ' · lendo…'}
          {situacao === 'preso' && primeiro && ` · com ${primeiro.titulo}`}
          {situacao === 'preso' &&
            conceitos.length > 1 &&
            ` e mais ${String(conceitos.length - 1)}`}
          {(situacao === 'solto' || situacao === 'sem-legenda') && ' · fica só na pasta'}
        </span>
      </span>
    </Link>
  )
}
