import type { CriarNeuronioInput } from '../ports/engine'

import type { Neuronio } from './types'

/**
 * Monta o neurônio que será persistido antes de a inferência começar.
 *
 * `embedding: null` de propósito: o texto do usuário é gravado primeiro, e o
 * vetor chega depois. Se o Worker morrer no meio, o que se perde é o cálculo,
 * nunca o que a pessoa escreveu.
 *
 * Nasce sem estado: quem guarda num livro executável decide o "para fazer"
 * (`estadoAoGuardar`), porque só ele sabe de que livro se trata.
 */
export function novoNeuronio(input: CriarNeuronioInput, agora: Date): Neuronio {
  return {
    id: input.id,
    livroId: input.livroId,
    titulo: input.titulo.trim(),
    conteudo: input.conteudo.trim(),
    embedding: null,
    estado: null,
    ultimoToque: agora,
    resultadoLink: null,
    createdAt: agora,
    updatedAt: agora,
  }
}
