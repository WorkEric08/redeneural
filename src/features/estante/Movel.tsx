import { useMemo, type CSSProperties } from 'react'

import { Lombada } from './Lombada'
import { montarPrateleiras, type Enfeite } from './prateleiras'
import type { LivroNaEstante } from './resumo'

/**
 * O móvel: a estante em que os livros moram.
 *
 * Pilastras caneladas nas laterais, cornija em cima, prateleiras com a penumbra
 * da tábua de cima caindo sobre os livros, e o assoalho no pé. Tudo em CSS — não
 * é imagem, então acompanha o tema e a largura da tela.
 *
 * As lombadas escuras são enfeite: a biblioteca que ainda não foi escrita. Não
 * têm título nem toque, e a luz não as alcança. Quem ela alcança são os seus
 * livros — é isso que os faz saltar no meio delas.
 */
export function Movel({ estante }: { estante: readonly LivroNaEstante[] }) {
  const prateleiras = useMemo(() => montarPrateleiras(estante), [estante])

  return (
    // O número de prateleiras é o divisor de que a folha precisa para a estante
    // se medir pela tela (ver .movel-fila em index.css).
    <div className="movel" style={{ '--mv-prateleiras': prateleiras.length } as CSSProperties}>
      <span className="movel-cornija" aria-hidden />

      <div className="movel-corpo">
        {prateleiras.map((p) => (
          <div className="movel-vao" key={p.chave}>
            <div className="movel-fila">
              {p.livros.map((l) => (
                <Lombada key={l.item.livro.id} item={l.item} largura={l.largura} />
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
