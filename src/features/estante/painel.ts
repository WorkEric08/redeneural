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
type TipoComPrateleira = 'novo' | 'etiqueta'

// Cada variante listada à parte, e não `{ tipo: TipoComPrateleira; ... }`: um
// discriminante com tipo união não é a mesma coisa de um por membro — o
// TypeScript não estreita `painel.tipo !== 'novo' && !== 'etiqueta'` até
// eliminar o `prateleira` do jeito que estreitaria dois membros distintos.
export type Painel =
  | { tipo: TipoComLivro; livroId: string }
  | { tipo: 'novo'; prateleira: number }
  | { tipo: 'etiqueta'; prateleira: number }
  | { tipo: 'ordenar' }

const COM_LIVRO: readonly TipoComLivro[] = ['espiar', 'acoes', 'editar', 'apagar']
const COM_PRATELEIRA: readonly TipoComPrateleira[] = ['novo', 'etiqueta']

export function lerPainel(busca: URLSearchParams): Painel | null {
  for (const tipo of COM_LIVRO) {
    const livroId = busca.get(tipo)
    if (livroId) return { tipo, livroId }
  }

  for (const tipo of COM_PRATELEIRA) {
    const valor = busca.get(tipo)
    if (valor === null || valor === '') continue
    const prateleira = Number(valor)
    if (Number.isInteger(prateleira) && prateleira >= 0) return { tipo, prateleira }
  }

  if (busca.get('ordenar') !== null) return { tipo: 'ordenar' }

  return null
}

export function buscaDoPainel(painel: Painel): string {
  if (painel.tipo === 'ordenar') return `?${new URLSearchParams({ ordenar: '1' }).toString()}`
  const valor =
    painel.tipo === 'novo' || painel.tipo === 'etiqueta'
      ? String(painel.prateleira)
      : painel.livroId
  return `?${new URLSearchParams({ [painel.tipo]: valor }).toString()}`
}
