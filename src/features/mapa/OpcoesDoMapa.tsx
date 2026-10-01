import { Waypoints } from 'lucide-react'

import { botao } from '@/components/botao'
import { contar } from '@/lib/plural'

import { TRACEJADO_DA_TRILHA_PX } from './desenharMapa'
import { PONTES_POR_ILHA } from './pontes'

interface Props {
  todasAsPontes: boolean
  onAlternarPontes: () => void
  /** Quantas pontes ficam de fora de longe, sem "Ver todas as pontes". */
  escondidas: number
}

/**
 * A folha do Mapa — o lugar dos filtros da Rede, no outro modo: o que mostrar
 * de longe e a legenda do que se vê. Só existe no Mapa.
 */
export function OpcoesDoMapa({ todasAsPontes, onAlternarPontes, escondidas }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="rotulo-de-secao">Mostrar</h2>
        <button
          type="button"
          onClick={onAlternarPontes}
          aria-pressed={todasAsPontes}
          className={botao({ tipo: 'secundario', tamanho: 'pequeno' })}
        >
          {/* O ícone acende na cor de ponte porque é o desenho da ponte — o
              botão em si continua sem ela. */}
          <Waypoints
            size={16}
            aria-hidden
            className={todasAsPontes ? 'text-ponte' : 'text-poeira'}
          />
          Ver todas as pontes
        </button>
        <p className="text-poeira mt-2 px-1 text-xs leading-relaxed">
          De longe, cada ilha mostra só as {String(PONTES_POR_ILHA)} pontes mais fortes
          {escondidas > 0 && !todasAsPontes
            ? ` — ${contar(escondidas, 'fica escondida', 'ficam escondidas')}.`
            : '.'}{' '}
          De perto, aparecem todas.
        </p>
      </section>

      <section>
        <h2 className="rotulo-de-secao">Legenda</h2>
        <ul className="cartao divide-linha flex flex-col divide-y">
          <li className="flex items-center gap-3.5 px-4 py-3">
            <Amostra tipo="trilha" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">Trilha</p>
              <p className="text-poeira text-xs leading-relaxed">
                Conexão entre neurônios do mesmo livro. Aparece de perto.
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3.5 px-4 py-3">
            <Amostra tipo="ponte" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">Ponte</p>
              <p className="text-poeira text-xs leading-relaxed">
                As conexões entre dois livros, juntas numa só: quanto mais conexões, mais grossa.
                Toque para ver quais são.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}

/** O traço de cada um, como o mapa desenha: a trilha fina e tracejada, a ponte cheia. */
function Amostra({ tipo }: { tipo: 'trilha' | 'ponte' }) {
  return (
    <svg width="34" height="12" viewBox="0 0 34 12" aria-hidden className="shrink-0">
      {tipo === 'trilha' ? (
        <line
          x1="2"
          y1="6"
          x2="32"
          y2="6"
          style={{ stroke: 'var(--rede-fio)' }}
          strokeWidth={1}
          strokeDasharray={TRACEJADO_DA_TRILHA_PX.join(' ')}
        />
      ) : (
        <line
          x1="3"
          y1="6"
          x2="31"
          y2="6"
          style={{ stroke: 'var(--ponte)' }}
          strokeWidth={3.5}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}
    </svg>
  )
}
