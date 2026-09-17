import { useMemo, type CSSProperties } from 'react'

import type { Id, Vaga } from '@/core'

import { Fantasma, Lombada, type EstadoDaLombada } from './Lombada'
import { montarPrateleiras, type Lugar } from './prateleiras'
import type { LivroNaEstante } from './resumo'
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
  /**
   * Quem está marcado para mover em grupo. Não vazio liga o modo de seleção:
   * tocar um livro marca/desmarca em vez de espiar, e tocar um lugar sem livro
   * põe o grupo inteiro ali em vez de criar um livro novo.
   */
  selecionados: ReadonlySet<string>
  onEspiar: (livroId: string) => void
  onAcoes: (livroId: string) => void
  onAlternarSelecao: (livroId: string) => void
  onMoverSelecionadosPara: (prateleira: number, lugar: number) => void
  /** Põe o livro no lugar `(prateleira, lugar)` — mesma assinatura da store. */
  onMover: (livroId: string, prateleira: number, lugar: number) => void
  onNovo: (prateleira: number, lugar: number) => void
  onAcoesDoLugar: (prateleira: number, lugar: number) => void
}

function mesmoLugar(a: LugarDaEstante | null, prateleira: number, lugar: number): boolean {
  return a !== null && a.prateleira === prateleira && a.lugar === lugar
}

/**
 * O móvel: a estante em que os livros moram.
 *
 * Pilastras caneladas nas laterais, cornija em cima, prateleiras com a penumbra
 * da tábua de cima caindo sobre os livros, e o assoalho no pé. Tudo em CSS — não
 * é imagem, então acompanha o tema e a largura da tela.
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
  selecionados,
  onEspiar,
  onAcoes,
  onAlternarSelecao,
  onMoverSelecionadosPara,
  onMover,
  onNovo,
  onAcoesDoLugar,
}: Props) {
  const selecionando = selecionados.size > 0

  const prateleiras = useMemo(
    () => montarPrateleiras(estante, vagas, quantidadeDePrateleiras),
    [estante, vagas, quantidadeDePrateleiras],
  )
  const { gesto, lugarSegurado, manipular, manipularLugar, registrarFantasma } = useManipularLivros(
    {
      // Selecionando, tocar marca/desmarca em vez de espiar — o resto do gesto
      // (segurar, arrastar um livro só) continua igual, sem precisar o hook
      // saber que existe seleção.
      onEspiar: selecionando ? onAlternarSelecao : onEspiar,
      onAcoes,
      onMover: (livroId, alvo) => {
        onMover(livroId, alvo.prateleira, alvo.lugar)
      },
      onTocarLugar: ({ prateleira, lugar }) => {
        if (selecionando) onMoverSelecionadosPara(prateleira, lugar)
        else onNovo(prateleira, lugar)
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
      className="movel cores-de-antes"
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
                    selecionado={selecionados.has(lugar.item.livro.id)}
                    intensidadeDaLuz={intensidadeDaLuz}
                    manipular={manipular(lugar.item.livro.id)}
                  />
                ) : (
                  <LugarSemLivro
                    key={`lugar-${String(lugar.indice)}`}
                    lugar={lugar}
                    prateleira={prateleira}
                    alvo={mesmoLugar(alvo, prateleira, lugar.indice)}
                    realce={
                      mesmoLugar(lugarSegurado, prateleira, lugar.indice) ||
                      mesmoLugar(lugarEscolhido, prateleira, lugar.indice)
                    }
                    selecionando={selecionando}
                    manipular={manipularLugar({ prateleira, lugar: lugar.indice })}
                  />
                ),
              )}
            </div>
            <span className="movel-penumbra" aria-hidden />
            <span className="movel-tabua" aria-hidden />
          </div>
        ))}
      </div>

      <span className="movel-assoalho" aria-hidden />
      <span className="movel-pilastra movel-pilastra--esq" aria-hidden />
      <span className="movel-pilastra movel-pilastra--dir" aria-hidden />
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
 * O enfeite continua sem título e sem luz — mas agora é da pessoa: tocar
 * escreve um livro exatamente ali, segurar deixa tirá-lo ou devolvê-lo.
 */
function LugarSemLivro({
  lugar,
  prateleira,
  alvo,
  realce,
  selecionando,
  manipular,
}: {
  lugar: Exclude<Lugar, { tipo: 'livro' }>
  prateleira: number
  /** O livro na mão vai cair aqui. */
  alvo: boolean
  /** Segurado agora, ou com o menu aberto. */
  realce: boolean
  selecionando: boolean
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
      aria-label={
        selecionando
          ? `${nome}: pôr os livros marcados aqui`
          : `${nome}, ${oQueTem}: criar um livro aqui`
      }
      {...manipular}
    >
      {lugar.tipo === 'enfeite' && (
        <span
          aria-hidden
          className="lombada lombada--enfeite"
          style={{
            // A mesma regra da lombada de verdade — a luz lava a cor do pano —,
            // só que com muito menos luz chegando: 8..38% contra os 58% de um
            // livro seu. É o que faz os seus saltarem no meio deles.
            backgroundColor: `color-mix(in oklab, var(--lombada-${String(lugar.pano)}) ${String(Math.round(8 + lugar.luz * 30))}%, var(--lavagem))`,
            height: `${String(lugar.altura)}%`,
          }}
        />
      )}
    </button>
  )
}
