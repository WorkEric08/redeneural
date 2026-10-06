import type { Id } from '../domain/types'

import type { NoDoGrafo, PerfilDoPalacio } from './grafo'
import { centralizar, produtoInterno } from './vetores'

/** Quantos neurônios mais parecidos votam no livro de um neurônio novo. */
export const VIZINHOS_QUE_VOTAM = 5

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * O livro de um neurônio novo escrito em "Automático": **sempre um livro**
 * (decisão do usuário, 07/10/2026 — antes, sem resposta clara o neurônio ficava no
 * porto esperando a pessoa escolher). `null` só quando não existe livro nenhum que
 * possa recebê-lo (`disponiveis` vazio): aí não há o que escolher.
 *
 * Votam os `VIZINHOS_QUE_VOTAM` neurônios mais parecidos **que moram num livro
 * disponível**, pelo cosseno centralizado no perfil congelado, e vence o livro com
 * mais votos. Empate: o de maior soma de cossenos (o mais perto do texto), e depois
 * o que vem primeiro na estante. Não há mínimo de votos: com três neurônios num
 * palácio, o mais parecido já decide.
 *
 * **Não é a soma das conexões fortes** que o plano previa — calibrado com o e5
 * de verdade (01/10/2026), essa regra errava muito: neste palácio as conexões
 * mais fortes atravessam livros de propósito (são as pontes), e no seed ela
 * mandaria 7 de 9 neurônios para o livro errado. O voto, nas mesmas 33 notas
 * de teste, decidiu 17 sozinho com 4 erros quando só valia com 3 votos; agora ele
 * decide todos, e o aviso "Guardado em… Mudar" é a saída para os que ele errar.
 *
 * `disponiveis` são os livros que podem receber um neurônio sozinhos — os de
 * conceitos que não são executáveis (esses só por escolha) —, **na ordem da
 * estante**: é o desempate, e o destino de um palácio que ainda não tem vizinho
 * nenhum para votar (o primeiro neurônio, ou texto sem vetor). Quem está num livro
 * fora dessa lista, ou no porto, não vota: o texto vai para o livro disponível que
 * mais se parece com ele, não para o que mais se parece e não pode recebê-lo.
 */
export function livroAutomatico(
  alvo: Pick<NoDoGrafo, 'id' | 'embedding'>,
  nos: readonly Pick<NoDoGrafo, 'id' | 'livroId' | 'embedding'>[],
  perfil: Pick<PerfilDoPalacio, 'centroide'>,
  disponiveis: readonly Id[],
): Id | null {
  const primeiro = disponiveis[0]
  if (primeiro === undefined) return null

  const ordemNaEstante = new Map(disponiveis.map((id, i) => [id, i]))
  const meu = centralizar(alvo.embedding, perfil.centroide)

  const maisParecidos = nos
    .filter((no) => no.id !== alvo.id && no.livroId !== null && ordemNaEstante.has(no.livroId))
    .map((no) => ({
      id: no.id,
      livroId: no.livroId as Id,
      cos: produtoInterno(meu, centralizar(no.embedding, perfil.centroide)),
    }))
    .sort((x, y) => y.cos - x.cos || comparar(x.id, y.id))
    .slice(0, VIZINHOS_QUE_VOTAM)

  const placar = new Map<Id, { votos: number; soma: number }>()
  for (const v of maisParecidos) {
    const atual = placar.get(v.livroId) ?? { votos: 0, soma: 0 }
    placar.set(v.livroId, { votos: atual.votos + 1, soma: atual.soma + v.cos })
  }

  let melhor: Id = primeiro
  let melhorPlacar: { votos: number; soma: number } | undefined
  for (const [livroId, p] of placar) {
    const ganha =
      melhorPlacar === undefined ||
      p.votos > melhorPlacar.votos ||
      (p.votos === melhorPlacar.votos && p.soma > melhorPlacar.soma) ||
      (p.votos === melhorPlacar.votos &&
        p.soma === melhorPlacar.soma &&
        (ordemNaEstante.get(livroId) ?? 0) < (ordemNaEstante.get(melhor) ?? 0))
    if (ganha) {
      melhor = livroId
      melhorPlacar = p
    }
  }
  return melhor
}
