import { ArrowLeft, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { botao } from './botao'

interface Props {
  titulo: ReactNode
  /**
   * Para onde "voltar" leva quando o app abriu direto nesta tela (link,
   * recarregar a página) e não há tela anterior dentro dele.
   */
  voltarPara: string
  /** Tela se volta; formulário se fecha. */
  icone?: 'voltar' | 'fechar'
  /** Ações à direita — ícones com rótulo acessível. */
  acoes?: ReactNode
}

/**
 * A barra de app das telas internas: voltar, título e ações.
 *
 * Voltar é o histórico, e não um link fixo para a estante — é o mesmo que o
 * botão do Android faz, então os dois nunca discordam. Presa no topo ao rolar
 * (`.barra-de-topo`).
 */
export function BarraDeTopo({ titulo, voltarPara, icone = 'voltar', acoes }: Props) {
  const navegar = useNavigate()
  const { key } = useLocation()

  return (
    <header className="barra-de-topo">
      <button
        type="button"
        aria-label={icone === 'fechar' ? 'Fechar' : 'Voltar'}
        className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
        onClick={() => {
          // O React Router chama de 'default' a primeira entrada da sessão.
          if (key === 'default') void navegar(voltarPara, { replace: true })
          else void navegar(-1)
        }}
      >
        {icone === 'fechar' ? <X size={22} aria-hidden /> : <ArrowLeft size={22} aria-hidden />}
      </button>

      <div className="barra-de-topo-titulo">{titulo}</div>

      {acoes !== undefined && <div className="flex items-center gap-1">{acoes}</div>}
    </header>
  )
}
