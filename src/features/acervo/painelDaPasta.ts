import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Os painéis da pasta moram na URL, como os da estante (ver `features/estante/painel.ts`):
 * voltar tem que fechar o que está aberto, e uma busca deixa essa entrada no histórico sem
 * desmontar a pasta por baixo.
 *
 * - `?item=<id>`: o menu de um item — trocar ou excluir.
 * - `?apagar=<id>`: a pergunta de excluir.
 */
export type PainelDaPasta = { tipo: 'acoes' | 'apagar'; anexoId: string }

export function lerPainelDaPasta(busca: URLSearchParams): PainelDaPasta | null {
  const apagar = busca.get('apagar')
  if (apagar) return { tipo: 'apagar', anexoId: apagar }
  const item = busca.get('item')
  if (item) return { tipo: 'acoes', anexoId: item }
  return null
}

function buscaDoPainel(painel: PainelDaPasta): string {
  const chave = painel.tipo === 'acoes' ? 'item' : 'apagar'
  return `?${new URLSearchParams({ [chave]: painel.anexoId }).toString()}`
}

/**
 * - `abrir` empilha: voltar fecha.
 * - `trocar` substitui: do menu para "excluir", voltar leva à pasta, não ao menu — menu é
 *   caminho, não lugar.
 * - `fechar` volta uma casa, a não ser que o app tenha aberto direto no painel.
 */
export function usePainelDaPasta() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()

  const abrir = useCallback(
    (painel: PainelDaPasta) => {
      void navegar({ search: buscaDoPainel(painel) })
    },
    [navegar],
  )

  const trocar = useCallback(
    (painel: PainelDaPasta) => {
      void navegar({ search: buscaDoPainel(painel) }, { replace: true })
    },
    [navegar],
  )

  const fechar = useCallback(() => {
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }, [key, navegar])

  return { painel: lerPainelDaPasta(busca), abrir, trocar, fechar }
}
