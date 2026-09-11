import { Link } from 'react-router-dom'

import type { VizinhoDoNeuronio } from '@/features/estante/resumo'

/**
 * A lista de fios de um neurônio. Compartilhada entre o livro aberto e a tela
 * do próprio neurônio — é a mesma informação, e ela tem uma forma só.
 */
export function Fios({ lista }: { lista: readonly VizinhoDoNeuronio[] }) {
  if (lista.length === 0) {
    return <p className="text-poeira text-xs">Sem conexões ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-1 pt-1">
      {lista.map((v) => (
        <li key={v.conexao.id}>
          <Link to={`/neuronio/${v.outroId}`} className="flex items-baseline gap-2 py-1 text-sm">
            <Fio score={v.conexao.score} cross={v.conexao.cross} />
            <span className={v.conexao.cross ? 'text-ouro min-w-0 flex-1' : 'min-w-0 flex-1'}>
              {v.outroTitulo}
              {v.conexao.cross && <span className="text-poeira text-xs"> · {v.outroLivro}</span>}
            </span>
            <span className="text-poeira font-dado shrink-0 text-xs tabular-nums">
              {v.conexao.score.toFixed(3)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Espessura e opacidade seguem o score. Score zero é tracejado: a regra "nunca
 * órfão" às vezes liga alguém ao menos ruim dos distantes, e tracejado diz "é o
 * mais perto que existe", não "é parentesco".
 */
export function Fio({ score, cross }: { score: number; cross: boolean }) {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden className="mt-1 shrink-0">
      <line
        x1="1"
        y1="6"
        x2="25"
        y2="6"
        stroke={cross ? 'var(--ouro)' : 'var(--poeira)'}
        strokeWidth={score === 0 ? 1 : 1 + score * 2.6}
        strokeLinecap="round"
        strokeDasharray={score === 0 ? '2 3' : undefined}
        opacity={score === 0 ? 0.45 : 0.35 + score * 0.6}
        style={cross ? { filter: 'drop-shadow(0 0 3px var(--ouro-luz))' } : undefined}
      />
    </svg>
  )
}
