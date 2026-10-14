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
    orientacao: 'em-pe',
    nivel: 0,
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
    resultadoImagem: null,
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

describe('marcasDoAndamento: o círculo de cada andamento', () => {
  it('para fazer é cinza, fazendo é cinza com brilho, feita é amarela — e só nos livros executáveis', () => {
    const { feitas, fazendo, paraFazer } = marcasDoAndamento(
      [
        ideia('pf', 'exe', 'para_fazer', 3),
        ideia('sem-estado', 'exe', null, 3),
        ideia('fz', 'exe', 'fazendo', 3),
        ideia('ok', 'exe', 'feita', 3),
        ideia('pensamento', 'psi', 'fazendo', 3),
        ideia('porto', null, null, 3),
      ],
      [livro('exe', true), livro('psi', false)],
      AGORA,
    )
    expect([...paraFazer].sort()).toEqual(['pf', 'sem-estado'])
    expect([...fazendo]).toEqual(['fz'])
    expect([...feitas]).toEqual(['ok'])
  })

  it('a ideia adormecida continua cinza (e na névoa), mas perde o brilho do fazendo', () => {
    const { adormecidas, fazendo, paraFazer } = marcasDoAndamento(
      [ideia('dorme-pf', 'exe', 'para_fazer', 40), ideia('dorme-fz', 'exe', 'fazendo', 40)],
      [livro('exe', true)],
      AGORA,
    )
    expect([...adormecidas].sort()).toEqual(['dorme-fz', 'dorme-pf'])
    expect([...paraFazer].sort()).toEqual(['dorme-fz', 'dorme-pf'])
    expect(fazendo.size).toBe(0)
  })

  it('a ideia feita nunca dorme, por mais antiga que seja', () => {
    const { adormecidas, feitas, paraFazer } = marcasDoAndamento(
      [ideia('velha', 'exe', 'feita', 400)],
      [livro('exe', true)],
      AGORA,
    )
    expect(adormecidas.size).toBe(0)
    expect([...feitas]).toEqual(['velha'])
    expect(paraFazer.size).toBe(0)
  })
})
