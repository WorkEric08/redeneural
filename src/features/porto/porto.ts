import type { NeuronioNaTela } from '@/core'

/** O que a tela mostra no lugar do nome do livro de um neurônio no porto. */
export const ROTULO_DO_PORTO = 'No porto'

/** Os neurônios esperando livro, na ordem em que a store já os tem (o mais recente primeiro). */
export function noPorto(neuronios: readonly NeuronioNaTela[]): NeuronioNaTela[] {
  return neuronios.filter((n) => n.livroId === null)
}
