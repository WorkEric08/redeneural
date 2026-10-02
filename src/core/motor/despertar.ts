import { estaAdormecida } from '../domain/executavel'
import type { Conexao, Id, Livro, Neuronio } from '../domain/types'

/**
 * A partir deste score uma conexão é **forte** — o lugar único do documento.
 * Hoje só o despertar a usa: o Porto vota pelos mais parecidos (ver
 * `livroDoPorto`), e não pelas conexões fortes.
 *
 * Calibrado com o e5 de verdade (01/10/2026): cada uma das 33 notas de teste
 * entrou como "nova" no palácio das outras, com a régua do motor. De 0,7 para
 * cima todo par é parente de verdade — débito técnico e refatoração, reserva de
 * emergência e antifrágil, cache e memória de trabalho, o grupo dos recomeços.
 * Entre 0,6 e 0,7 aparecem pares fracos, e abaixo de 0,6 os falsos ("Ansiedade
 * antes de apresentar" com "Ouvido relativo"). Com 0,7, 20 das 33 notas
 * acordariam alguém, por 37 conexões.
 *
 * O score é relativo à escala do próprio palácio (`escalaEmb`, o p90 do melhor
 * cosseno de cada nó), por isso o número vale para um palácio de outro tamanho.
 */
export const LIMIAR_FORTE = 0.7

export interface Despertar {
  /** As ideias de livro executável ligadas forte à nova — todas ganham um toque. */
  tocadas: Id[]
  /** Dessas, as que estavam adormecidas, da conexão mais forte para a mais fraca. */
  acordadas: Id[]
}

/**
 * Quem a ideia nova (em qualquer livro) desperta: toda ideia de livro
 * executável ligada a ela por uma conexão forte. Puro — quem grava o toque é o
 * motor, e quem diz quem acordou é a tela.
 */
export function quemDesperta(
  novoId: Id,
  conexoes: readonly Pick<Conexao, 'aId' | 'bId' | 'score'>[],
  ideias: ReadonlyMap<Id, Pick<Neuronio, 'livroId' | 'estado' | 'ultimoToque'>>,
  livros: ReadonlyMap<Id, Pick<Livro, 'executavel' | 'diasParaAdormecer'>>,
  agora: Date,
): Despertar {
  const fortes = conexoes
    .filter((c) => (c.aId === novoId || c.bId === novoId) && c.score >= LIMIAR_FORTE)
    .map((c) => ({ id: c.aId === novoId ? c.bId : c.aId, score: c.score }))
    .sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))

  const tocadas: Id[] = []
  const acordadas: Id[] = []
  for (const { id } of fortes) {
    const ideia = ideias.get(id)
    if (!ideia || ideia.livroId === null || id === novoId) continue
    const livro = livros.get(ideia.livroId)
    if (!livro?.executavel || tocadas.includes(id)) continue
    tocadas.push(id)
    if (estaAdormecida(ideia, livro, agora)) acordadas.push(id)
  }
  return { tocadas, acordadas }
}
