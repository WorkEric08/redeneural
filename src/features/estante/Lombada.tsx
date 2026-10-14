import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import { especieDoLivro, INTENSIDADE_DA_LUZ_PADRAO } from '@/core'
import { contar } from '@/lib/plural'

import { EmblemaDaLombada } from './EmblemaDaLombada'
import { geometriaDaLombada } from './lombadaNoite'
import { alturaDaLombadaEmPercentual, extensaoDoLivro } from './prateleiras'
import type { LivroNaEstante } from './resumo'
import type { ManipulacaoDaLombada } from './useManipularLivros'

/** O que o leitor de tela diz do andamento — a lombada só o mostra com cor. */
const LEGENDA_DO_ANDAMENTO = {
  nenhum: '',
  fazendo: ', em andamento',
  feita: ', tudo feito',
  adormecido: ', adormecido',
} as const

const LEGENDA_DA_IDEIA_ADORMECIDA = ', com ideia adormecida'

/**
 * A lua da ideia adormecida: uma meia-lua no lilás frio da névoa. Fora, acima do topo, ou `dentro`, no
 * alto da lombada, para quem não tem folga em cima.
 */
function Lua({ dentro = false }: { dentro?: boolean }) {
  return (
    <span className={dentro ? 'lombada-lua lombada-lua--dentro' : 'lombada-lua'} aria-hidden>
      <svg viewBox="0 0 24 24">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </span>
  )
}

/** A lua acima do topo cresce com a lombada (10,5% da altura), de 8 a 14 px; dentro dela, no deitado, tem 7. */
const LUA_MINIMA_PX = 8
const LUA_MAXIMA_PX = 14
const LUA_DENTRO_PX = 7

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
  /**
   * A largura da lombada em px. Num livro deitado é a **espessura**: a altura que ele tem na
   * pilha, com o livro girado.
   */
  largura: number
  estado: EstadoDaLombada
  /** O livro embaixo de um enfeite na mão: soltar ali o empurra para o lado. */
  alvo: boolean
  /** Tem fio de ponte com o livro que está na mão ou no painel. */
  ponte: boolean
  /** Acabou de nascer: chega à prateleira em vez de só aparecer nela. */
  chegando: boolean
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /** A altura da fileira em px: a lombada é % dela, e o título se mede em px. */
  alturaDaFileira: number
  /** Ajustes: o ícone da espécie (livro, executável, pasta) no pé da lombada. */
  iconesNosLivros: boolean
  manipular: ManipulacaoDaLombada
}

/**
 * Um livro visto de fora.
 *
 * Por padrão a altura vem da quantidade de pensamentos — é a única coisa que a
 * estante conta sem você abrir nada. `Livro.comprimentoLombada` deixa
 * escolher a altura na mão, abrindo mão desse sinal para aquele livro (ver o
 * comentário em `core/domain/types.ts`). A forma (`Livro.estilo`) e o texto
 * claro ou escuro saem da cor — ver `lombadaNoite.ts` e `.lombada` em index.css.
 *
 * A largura vem da semente do id (ver `prateleiras.ts`) ou de
 * `Livro.larguraLombada`: varia como numa estante de verdade, mas é sempre a
 * mesma para o mesmo livro.
 *
 * Um livro **deitado** (08/10/2026) é o mesmo livro girado: a lombada se desenha como se estivesse
 * em pé — mesma forma, título e medidas — dentro de uma moldura que gira -90°, e a moldura tem a
 * largura que o livro ocupa no lugar (o comprimento dele) e a altura que pesa na pilha (a largura).
 * Os estados (erguido, escolhido, alvo) erguem o livro para cima de verdade, não para o lado.
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
  iconesNosLivros,
  manipular,
}: Props) {
  const altura = alturaDaLombadaEmPercentual(item.livro.comprimentoLombada, item.altura)
  const deitada = item.livro.orientacao === 'deitado'
  const extensao = extensaoDoLivro(item, alturaDaFileira)
  const ehPasta = item.livro.tipo === 'acervo'
  // O pé da feita é do disco: o ícone não cabe junto, e a lombada feita fica sem ele.
  const icone = iconesNosLivros && item.andamento !== 'feita'
  // O topo do livro de pé passa da fileira e sobrepõe a prateleira de cima, então a lua cabe sempre acima
  // dele. Deitado, o "topo" é a ponta esquerda, junto do vizinho: a lua entra na lombada.
  const luaFora = !deitada
  const luaPx = luaFora
    ? Math.round(
        Math.min(
          LUA_MAXIMA_PX,
          Math.max(LUA_MINIMA_PX, 0.105 * ((altura * alturaDaFileira) / 100)),
        ),
      )
    : LUA_DENTRO_PX
  const geo = geometriaDaLombada({
    estilo: item.livro.estilo,
    cor: item.livro.cor,
    titulo: item.livro.titulo,
    largura,
    altura: deitada ? extensao : (altura * alturaDaFileira) / 100,
    intensidadeDaLuz,
    icone,
    alturaDaFileira,
  })

  const botao = (
    <button
      type="button"
      data-livro-id={item.livro.id}
      // Num livro deitado o lugar é o da pilha (`data-lugar` mora nela): o arrasto lê o dela.
      data-lugar={deitada ? undefined : lugar}
      data-estado={estado}
      data-alvo={alvo || undefined}
      data-ponte={ponte || undefined}
      data-chegando={chegando || undefined}
      data-orientacao={item.livro.orientacao}
      className={deitada ? 'lombada lombada--livro lombada--deitada' : 'lombada lombada--livro'}
      data-estilo={geo.estilo}
      data-andamento={item.andamento ?? undefined}
      style={
        {
          ...geo.style,
          '--lua-px': `${String(luaPx)}px`,
          height: deitada ? `${String(extensao)}px` : `${String(Math.round(altura * 10) / 10)}%`,
          width: `${String(largura)}px`,
        } as CSSProperties
      }
      aria-label={
        ehPasta
          ? `${item.livro.titulo}, pasta com ${contar(item.anexos, 'item', 'itens')}`
          : `${item.livro.titulo}, ${contar(item.neuronios, 'pensamento', 'pensamentos')}${LEGENDA_DO_ANDAMENTO[item.andamento ?? 'nenhum']}${item.comIdeiaAdormecida && item.andamento !== 'adormecido' ? LEGENDA_DA_IDEIA_ADORMECIDA : ''}`
      }
      aria-haspopup="dialog"
      {...manipular}
    >
      {/* O título e o ícone são um grupo só, centrado na faixa livre da forma (ver `geometriaDaLombada`):
          o ícone — a espécie do livro, ou o emblema que a pessoa escolheu antes de 14/09/2026, ou o clipe
          da pasta — vem logo abaixo das letras e aparece com título de qualquer tamanho. */}
      <span className="lombada-conteudo">
        <span className="lombada-titulo">{item.livro.titulo}</span>
        {icone && (
          <EmblemaDaLombada
            chave={ehPasta ? 'pasta' : (item.livro.emblema ?? especieDoLivro(item.livro))}
          />
        )}
      </span>

      {ponte && <span className="lombada-ponto" aria-hidden />}
      {item.andamento === 'fazendo' && <span className="lombada-fazendo-faixa" aria-hidden />}
      {/* Os sinais logo acima do topo: o ponto do Fazendo e a lua da ideia adormecida, lado a lado
          quando há os dois. Passam da fileira e sobrepõem a prateleira de cima. No livro deitado a lua
          entra na lombada. */}
      {(item.andamento === 'fazendo' || (item.comIdeiaAdormecida && luaFora)) && (
        <span className="lombada-sinais" aria-hidden>
          {item.andamento === 'fazendo' && <span className="lombada-fazendo-ponto" />}
          {item.comIdeiaAdormecida && luaFora && <Lua />}
        </span>
      )}
      {item.comIdeiaAdormecida && !luaFora && <Lua dentro />}
      {item.andamento === 'feita' && (
        <span className="lombada-feita" aria-hidden>
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2.2 5.3 4.3 7.4 7.9 2.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {item.andamento === 'adormecido' && <span className="lombada-nevoa" aria-hidden />}
    </button>
  )

  if (!deitada) return botao
  // A moldura é o que o livro ocupa deitado: o comprimento dele de largura, a espessura de altura.
  return (
    <span
      className="lombada-giro"
      style={{ width: `${String(extensao)}px`, height: `${String(largura)}px` }}
    >
      {botao}
    </span>
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
  const deitada = item.livro.orientacao === 'deitado'
  // Só cor e título: o livro na mão não leva forma nem estado. Deitado, a caixa que o dedo
  // levou (`caixa`) é a do livro girado: a largura dela é o comprimento, e a altura, a espessura.
  const geo = geometriaDaLombada({
    estilo: 'solido',
    cor: item.livro.cor,
    titulo: item.livro.titulo,
    largura: deitada ? caixa.height : caixa.width,
    altura: deitada ? caixa.width : caixa.height,
    // O livro na mão vem para perto: a cor real, sem sombra nem brilho.
    intensidadeDaLuz: INTENSIDADE_DA_LUZ_PADRAO,
  })

  if (deitada) {
    return createPortal(
      <span
        ref={registrar}
        aria-hidden
        className="lombada-giro lombada-giro--fantasma"
        style={{ left: caixa.left, top: caixa.top, width: caixa.width, height: caixa.height }}
      >
        <span
          className="lombada lombada--fantasma lombada--deitada cores-de-antes"
          data-estilo={geo.estilo}
          style={{ ...geo.style, width: caixa.height, height: caixa.width }}
        >
          <span className="lombada-titulo">{item.livro.titulo}</span>
        </span>
      </span>,
      document.body,
    )
  }

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
