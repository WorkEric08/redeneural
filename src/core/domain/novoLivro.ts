import type { CriarLivroInput } from '../ports/engine'

import { clampDiasParaAdormecer, DIAS_PARA_ADORMECER_PADRAO } from './executavel'
import { ESTILO_PADRAO } from './paletaNoite'
import type { Livro } from './types'

/**
 * Monta o livro que será gravado. Nasce sempre no fim da prateleira tocada —
 * `ordem` vem de fora porque só quem já viu a estante sabe quantos livros
 * aquela prateleira já tem (mesmo padrão de `livroFromSnapshot`).
 */
export function novoLivro(input: CriarLivroInput, agora: Date, ordem: number): Livro {
  const tipo = input.tipo ?? 'conceitos'
  return {
    id: input.id,
    tipo,
    titulo: input.titulo.trim(),
    cor: input.cor,
    estilo: input.estilo ?? ESTILO_PADRAO,
    prateleira: Math.max(0, Math.trunc(input.prateleira)),
    ordem,
    orientacao: input.orientacao ?? 'em-pe',
    nivel: 0,
    emblema: input.emblema ?? null,
    larguraLombada: input.larguraLombada ?? null,
    comprimentoLombada: input.comprimentoLombada ?? null,
    // Uma pasta de acervo nunca é executável.
    executavel: tipo === 'conceitos' && input.executavel === true,
    diasParaAdormecer: clampDiasParaAdormecer(
      input.diasParaAdormecer ?? DIAS_PARA_ADORMECER_PADRAO,
    ),
    createdAt: agora,
  }
}
