import { describe, expect, it } from 'vitest'

import { MS_POR_DIA, type Livro, type NeuronioNaTela } from '@/core'

import { marcasDoAndamento } from './andamento'

const AGORA = new Date('2026-10-01T12:00:00.000Z')
const HA = (dias: number): Date => new Date(AGORA.getTime() - dias * MS_POR_DIA)

function livro(id: string, executavel: boolean): Livro {
  return {
    id,
    tipo: 'conceitos',
    titulo: id,
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira: 0,
    ordem: 0,
    emblema: null,
    larguraLombada: null,
    comprimentoLombada: null,
    executavel,
    diasParaAdormecer: 30,
    createdAt: AGORA,
  }
}

function ideia(id: string, livroId: string | null, estado: NeuronioNaTela['estado'], dias: number) {
  return {
    id,
    livroId,
    titulo: id,
    conteudo: '',
    processando: false,
    estado,
    ultimoToque: HA(dias),
    resultadoLink: null,
    createdAt: AGORA,
    updatedAt: AGORA,
  }
}

describe('marcasDoAndamento', () => {
  it('separa as adormecidas e as feitas, só nos livros executáveis', () => {
    const { adormecidas, feitas } = marcasDoAndamento(
      [
        ideia('dormindo', 'exe', 'para_fazer', 40),
        ideia('acordada', 'exe', 'fazendo', 3),
        ideia('feita', 'exe', 'feita', 400),
        ideia('pensamento', 'psi', 'feita', 400),
        ideia('porto', null, null, 400),
      ],
      [livro('exe', true), livro('psi', false)],
      AGORA,
    )
    expect([...adormecidas]).toEqual(['dormindo'])
    expect([...feitas]).toEqual(['feita'])
  })
})
