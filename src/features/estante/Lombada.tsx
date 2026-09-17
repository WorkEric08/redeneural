import { createPortal } from 'react-dom'

import { contar } from '@/lib/plural'

import { EmblemaDaLombada } from './EmblemaDaLombada'
import { pano } from './panos'
import type { LivroNaEstante } from './resumo'
import type { ManipulacaoDaLombada } from './useManipularLivros'

/**
 * Em % da fileira, não em pixels: a fileira agora cresce com a tela (ver
 * .movel-fila), e a proporção entre livro e prateleira é que tem de ficar de
 * pé. São os mesmos 58..86 px sobre a fileira de 92 px de antes.
 */
const ALTURA_MINIMA = 63
const ALTURA_MAXIMA = 93.5

/**
 * - `repouso`: na prateleira, sob a luz que lava a cor.
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
  manipular: ManipulacaoDaLombada
}

/**
 * Um livro visto de fora.
 *
 * Por padrão a altura vem da quantidade de neurônios — é a única coisa que a
 * estante conta sem você abrir nada. `Livro.comprimentoLombada` deixa
 * escolher a altura na mão, abrindo mão desse sinal para aquele livro (ver o
 * comentário em `core/domain/types.ts`). O título vai gravado em ouro, como
 * numa lombada de verdade.
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
  manipular,
}: Props) {
  const altura =
    item.livro.comprimentoLombada ?? ALTURA_MINIMA + item.altura * (ALTURA_MAXIMA - ALTURA_MINIMA)

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
      style={{
        ...pano(item.livro.cor, intensidadeDaLuz),
        height: `${String(Math.round(altura * 10) / 10)}%`,
        width: `${String(largura)}px`,
      }}
      aria-label={`${item.livro.titulo}, ${contar(item.neuronios, 'neurônio', 'neurônios')}`}
      aria-haspopup="dialog"
      {...manipular}
    >
      <span className="lombada-titulo">{item.livro.titulo}</span>

      {item.saindo > 0 && <span className="lombada-ponto brilho-ponte" aria-hidden />}
      <EmblemaDaLombada chave={item.livro.emblema} />
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
  return createPortal(
    <span
      ref={registrar}
      aria-hidden
      className="lombada lombada--fantasma cores-de-antes"
      style={{
        ...pano(item.livro.cor),
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
