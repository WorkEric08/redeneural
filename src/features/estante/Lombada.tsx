import { createPortal } from 'react-dom'

import { INTENSIDADE_DA_LUZ_PADRAO } from '@/core'
import { contar } from '@/lib/plural'

import { EmblemaDaLombada } from './EmblemaDaLombada'
import { geometriaDaLombada } from './lombadaNoite'
import { alturaDaLombadaEmPercentual } from './prateleiras'
import type { LivroNaEstante } from './resumo'
import type { ManipulacaoDaLombada } from './useManipularLivros'

/** O que o leitor de tela diz do andamento — a lombada só o mostra com cor. */
const LEGENDA_DO_ANDAMENTO = {
  nenhum: '',
  fazendo: ', em andamento',
  feita: ', tudo feito',
  adormecido: ', adormecido',
} as const

/**
 * - `repouso`: na prateleira, sob a luz de Ajustes.
 * - `escolhido`: puxado para fora pelo painel aberto.
 * - `erguido`: na mão, antes de o dedo andar.
 * - `vazio`: o vão que o livro deixa enquanto viaja na mão.
 */
export type EstadoDaLombada = 'repouso' | 'escolhido' | 'erguido' | 'vazio'

interface Props {
  item: LivroNaEstante
  /** Em qual lugar da prateleira — é o que o arrasto lê para saber onde soltar. */
  lugar: number
  largura: number
  estado: EstadoDaLombada
  /** O livro embaixo do dedo de quem arrasta outro: soltar ali o empurra para o lado. */
  alvo: boolean
  /** Tem fio de ponte com o livro que está na mão ou no painel. */
  ponte: boolean
  /** Acabou de nascer: chega à prateleira em vez de só aparecer nela. */
  chegando: boolean
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /** A altura da fileira em px: a lombada é % dela, e o título se mede em px. */
  alturaDaFileira: number
  manipular: ManipulacaoDaLombada
}

/**
 * Um livro visto de fora.
 *
 * Por padrão a altura vem da quantidade de neurônios — é a única coisa que a
 * estante conta sem você abrir nada. `Livro.comprimentoLombada` deixa
 * escolher a altura na mão, abrindo mão desse sinal para aquele livro (ver o
 * comentário em `core/domain/types.ts`). A forma (`Livro.estilo`) e o texto
 * claro ou escuro saem da cor — ver `lombadaNoite.ts` e `.lombada` em index.css.
 *
 * A largura vem da semente do id (ver `prateleiras.ts`) ou de
 * `Livro.larguraLombada`: varia como numa estante de verdade, mas é sempre a
 * mesma para o mesmo livro.
 *
 * Botão, e não link: tocar espia em vez de abrir, e abrir mora no painel.
 */
export function Lombada({
  item,
  lugar,
  largura,
  estado,
  alvo,
  ponte,
  chegando,
  intensidadeDaLuz,
  alturaDaFileira,
  manipular,
}: Props) {
  const altura = alturaDaLombadaEmPercentual(item.livro.comprimentoLombada, item.altura)
  const ehPasta = item.livro.tipo === 'acervo'
  const geo = geometriaDaLombada({
    estilo: item.livro.estilo,
    cor: item.livro.cor,
    titulo: item.livro.titulo,
    largura,
    altura: (altura * alturaDaFileira) / 100,
    intensidadeDaLuz,
  })

  return (
    <button
      type="button"
      data-livro-id={item.livro.id}
      data-lugar={lugar}
      data-estado={estado}
      data-alvo={alvo || undefined}
      data-ponte={ponte || undefined}
      data-chegando={chegando || undefined}
      className="lombada lombada--livro"
      data-estilo={geo.estilo}
      data-andamento={item.andamento ?? undefined}
      style={{
        ...geo.style,
        height: `${String(Math.round(altura * 10) / 10)}%`,
        width: `${String(largura)}px`,
      }}
      aria-label={
        ehPasta
          ? `${item.livro.titulo}, pasta com ${contar(item.anexos, 'item', 'itens')}`
          : `${item.livro.titulo}, ${contar(item.neuronios, 'neurônio', 'neurônios')}${LEGENDA_DO_ANDAMENTO[item.andamento ?? 'nenhum']}`
      }
      aria-haspopup="dialog"
      {...manipular}
    >
      <span className="lombada-titulo">{item.livro.titulo}</span>
      {item.livro.estilo === 'papel' && (
        <span className="lombada-contagem" aria-hidden>
          {ehPasta ? item.anexos : item.neuronios}
        </span>
      )}

      {ponte && <span className="lombada-ponto" aria-hidden />}
      {item.andamento === 'fazendo' && (
        <>
          <span className="lombada-fazendo-faixa" aria-hidden />
          <span className="lombada-fazendo-ponto" aria-hidden />
        </>
      )}
      {item.andamento === 'feita' && (
        <span className="lombada-feita" aria-hidden>
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2.2 5.3 4.3 7.4 7.9 2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {/* O pé da feita é do disco: o emblema não cabe junto. */}
      {geo.emblemaCabe && item.andamento !== 'feita' && (
        <EmblemaDaLombada chave={ehPasta ? 'pasta' : item.livro.emblema} />
      )}
      {item.andamento === 'adormecido' && <span className="lombada-nevoa" aria-hidden />}
    </button>
  )
}

/**
 * O livro na mão.
 *
 * Fora da estante e em portal no `body` por dois motivos: a fileira recorta o
 * que passa dela (`overflow: hidden`), e a tela vive dentro de `.animar-entrada`,
 * cujo `transform` vira referência para qualquer `position: fixed` lá dentro — o
 * fantasma sairia torto do dedo.
 */
export function Fantasma({
  item,
  caixa,
  registrar,
}: {
  item: LivroNaEstante
  caixa: DOMRect
  registrar: (elemento: HTMLElement | null) => void
}) {
  // Só cor e título: o livro na mão não leva forma nem estado.
  const geo = geometriaDaLombada({
    estilo: 'solido',
    cor: item.livro.cor,
    titulo: item.livro.titulo,
    largura: caixa.width,
    altura: caixa.height,
    // O livro na mão vem para perto: a cor real, sem sombra nem brilho.
    intensidadeDaLuz: INTENSIDADE_DA_LUZ_PADRAO,
  })

  return createPortal(
    <span
      ref={registrar}
      aria-hidden
      className="lombada lombada--fantasma cores-de-antes"
      data-estilo={geo.estilo}
      style={{
        ...geo.style,
        left: caixa.left,
        top: caixa.top,
        width: caixa.width,
        height: caixa.height,
      }}
    >
      <span className="lombada-titulo">{item.livro.titulo}</span>
    </span>,
    document.body,
  )
}
