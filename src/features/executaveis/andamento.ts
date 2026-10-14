import { estaAdormecida, estadoVisivel, type Id, type Livro, type NeuronioNaTela } from '@/core'

/**
 * O que a Rede e o Mapa desenham diferente nas ideias executáveis: o círculo de cada uma diz o
 * andamento (14/10/2026) — **para fazer** é um círculo cinza, **fazendo** é um círculo cinza com um
 * leve brilho amarelo, **feita** é o amarelo cheio — e as adormecidas ficam na névoa. Calculado na
 * hora de mostrar, com o relógio de quem mostra. Uma ideia de livro que não é executável não entra
 * em nenhum grupo: continua o ponto de sempre.
 *
 * - `feitas`: o amarelo cheio. Uma ideia feita nunca dorme.
 * - `fazendo`: só as **acordadas** em andamento — uma que dorme perde o brilho, como o livro perde o ponto.
 * - `paraFazer`: o círculo cinza — as que estão para fazer e também as adormecidas (que continuam
 *   cinza, só que na névoa).
 * - `adormecidas`: na névoa; se somam a `paraFazer` quando não são feitas.
 */
export function marcasDoAndamento(
  neuronios: readonly NeuronioNaTela[],
  livros: readonly Livro[],
  agora: Date,
): { adormecidas: Set<Id>; feitas: Set<Id>; fazendo: Set<Id>; paraFazer: Set<Id> } {
  const livroDe = new Map(livros.map((l) => [l.id, l]))
  const adormecidas = new Set<Id>()
  const feitas = new Set<Id>()
  const fazendo = new Set<Id>()
  const paraFazer = new Set<Id>()
  for (const n of neuronios) {
    const livro = n.livroId === null ? undefined : livroDe.get(n.livroId)
    const estado = estadoVisivel(n, livro)
    if (estado === null) continue
    const dorme = estaAdormecida(n, livro, agora)
    if (dorme) adormecidas.add(n.id)
    if (estado === 'feita') feitas.add(n.id)
    else if (estado === 'fazendo' && !dorme) fazendo.add(n.id)
    else paraFazer.add(n.id)
  }
  return { adormecidas, feitas, fazendo, paraFazer }
}
