/**
 * Os painéis da estante moram na URL, e não em estado local.
 *
 * É a mesma regra que fez criar e editar neurônio virarem rotas (ver
 * `router.tsx`): no Android, o botão voltar tem que fechar o que está aberto, e
 * só fecha se abrir tiver deixado uma entrada no histórico. Uma busca na URL
 * deixa essa entrada sem inventar rota nova, e a estante continua montada por
 * baixo do painel.
 */

export type TipoComLivro = 'espiar' | 'acoes' | 'editar' | 'apagar'

export type Painel = { tipo: TipoComLivro; livroId: string }

const COM_LIVRO: readonly TipoComLivro[] = ['espiar', 'acoes', 'editar', 'apagar']

export function lerPainel(busca: URLSearchParams): Painel | null {
  for (const tipo of COM_LIVRO) {
    const livroId = busca.get(tipo)
    if (livroId) return { tipo, livroId }
  }

  return null
}

export function buscaDoPainel(painel: Painel): string {
  return `?${new URLSearchParams({ [painel.tipo]: painel.livroId }).toString()}`
}
