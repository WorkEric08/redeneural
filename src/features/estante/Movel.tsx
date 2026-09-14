import { useMemo, type CSSProperties } from 'react'

import type { Id } from '@/core'

import { Fantasma, Lombada, type EstadoDaLombada } from './Lombada'
import { montarPrateleiras, type Enfeite } from './prateleiras'
import type { LivroNaEstante } from './resumo'
import { useManipularLivros } from './useManipularLivros'

interface Props {
  estante: readonly LivroNaEstante[]
  /** `pontesEntreLivros`: quantos fios dourados ligam cada par de livros. */
  pontes: ReadonlyMap<Id, ReadonlyMap<Id, number>>
  /** O livro do painel aberto — espiando, no menu, sendo editado ou apagado. */
  selecionadoId: string | null
  chegandoId: string | null
  /** Quantas prateleiras o móvel tem — gravado, ajustável em Ajustes. */
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /**
   * Visão geral ligada: fileiras bem mais baixas, sem título/emblema/selo —
   * só a cor de cada livro —, para caber muito mais prateleira de uma vez.
   */
  visaoGeral: boolean
  /**
   * Quem está marcado para mover em grupo. Não vazio liga o modo de seleção:
   * tocar um livro marca/desmarca em vez de espiar, e tocar área vazia de uma
   * prateleira move o grupo inteiro para lá em vez de criar um livro novo.
   */
  selecionados: ReadonlySet<string>
  onEspiar: (livroId: string) => void
  onAcoes: (livroId: string) => void
  onAlternarSelecao: (livroId: string) => void
  onMoverSelecionadosPara: (prateleira: number) => void
  /** Move o livro para `(prateleira, posicao)` — mesma assinatura da store. */
  onMover: (livroId: string, prateleira: number, posicao: number) => void
  onNovo: (prateleira: number) => void
}

/**
 * O móvel: a estante em que os livros moram.
 *
 * Pilastras caneladas nas laterais, cornija em cima, prateleiras com a penumbra
 * da tábua de cima caindo sobre os livros, e o assoalho no pé. Tudo em CSS — não
 * é imagem, então acompanha o tema e a largura da tela.
 *
 * As lombadas escuras são enfeite: a biblioteca que ainda não foi escrita. Não
 * têm título, e a luz não as alcança — mas tocar nelas escreve um livro ali.
 */
export function Movel({
  estante,
  pontes,
  selecionadoId,
  chegandoId,
  quantidadeDePrateleiras,
  intensidadeDaLuz,
  visaoGeral,
  selecionados,
  onEspiar,
  onAcoes,
  onAlternarSelecao,
  onMoverSelecionadosPara,
  onMover,
  onNovo,
}: Props) {
  const selecionando = selecionados.size > 0

  const prateleiras = useMemo(
    () => montarPrateleiras(estante, quantidadeDePrateleiras),
    [estante, quantidadeDePrateleiras],
  )
  const { gesto, manipular, registrarFantasma } = useManipularLivros({
    // Selecionando, tocar marca/desmarca em vez de espiar — o resto do gesto
    // (segurar, arrastar um livro só) continua igual, sem precisar o hook
    // saber que existe seleção.
    onEspiar: selecionando ? onAlternarSelecao : onEspiar,
    onAcoes,
    // A folga entre o livro sob o dedo e a posição final: o hook só sabe qual
    // livro está embaixo do dedo e em qual prateleira — quem sabe a lista
    // ordenada daquela prateleira é este componente.
    onMover: (livroId, prateleira, antesDe) => {
      const lista = (prateleiras[prateleira]?.livros ?? [])
        .map(({ item }) => item.livro.id)
        .filter((id) => id !== livroId)
      const posicao = antesDe === null ? lista.length : lista.indexOf(antesDe)
      onMover(livroId, prateleira, posicao === -1 ? lista.length : posicao)
    },
  })

  // Quem está na mão manda: segurar outro livro com um painel aberto acende as
  // pontes do que está na mão, não as do painel.
  const focoId = gesto.livroId ?? selecionadoId
  const pontesDoFoco = focoId === null ? undefined : pontes.get(focoId)
  const naMao =
    gesto.fase === 'arrastando' ? estante.find((e) => e.livro.id === gesto.livroId) : undefined

  function estadoDe(livroId: string): EstadoDaLombada {
    if (gesto.livroId === livroId) return gesto.fase === 'arrastando' ? 'vazio' : 'erguido'
    return selecionadoId === livroId ? 'escolhido' : 'repouso'
  }

  return (
    // O número de prateleiras é o divisor de que a folha precisa para a estante
    // se medir pela tela (ver .movel-fila em index.css).
    <div
      className="movel cores-de-antes"
      data-visao-geral={visaoGeral || undefined}
      style={{ '--mv-prateleiras': prateleiras.length } as CSSProperties}
    >
      <span className="movel-cornija" aria-hidden />

      <div className="movel-corpo">
        {prateleiras.map((p, indice) => (
          <div
            className="movel-vao"
            key={p.chave}
            data-prateleira={indice}
            data-alvo-vazio={
              (gesto.fase === 'arrastando' &&
                gesto.alvoPrateleira === indice &&
                gesto.alvoId === null) ||
              undefined
            }
          >
            {/* Fica atrás da fileira; as lombadas de enfeite deixam o toque
                passar até ele, e os livros de verdade, não. Um botão só por
                prateleira, e não um por lombada escura: é o que o teclado e o
                leitor de tela conseguem alcançar. */}
            <button
              type="button"
              className="movel-criar"
              aria-label={
                selecionando
                  ? `Mover os livros marcados para a prateleira ${String(indice + 1)}`
                  : `Criar um livro na prateleira ${String(indice + 1)}`
              }
              onClick={() => {
                if (selecionando) onMoverSelecionadosPara(indice)
                else onNovo(indice)
              }}
            />

            <div className="movel-fila">
              {p.livros.map(({ item, largura }) => (
                <Lombada
                  key={item.livro.id}
                  item={item}
                  largura={largura}
                  estado={estadoDe(item.livro.id)}
                  alvo={gesto.alvoId === item.livro.id}
                  ponte={(pontesDoFoco?.get(item.livro.id) ?? 0) > 0}
                  chegando={chegandoId === item.livro.id}
                  selecionado={selecionados.has(item.livro.id)}
                  intensidadeDaLuz={intensidadeDaLuz}
                  manipular={manipular(item.livro.id)}
                />
              ))}
              {p.enfeites.map((e) => (
                <LombadaDeEnfeite key={e.chave} enfeite={e} />
              ))}
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

function LombadaDeEnfeite({ enfeite }: { enfeite: Enfeite }) {
  const classes = ['lombada', 'lombada--enfeite']
  if (enfeite.filete) classes.push('lombada--filete')
  if (enfeite.etiqueta) classes.push('lombada--etiqueta')

  return (
    <span
      aria-hidden
      className={classes.join(' ')}
      style={{
        // A mesma regra da lombada de verdade — a luz lava a cor do pano —, só
        // que com muito menos luz chegando: 8..38% contra os 58% de um livro
        // seu. É o que faz os seus saltarem no meio deles.
        backgroundColor: `color-mix(in oklab, var(--lombada-${String(enfeite.pano)}) ${String(Math.round(8 + enfeite.luz * 30))}%, var(--lavagem))`,
        height: `${String(enfeite.altura)}%`,
        width: `${String(enfeite.largura)}px`,
        transform:
          enfeite.inclinacao === 0 ? undefined : `rotate(${String(enfeite.inclinacao)}deg)`,
      }}
    />
  )
}
