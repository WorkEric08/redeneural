import type { Id, Neuronio } from './types'

/**
 * Um neurônio como a tela o vê.
 *
 * Sem o `embedding`: o vetor não serve para renderizar nada e são ~1,5 KB por
 * neurônio atravessando a fronteira do Worker a cada carga. O que a tela precisa
 * saber sobre ele cabe num booleano.
 */
export interface NeuronioNaTela {
  id: Id
  livroId: Id
  titulo: string
  conteudo: string
  /** A inferência ainda não terminou — mostrar como "processando…". */
  processando: boolean
  createdAt: Date
  updatedAt: Date
}

export function paraTela(n: Neuronio): NeuronioNaTela {
  return {
    id: n.id,
    livroId: n.livroId,
    titulo: n.titulo,
    conteudo: n.conteudo,
    processando: n.embedding === null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }
}
