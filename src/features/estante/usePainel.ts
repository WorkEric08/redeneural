import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { buscaDoPainel, lerPainel, type Painel } from './painel'

/**
 * Abre, troca e fecha os painéis da estante pelo histórico (ver `painel.ts`).
 *
 * - `abrir` empilha: voltar fecha.
 * - `trocar` substitui: das ações para "renomear", voltar leva à estante, não ao
 *   menu de novo — menu é caminho, não lugar.
 * - `fechar` volta uma casa, a não ser que o app tenha aberto direto no painel
 *   (link, recarregar a página): aí não há casa dentro do app para voltar.
 */
export function usePainel() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()

  const abrir = useCallback(
    (painel: Painel) => {
      void navegar({ search: buscaDoPainel(painel) })
    },
    [navegar],
  )

  const trocar = useCallback(
    (painel: Painel) => {
      void navegar({ search: buscaDoPainel(painel) }, { replace: true })
    },
    [navegar],
  )

  const fechar = useCallback(() => {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }, [key, navegar])

  return { painel: lerPainel(busca), abrir, trocar, fechar }
}
