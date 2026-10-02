import { estaAdormecida, estadoVisivel, type Id, type Livro, type NeuronioNaTela } from '@/core'

/**
 * O que a Rede e o Mapa desenham diferente nas ideias executáveis: as
 * adormecidas (na névoa) e as feitas (com o anel). Calculado na hora de
 * mostrar, com o relógio de quem mostra. Uma ideia de livro que não é
 * executável não entra em nenhuma das duas.
 */
export function marcasDoAndamento(
  neuronios: readonly NeuronioNaTela[],
  livros: readonly Livro[],
  agora: Date,
): { adormecidas: Set<Id>; feitas: Set<Id> } {
  const livroDe = new Map(livros.map((l) => [l.id, l]))
  const adormecidas = new Set<Id>()
  const feitas = new Set<Id>()
  for (const n of neuronios) {
    const livro = n.livroId === null ? undefined : livroDe.get(n.livroId)
    if (estaAdormecida(n, livro, agora)) adormecidas.add(n.id)
    else if (estadoVisivel(n, livro) === 'feita') feitas.add(n.id)
  }
  return { adormecidas, feitas }
}
