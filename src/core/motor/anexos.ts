import type { Anexo, Id, Vinculo } from '../domain/types'

import { OPCOES_PADRAO, type OpcoesMotor } from './config'
import { escalaEmbedding } from './fusao'
import type { NoDoGrafo, PerfilDoPalacio } from './grafo'
import { centralizar, produtoInterno } from './vetores'

/** Um anexo preso a um conceito, antes de virar linha no banco. */
export interface VinculoCalculado {
  anexoId: Id
  conceitoId: Id
  score: number
}

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Os conceitos que cada anexo escolhe — só num sentido.
 *
 * É o que faz um anexo ser satélite e não neurônio: ele escolhe conceitos pela
 * mesma régua das conexões (cosseno centralizado no perfil congelado, na
 * escala do corpus, corte relativo ao melhor), mas nenhum conceito o escolhe
 * de volta. Não existe `marcasPerdidas` aqui, nem vaga disputada — o grafo de
 * conceitos é idêntico com ou sem anexo nenhum.
 *
 * Duas diferenças para os conceitos, as duas de propósito:
 *
 * - **Sem mínimo.** Um conceito nunca fica órfão; um anexo cujo melhor score é
 *   zero não ganha fio forçado — fica só na pasta. É a resposta automática para
 *   "isto combina com a rede?", sem botão.
 * - **Sem reranker.** Legenda é texto curto, e o reranker está fora do MVP de
 *   qualquer jeito (Fase 3).
 */
export function ancorarAnexos(
  anexos: readonly Pick<Anexo, 'id' | 'embedding'>[],
  conceitos: readonly Pick<NoDoGrafo, 'id' | 'embedding'>[],
  perfil: Pick<PerfilDoPalacio, 'centroide' | 'escalaEmb'>,
  opcoes: OpcoesMotor = OPCOES_PADRAO,
): VinculoCalculado[] {
  if (conceitos.length === 0) return []

  const centrados = conceitos.map((c) => centralizar(c.embedding, perfil.centroide))
  const vinculos: VinculoCalculado[] = []

  for (const anexo of anexos) {
    if (!anexo.embedding) continue
    const meu = centralizar(anexo.embedding, perfil.centroide)

    const ranking = conceitos
      .map((c, i) => ({
        conceitoId: c.id,
        score: escalaEmbedding(produtoInterno(meu, centrados[i]!), perfil.escalaEmb),
      }))
      .sort((x, y) => y.score - x.score || comparar(x.conceitoId, y.conceitoId))

    const melhor = ranking[0]?.score ?? 0
    if (melhor <= 0) continue

    const limite = opcoes.razaoCorte * melhor
    for (const r of ranking.slice(0, opcoes.maxAncoras)) {
      if (r.score < limite) break
      vinculos.push({ anexoId: anexo.id, conceitoId: r.conceitoId, score: r.score })
    }
  }

  return vinculos.sort(
    (x, y) =>
      comparar(x.anexoId, y.anexoId) || y.score - x.score || comparar(x.conceitoId, y.conceitoId),
  )
}

/** O id tem direção — é sempre o anexo que escolhe (ver `Vinculo`). */
export function vinculoId(anexoId: Id, conceitoId: Id): Id {
  return `${anexoId}::${conceitoId}`
}

export function vinculoParaGravar(v: VinculoCalculado, agora: Date): Vinculo {
  return { id: vinculoId(v.anexoId, v.conceitoId), ...v, updatedAt: agora }
}
