import { useMemo, useRef, type CSSProperties } from 'react'

import { moverLivroNaEstante, type Id, type Vaga } from '@/core'

import { Fantasma, Lombada, type EstadoDaLombada } from './Lombada'
import { geometriaDaLombada } from './lombadaNoite'
import {
  cabeNaPrateleira,
  COR_DO_ENFEITE,
  LARGURA_MINIMA_DO_LIVRO,
  larguraDosLivrosDaPrateleira,
  montarPrateleiras,
  TOM_DO_DETALHE_DO_ENFEITE,
  type Lugar,
} from './prateleiras'
import type { LivroNaEstante } from './resumo'
import { useMedidasDaFileira } from './useMedidasDaFileira'
import {
  useManipularLivros,
  type LugarDaEstante,
  type ManipulacaoDaLombada,
} from './useManipularLivros'

interface Props {
  estante: readonly LivroNaEstante[]
  /** Os lugares deixados abertos — sem livro e sem enfeite. */
  vagas: readonly Vaga[]
  /** `pontesEntreLivros`: quantos fios de ponte ligam cada par de livros. */
  pontes: ReadonlyMap<Id, ReadonlyMap<Id, number>>
  /** O livro do painel aberto — espiando, no menu, sendo editado ou apagado. */
  selecionadoId: string | null
  /** O lugar sem livro cujo menu está aberto. */
  lugarEscolhido: LugarDaEstante | null
  /** O livro que está saindo da estante para abrir: o lugar dele fica como vão. */
  abrindoId: string | null
  chegandoId: string | null
  /** Quantas prateleiras o móvel tem — gravado, ajustável em Ajustes. */
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  onEspiar: (livroId: string) => void
  onAcoes: (livroId: string) => void
  /** Põe o livro no lugar `(prateleira, lugar)` — mesma assinatura da store. */
  onMover: (livroId: string, prateleira: number, lugar: number) => void
  onNovo: (prateleira: number, lugar: number) => void
  /** O livro não cabe inteiro entre as laterais daquela prateleira: nada foi feito. */
  onSemEspaco: (prateleira: number) => void
  onAcoesDoLugar: (prateleira: number, lugar: number) => void
}

function mesmoLugar(a: LugarDaEstante | null, prateleira: number, lugar: number): boolean {
  return a !== null && a.prateleira === prateleira && a.lugar === lugar
}

/**
 * O móvel: a estante em que os livros moram.
 *
 * Duas laterais iguais de madeira, o trilho em cima, prateleiras com a penumbra
 * da tábua de cima caindo sobre os livros, e a base que fecha a última prateleira.
 * A estrutura é CSS sobre duas texturas de madeira (`src/assets`); o fundo atrás dos
 * livros é liso. Acompanha a largura da tela, e é sempre escura, nos dois temas.
 *
 * Cada prateleira é uma fileira de lugares (ver `prateleiras.ts`): um livro
 * seu, um enfeite — a biblioteca que ainda não foi escrita — ou madeira nua.
 */
export function Movel({
  estante,
  vagas,
  pontes,
  selecionadoId,
  lugarEscolhido,
  abrindoId,
  chegandoId,
  quantidadeDePrateleiras,
  intensidadeDaLuz,
  onEspiar,
  onAcoes,
  onMover,
  onNovo,
  onSemEspaco,
  onAcoesDoLugar,
}: Props) {
  const movel = useRef<HTMLDivElement>(null)
  const { altura: alturaDaFileira, largura: larguraUtil } = useMedidasDaFileira(movel)
  const prateleiras = useMemo(
    () => montarPrateleiras(estante, vagas, quantidadeDePrateleiras, larguraUtil ?? undefined),
    [estante, vagas, quantidadeDePrateleiras, larguraUtil],
  )

  // As laterais são sólidas: um livro só vai (ou nasce) numa prateleira onde os
  // livros dela continuam cabendo inteiros. Os enfeites cedem espaço até a
  // largura mínima, então o que decide é a soma dos livros.
  function podeMover(livroId: string, prateleira: number, lugar: number): boolean {
    if (larguraUtil === null) return true
    const livros = estante.map((e) => e.livro)
    const depois = moverLivroNaEstante(livros, livroId, prateleira, lugar)
    if (!depois) return true // sem lugar livre: quem recusa é a store, com o aviso dela
    return cabeNaPrateleira(
      larguraDosLivrosDaPrateleira(livros, prateleira),
      larguraDosLivrosDaPrateleira(depois, prateleira),
      larguraUtil,
    )
  }

  function podeCriar(prateleira: number): boolean {
    if (larguraUtil === null) return true
    const livros = estante.map((e) => e.livro)
    const antes = larguraDosLivrosDaPrateleira(livros, prateleira)
    return cabeNaPrateleira(antes, antes + LARGURA_MINIMA_DO_LIVRO + 1, larguraUtil)
  }
  const { gesto, lugarSegurado, manipular, manipularLugar, registrarFantasma } = useManipularLivros(
    {
      onEspiar,
      onAcoes,
      onMover: (livroId, alvo) => {
        if (!podeMover(livroId, alvo.prateleira, alvo.lugar)) {
          onSemEspaco(alvo.prateleira)
          return
        }
        onMover(livroId, alvo.prateleira, alvo.lugar)
      },
      onTocarLugar: ({ prateleira, lugar }) => {
        if (!podeCriar(prateleira)) {
          onSemEspaco(prateleira)
          return
        }
        onNovo(prateleira, lugar)
      },
      onAcoesDoLugar: ({ prateleira, lugar }) => {
        onAcoesDoLugar(prateleira, lugar)
      },
    },
  )

  // Quem está na mão manda: segurar outro livro com um painel aberto acende as
  // pontes do que está na mão, não as do painel.
  const focoId = gesto.livroId ?? selecionadoId
  const pontesDoFoco = focoId === null ? undefined : pontes.get(focoId)
  const naMao =
    gesto.fase === 'arrastando' ? estante.find((e) => e.livro.id === gesto.livroId) : undefined
  const alvo = gesto.fase === 'arrastando' ? gesto.alvo : null

  function estadoDe(livroId: string): EstadoDaLombada {
    if (abrindoId === livroId) return 'vazio'
    if (gesto.livroId === livroId) return gesto.fase === 'arrastando' ? 'vazio' : 'erguido'
    return selecionadoId === livroId ? 'escolhido' : 'repouso'
  }

  return (
    // O número de prateleiras é o divisor de que a folha precisa para a estante
    // se medir pela tela (ver .movel-fila em index.css).
    <div
      ref={movel}
      className="movel cores-de-antes"
      data-prateleiras={prateleiras.length}
      style={{ '--mv-prateleiras': prateleiras.length } as CSSProperties}
    >
      <span className="movel-cornija" aria-hidden />

      <div className="movel-corpo">
        {prateleiras.map((p, prateleira) => (
          <div className="movel-vao" key={p.chave} data-prateleira={prateleira}>
            <div className="movel-fila">
              {p.lugares.map((lugar) =>
                lugar.tipo === 'livro' ? (
                  <Lombada
                    key={lugar.item.livro.id}
                    item={lugar.item}
                    lugar={lugar.indice}
                    largura={lugar.largura}
                    estado={estadoDe(lugar.item.livro.id)}
                    alvo={
                      mesmoLugar(alvo, prateleira, lugar.indice) &&
                      gesto.livroId !== lugar.item.livro.id
                    }
                    ponte={(pontesDoFoco?.get(lugar.item.livro.id) ?? 0) > 0}
                    chegando={chegandoId === lugar.item.livro.id}
                    intensidadeDaLuz={intensidadeDaLuz}
                    alturaDaFileira={alturaDaFileira}
                    manipular={manipular(lugar.item.livro.id)}
                  />
                ) : (
                  <LugarSemLivro
                    key={`lugar-${String(lugar.indice)}`}
                    lugar={lugar}
                    prateleira={prateleira}
                    alturaDaFileira={alturaDaFileira}
                    alvo={mesmoLugar(alvo, prateleira, lugar.indice)}
                    realce={
                      mesmoLugar(lugarSegurado, prateleira, lugar.indice) ||
                      mesmoLugar(lugarEscolhido, prateleira, lugar.indice)
                    }
                    manipular={manipularLugar({ prateleira, lugar: lugar.indice })}
                  />
                ),
              )}
            </div>
            <span className="movel-penumbra" aria-hidden />
            <span className="movel-tabua" aria-hidden />
          </div>
        ))}

        <span className="movel-pilastra movel-pilastra--esq" aria-hidden />
        <span className="movel-pilastra movel-pilastra--dir" aria-hidden />
      </div>

      <span className="movel-base" aria-hidden>
        <span className="movel-base-painel" />
      </span>
      <span className="movel-luar" aria-hidden />

      {naMao && gesto.origem && (
        <Fantasma item={naMao} caixa={gesto.origem} registrar={registrarFantasma} />
      )}
    </div>
  )
}

/**
 * Um lugar sem livro. A coluna inteira da fileira, e não só a lombada: tocar
 * acima de um enfeite baixo ainda é tocar no lugar dele.
 *
 * O enfeite continua sem título e sem luz (a cor real, sem lavagem) — mas é da pessoa: tocar
 * escreve um livro exatamente ali, segurar deixa tirá-lo ou devolvê-lo.
 */
function LugarSemLivro({
  lugar,
  prateleira,
  alturaDaFileira,
  alvo,
  realce,
  manipular,
}: {
  lugar: Exclude<Lugar, { tipo: 'livro' }>
  prateleira: number
  /** A altura da fileira em px, para a forma do enfeite se medir. */
  alturaDaFileira: number
  /** O livro na mão vai cair aqui. */
  alvo: boolean
  /** Segurado agora, ou com o menu aberto. */
  realce: boolean
  manipular: ManipulacaoDaLombada
}) {
  const nome = `Prateleira ${String(prateleira + 1)}, lugar ${String(lugar.indice + 1)}`
  const oQueTem = lugar.tipo === 'enfeite' ? 'enfeite' : 'vazio'

  return (
    <button
      type="button"
      data-lugar={lugar.indice}
      data-alvo={alvo || undefined}
      data-realce={realce || undefined}
      className={`lugar lugar--${lugar.tipo}`}
      style={{ width: `${String(lugar.largura)}px` }}
      aria-label={`${nome}, ${oQueTem}: criar um livro aqui`}
      {...manipular}
    >
      {lugar.tipo === 'enfeite' && <Enfeite lugar={lugar} alturaDaFileira={alturaDaFileira} />}
    </button>
  )
}

/**
 * O enfeite: uma lombada azul sem título, no desenho das de verdade. Sem lavagem
 * de luz — a luz da sala chega nos livros da pessoa, e é isso que os faz
 * saltar no meio dos enfeites.
 */
function Enfeite({
  lugar,
  alturaDaFileira,
}: {
  lugar: Extract<Lugar, { tipo: 'enfeite' }>
  alturaDaFileira: number
}) {
  const geo = geometriaDaLombada({
    estilo: lugar.estilo,
    cor: COR_DO_ENFEITE,
    titulo: '',
    largura: lugar.largura,
    altura: (lugar.altura * alturaDaFileira) / 100,
    intensidadeDaLuz: 0,
  })

  return (
    <span
      aria-hidden
      className="lombada lombada--enfeite"
      data-estilo={geo.estilo}
      style={
        {
          ...geo.style,
          '--fg': TOM_DO_DETALHE_DO_ENFEITE,
          height: `${String(lugar.altura)}%`,
        } as CSSProperties
      }
    >
      {lugar.dourado && <span className="lombada-filetes" />}
    </span>
  )
}
