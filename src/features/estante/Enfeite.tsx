import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import { INTENSIDADE_DA_LUZ_PADRAO } from '@/core'

import { geometriaDaLombada } from './lombadaNoite'
import { TOM_DO_DETALHE_DO_ENFEITE, type EnfeiteNoLugar } from './prateleiras'

/**
 * As variáveis CSS do enfeite. A luz sobre ele é uma preferência à parte da dos livros
 * (`intensidadeDaLuzDoEnfeite`, em Ajustes): em 50, o padrão, é a cor real; abaixo disso ele
 * escurece (e o fundo da estante com ele, no `Movel`), acima fica um pouco mais branco.
 *
 * O enfeite sorteado leva os detalhes da forma em azul mais escuro que o fundo
 * (`detalheEscuro`), sem luz branca no alto. O que a pessoa definiu à mão é
 * desenhado como um livro: a forma e a cor que ela escolheu.
 */
function estiloDoEnfeite(
  lugar: EnfeiteNoLugar,
  largura: number,
  altura: number,
  intensidadeDaLuz: number,
): CSSProperties {
  const geo = geometriaDaLombada({
    estilo: lugar.estilo,
    cor: lugar.cor,
    titulo: '',
    largura,
    altura,
    intensidadeDaLuz,
    peca: 'enfeite',
  })
  return (
    lugar.detalheEscuro ? { ...geo.style, '--fg': TOM_DO_DETALHE_DO_ENFEITE } : geo.style
  ) as CSSProperties
}

/**
 * Um enfeite visto de fora: uma lombada sem título, no desenho das de verdade.
 * `naMao`: o dedo o levou para outro lugar, e aqui fica o vão que ele deixa.
 */
export function Enfeite({
  lugar,
  alturaDaFileira,
  intensidadeDaLuz,
  naMao = false,
}: {
  lugar: EnfeiteNoLugar
  alturaDaFileira: number
  /** 0-100: o quanto a luz da sala lava a cor do enfeite em repouso. */
  intensidadeDaLuz: number
  naMao?: boolean
}) {
  return (
    <span
      aria-hidden
      className="lombada lombada--enfeite"
      data-estilo={lugar.estilo}
      data-estado={naMao ? 'vazio' : undefined}
      style={{
        ...estiloDoEnfeite(
          lugar,
          lugar.largura,
          (lugar.altura * alturaDaFileira) / 100,
          intensidadeDaLuz,
        ),
        height: `${String(lugar.altura)}%`,
      }}
    >
      {lugar.dourado && <span className="lombada-filetes" />}
    </span>
  )
}

/**
 * O enfeite na mão. Fora da estante e em portal no `body`, pelos mesmos motivos do
 * `Fantasma` do livro: a fileira recorta o que passa dela, e o `transform` de
 * `.animar-entrada` desalinharia qualquer `position: fixed` lá dentro.
 */
export function FantasmaDoEnfeite({
  lugar,
  caixa,
  registrar,
}: {
  lugar: EnfeiteNoLugar
  caixa: DOMRect
  registrar: (elemento: HTMLElement | null) => void
}) {
  return createPortal(
    <span
      ref={registrar}
      aria-hidden
      className="lombada lombada--fantasma cores-de-antes"
      data-estilo={lugar.estilo}
      style={{
        // Na mão ele vem para perto, como o livro: a cor real, sem sombra nem brilho.
        ...estiloDoEnfeite(lugar, caixa.width, caixa.height, INTENSIDADE_DA_LUZ_PADRAO),
        left: caixa.left,
        top: caixa.top,
        width: caixa.width,
        height: caixa.height,
      }}
    >
      {lugar.dourado && <span className="lombada-filetes" />}
    </span>,
    document.body,
  )
}
