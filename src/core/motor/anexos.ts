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
  /** 0 é o conceito mais parecido — ver `Vinculo.ordem`. */
  ordem: number
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

    // Ordena e corta pelo cosseno, antes do teto de 1 da escala: num palácio
    // pequeno a escala do corpus é minúscula e vários conceitos saturam em
    // 100% — empatados, a ordem sairia pelo id e não pela proximidade (visto
    // no navegador com o seed, 24/09/2026). Fora da saturação dá exatamente o
    // mesmo resultado, porque a escala é só um divisor.
    const ranking = conceitos
      .map((c, i) => ({ conceitoId: c.id, cos: produtoInterno(meu, centrados[i]!) }))
      .sort((x, y) => y.cos - x.cos || comparar(x.conceitoId, y.conceitoId))

    const melhor = ranking[0]?.cos ?? 0
    if (melhor <= 0) continue

    const limite = opcoes.razaoCorte * melhor
    for (const [ordem, r] of ranking.slice(0, opcoes.maxAncoras).entries()) {
      if (r.cos < limite) break
      vinculos.push({
        anexoId: anexo.id,
        conceitoId: r.conceitoId,
        score: escalaEmbedding(r.cos, perfil.escalaEmb),
        ordem,
      })
    }
  }

  return vinculos.sort((x, y) => comparar(x.anexoId, y.anexoId) || x.ordem - y.ordem)
}

/** O id tem direção — é sempre o anexo que escolhe (ver `Vinculo`). */
export function vinculoId(anexoId: Id, conceitoId: Id): Id {
  return `${anexoId}::${conceitoId}`
}

export function vinculoParaGravar(v: VinculoCalculado, agora: Date): Vinculo {
  return { id: vinculoId(v.anexoId, v.conceitoId), ...v, updatedAt: agora }
}
