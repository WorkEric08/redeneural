import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

/**
 * O visor de imagens mora na URL (`?ver=<id da imagem>`), como as folhas: voltar — o gesto do
 * Android — fecha o visor em vez de sair da tela, e recarregar a página o reabre.
 *
 * - `abrir` empilha: voltar fecha.
 * - `trocar` substitui: passar de uma imagem para a outra não enche o histórico com uma
 *   entrada por foto.
 * - `fechar` volta uma casa, a não ser que o app tenha aberto direto no visor.
 *
 * `ids` são os das imagens que o visor percorre, na ordem em que aparecem. Um `?ver=` que não
 * está entre eles (a imagem foi apagada) é como não ter visor aberto.
 */
export function useVisorNaUrl(ids: readonly string[]) {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()

  const ver = busca.get('ver')
  const posicao = ver === null ? -1 : ids.indexOf(ver)

  const abrir = useCallback(
    (id: string) => {
      void navegar({ search: `?ver=${encodeURIComponent(id)}` })
    },
    [navegar],
  )

  const trocar = useCallback(
    (indice: number) => {
      const id = ids[indice]
      if (id !== undefined) {
        void navegar({ search: `?ver=${encodeURIComponent(id)}` }, { replace: true })
      }
    },
    [ids, navegar],
  )

  const fechar = useCallback(() => {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }, [key, navegar])

  return { aberto: posicao >= 0, indice: Math.max(0, posicao), abrir, trocar, fechar }
}
