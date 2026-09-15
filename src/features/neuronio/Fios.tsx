import { Link } from 'react-router-dom'

import type { VizinhoDoNeuronio } from '@/features/estante/resumo'

/**
 * A lista de fios de um neurônio. Compartilhada entre o livro aberto e a tela
 * do próprio neurônio — é a mesma informação, e ela tem uma forma só.
 *
 * Cada fio é uma linha de toque inteira (44 px), não só o nome: o dedo não
 * precisa acertar a palavra. A ponte leva o nome do livro do outro lado numa
 * segunda linha, porque é isso que faz "atravessa livros" querer dizer algo.
 */
export function Fios({ lista }: { lista: readonly VizinhoDoNeuronio[] }) {
  if (lista.length === 0) {
    return <p className="text-poeira px-2 py-3 text-sm">Sem conexões ainda.</p>
  }

  return (
    <ul className="flex flex-col">
      {lista.map((v) => (
        <li key={v.conexao.id}>
          <Link
            to={`/neuronio/${v.outroId}`}
            className="active:bg-realce hover:bg-realce/60 flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors"
          >
            <Fio score={v.conexao.score} cross={v.conexao.cross} />
            <span className="min-w-0 flex-1">
              <span
                className={
                  v.conexao.cross
                    ? 'text-ponte brilho-ponte-texto-sm block truncate text-sm'
                    : 'text-papel block truncate text-sm'
                }
              >
                {v.outroTitulo}
              </span>
              {v.conexao.cross && (
                <span className="text-poeira block truncate text-xs">em {v.outroLivro}</span>
              )}
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
function Fio({ score, cross }: { score: number; cross: boolean }) {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden className="shrink-0">
      <line
        x1="1"
        y1="6"
        x2="25"
        y2="6"
        stroke={cross ? 'var(--ponte)' : 'var(--poeira)'}
        strokeWidth={score === 0 ? 1 : 1 + score * 2.6}
        strokeLinecap="round"
        strokeDasharray={score === 0 ? '2 3' : undefined}
        opacity={score === 0 ? 0.45 : 0.35 + score * 0.6}
        style={cross ? { filter: 'drop-shadow(0 0 3px var(--ponte-luz))' } : undefined}
      />
    </svg>
  )
}
