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

export type Painel = { tipo: TipoComLivro; livroId: string } | { tipo: 'novo'; prateleira: number }

const COM_LIVRO: readonly TipoComLivro[] = ['espiar', 'acoes', 'editar', 'apagar']

export function lerPainel(busca: URLSearchParams): Painel | null {
  for (const tipo of COM_LIVRO) {
    const livroId = busca.get(tipo)
    if (livroId) return { tipo, livroId }
  }

  const novo = busca.get('novo')
  if (novo === null || novo === '') return null

  const prateleira = Number(novo)
  return Number.isInteger(prateleira) && prateleira >= 0 ? { tipo: 'novo', prateleira } : null
}

export function buscaDoPainel(painel: Painel): string {
  const valor = painel.tipo === 'novo' ? String(painel.prateleira) : painel.livroId
  return `?${new URLSearchParams({ [painel.tipo]: valor }).toString()}`
}
