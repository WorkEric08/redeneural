import type { Id } from '../domain/types'

import type { NoDoGrafo, PerfilDoPalacio } from './grafo'
import { centralizar, produtoInterno } from './vetores'

/** Quantos neurônios mais parecidos votam no livro de um neurônio novo. */
export const VIZINHOS_DO_PORTO = 5

/** Quantos votos de um livro só bastam para o motor guardar sem perguntar. */
export const VOTOS_PARA_GUARDAR = 3

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * O livro de um neurônio novo, quando a resposta é clara — `null` quando não
 * é, e aí a pessoa escolhe (o neurônio espera no porto).
 *
 * Votam os `VIZINHOS_DO_PORTO` neurônios mais parecidos, pelo cosseno
 * centralizado no perfil congelado; um livro com `VOTOS_PARA_GUARDAR` deles
 * leva o neurônio.
 *
 * **Não é a soma das conexões fortes** que o plano previa — calibrado com o e5
 * de verdade (01/10/2026), essa regra errava muito: neste palácio as conexões
 * mais fortes atravessam livros de propósito (são as pontes), e no seed ela
 * mandaria 7 de 9 neurônios para o livro errado. O voto, nas mesmas 33 notas
 * de teste, decidiu 17 sozinho com 4 erros; no seed, perguntou sempre e não
 * errou nenhum. Escolha do usuário.
 *
 * `excluir` são livros que nunca recebem neurônio sozinhos (os executáveis).
 * Quem está neles — ou no porto, sem livro — vota, mas não vence: se a maioria
 * apontar para lá, a pergunta é da pessoa.
 */
export function livroDoPorto(
  alvo: Pick<NoDoGrafo, 'id' | 'embedding'>,
  nos: readonly Pick<NoDoGrafo, 'id' | 'livroId' | 'embedding'>[],
  perfil: Pick<PerfilDoPalacio, 'centroide'>,
  excluir: ReadonlySet<Id> = new Set(),
): Id | null {
  const meu = centralizar(alvo.embedding, perfil.centroide)

  const maisParecidos = nos
    .filter((no) => no.id !== alvo.id)
    .map((no) => ({
      id: no.id,
      livroId: no.livroId,
      cos: produtoInterno(meu, centralizar(no.embedding, perfil.centroide)),
    }))
    .sort((x, y) => y.cos - x.cos || comparar(x.id, y.id))
    .slice(0, VIZINHOS_DO_PORTO)

  const votos = new Map<Id, number>()
  for (const v of maisParecidos) {
    if (v.livroId === null || excluir.has(v.livroId)) continue
    votos.set(v.livroId, (votos.get(v.livroId) ?? 0) + 1)
  }

  // Com 5 votantes, dois livros não chegam a 3 ao mesmo tempo: o vencedor, se
  // houver, é único.
  for (const [livroId, quantos] of votos) {
    if (quantos >= VOTOS_PARA_GUARDAR) return livroId
  }
  return null
}
