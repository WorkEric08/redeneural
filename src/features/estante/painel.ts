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

export type Painel =
  | { tipo: TipoComLivro; livroId: string }
  /** O menu de um lugar sem livro: criar ali, pôr ou tirar o enfeite. */
  | { tipo: 'lugar'; prateleira: number; lugar: number }

const COM_LIVRO: readonly TipoComLivro[] = ['espiar', 'acoes', 'editar', 'apagar']

/** `?lugar=2-7`: prateleira e lugar, contados do zero como no banco. */
const LUGAR = /^(\d{1,3})-(\d{1,3})$/

export function lerPainel(busca: URLSearchParams): Painel | null {
  for (const tipo of COM_LIVRO) {
    const livroId = busca.get(tipo)
    if (livroId) return { tipo, livroId }
  }

  const lugar = LUGAR.exec(busca.get('lugar') ?? '')
  if (lugar) return { tipo: 'lugar', prateleira: Number(lugar[1]), lugar: Number(lugar[2]) }

  return null
}

export function buscaDoPainel(painel: Painel): string {
  const valor =
    painel.tipo === 'lugar'
      ? `${String(painel.prateleira)}-${String(painel.lugar)}`
      : painel.livroId
  return `?${new URLSearchParams({ [painel.tipo]: valor }).toString()}`
}
