import type { CriterioDeOrdenacao, Id, Livro } from '@/core'

/**
 * Ordenação automática — um atalho, não o padrão. O manual continua sendo
 * como a estante se organiza (`moverLivro`); isto só reordena de uma vez o
 * que já está aí.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). Só mexe em `ordem`, nunca
 * em `prateleira`: cada prateleira é ordenada dentro dela mesma, sem livro
 * nenhum trocando de lugar na estante. Devolve só quem mudou, para regravar
 * o mínimo — o mesmo espírito de `moverLivroNaEstante`.
 */

export const CRITERIOS: readonly { criterio: CriterioDeOrdenacao; rotulo: string }[] = [
  { criterio: 'nome', rotulo: 'Nome, de A a Z' },
  { criterio: 'criacao', rotulo: 'Mais recente primeiro' },
  { criterio: 'neuronios', rotulo: 'Mais neurônios primeiro' },
]

export interface MudancaDeOrdem {
  id: Id
  ordem: number
}

function comparadores(
  contagem: ReadonlyMap<Id, number>,
): Record<CriterioDeOrdenacao, (a: Livro, b: Livro) => number> {
  return {
    nome: (a, b) => a.titulo.localeCompare(b.titulo, 'pt'),
    criacao: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    neuronios: (a, b) => (contagem.get(b.id) ?? 0) - (contagem.get(a.id) ?? 0),
  }
}

export function ordenarPorCriterio(
  livros: readonly Livro[],
  neuronios: readonly { livroId: Id }[],
  criterio: CriterioDeOrdenacao,
): MudancaDeOrdem[] {
  const contagem = new Map<Id, number>()
  for (const n of neuronios) contagem.set(n.livroId, (contagem.get(n.livroId) ?? 0) + 1)
  const comparar = comparadores(contagem)[criterio]

  const porPrateleira = new Map<number, Livro[]>()
  for (const l of livros) {
    const lista = porPrateleira.get(l.prateleira)
    if (lista) lista.push(l)
    else porPrateleira.set(l.prateleira, [l])
  }

  const mudancas: MudancaDeOrdem[] = []
  for (const lista of porPrateleira.values()) {
    const ordenada = [...lista].sort(comparar)
    ordenada.forEach((l, ordem) => {
      if (l.ordem !== ordem) mudancas.push({ id: l.id, ordem })
    })
  }
  return mudancas
}

/** Aplica as mudanças sobre a estante em memória — usado pelo otimismo da store. */
export function aplicarMudancasDeOrdem<T extends { id: Id; ordem: number }>(
  livros: readonly T[],
  mudancas: readonly MudancaDeOrdem[],
): T[] {
  const porId = new Map(mudancas.map((m) => [m.id, m.ordem]))
  return livros.map((l) => {
    const ordem = porId.get(l.id)
    return ordem === undefined ? l : { ...l, ordem }
  })
}
