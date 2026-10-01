import type { AnexoNaTela, Id, NeuronioNaTela, Vinculo } from '@/core'

/** Um conceito que o anexo escolheu, já com o que a tela precisa mostrar. */
export interface ConceitoDoAnexo {
  id: Id
  titulo: string
  /** `null`: o conceito está no porto, ainda sem livro. */
  livroId: Id | null
  score: number
  /** 0 é o mais parecido — ver `Vinculo.ordem`. */
  ordem: number
}

/**
 * Os conceitos de cada anexo, do mais parecido para o menos. Pela `ordem`
 * gravada, e não pelo `score`: num palácio pequeno vários saturam em 100%.
 */
export function conceitosPorAnexo(
  vinculos: readonly Vinculo[],
  neuronios: readonly NeuronioNaTela[],
): Map<Id, ConceitoDoAnexo[]> {
  const porId = new Map(neuronios.map((n) => [n.id, n]))
  const mapa = new Map<Id, ConceitoDoAnexo[]>()

  for (const v of vinculos) {
    const n = porId.get(v.conceitoId)
    if (!n) continue
    const item: ConceitoDoAnexo = {
      id: n.id,
      titulo: n.titulo,
      livroId: n.livroId,
      score: v.score,
      ordem: v.ordem,
    }
    const lista = mapa.get(v.anexoId)
    if (lista) lista.push(item)
    else mapa.set(v.anexoId, [item])
  }

  for (const lista of mapa.values()) {
    lista.sort((a, b) => a.ordem - b.ordem || (a.id < b.id ? -1 : 1))
  }
  return mapa
}

/**
 * - `processando`: tem legenda, o modelo ainda não leu.
 * - `sem-legenda`: nada a ler — fica só na pasta.
 * - `solto`: leu, e nada no palácio se parece com ele — fica só na pasta.
 * - `preso`: escolheu pelo menos um conceito.
 */
export type SituacaoDoAnexo = 'processando' | 'sem-legenda' | 'solto' | 'preso'

export function situacaoDoAnexo(
  anexo: AnexoNaTela,
  conceitos: readonly ConceitoDoAnexo[],
): SituacaoDoAnexo {
  if (anexo.processando) return 'processando'
  if (anexo.legenda.trim() === '') return 'sem-legenda'
  return conceitos.length > 0 ? 'preso' : 'solto'
}
