import { describe, expect, it } from 'vitest'

import type { Livro, NeuronioNaTela } from '@/core'

import { buscar } from './buscar'

const T0 = new Date('2026-01-01T12:00:00.000Z')

const LIVROS: Livro[] = [
  {
    id: 'psi',
    titulo: 'Psicologia',
    cor: '#7b6ae0',
    prateleira: 0,
    ordem: 0,
    emblema: null,
    larguraLombada: null,
    createdAt: T0,
  },
  {
    id: 'mus',
    titulo: 'Música',
    cor: '#c8734a',
    prateleira: 1,
    ordem: 0,
    emblema: null,
    larguraLombada: null,
    createdAt: T0,
  },
]

function neuronio(id: string, livroId: string, titulo: string, conteudo: string): NeuronioNaTela {
  return { id, livroId, titulo, conteudo, processando: false, createdAt: T0, updatedAt: T0 }
}

const NEURONIOS: NeuronioNaTela[] = [
  neuronio(
    'n1',
    'psi',
    'Prática deliberada',
    'Repetir de propósito o trecho que ainda não sai, devagar e com atenção ao erro.',
  ),
  neuronio('n2', 'mus', 'Improvisação', 'Compor em tempo real dentro de restrições combinadas.'),
]

describe('buscar', () => {
  it('consulta vazia não devolve nada', () => {
    expect(buscar('', LIVROS, NEURONIOS)).toEqual([])
    expect(buscar('   ', LIVROS, NEURONIOS)).toEqual([])
  })

  it('acha livro pelo título, sem diferenciar caixa', () => {
    const resultado = buscar('MÚSICA', LIVROS, [])
    expect(resultado).toEqual([{ tipo: 'livro', livro: LIVROS[1] }])
  })

  it('acha neurônio pelo título', () => {
    const resultado = buscar('improvisação', [], NEURONIOS)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toMatchObject({ tipo: 'neuronio', neuronio: NEURONIOS[1] })
  })

  it('acha neurônio pelo conteúdo, mesmo sem bater no título', () => {
    const resultado = buscar('restrições combinadas', [], NEURONIOS)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toMatchObject({ tipo: 'neuronio', neuronio: NEURONIOS[1] })
  })

  it('ignora acento: "pratica" acha "Prática"', () => {
    const resultado = buscar('pratica deliberada', [], NEURONIOS)
    expect(resultado).toHaveLength(1)
    expect((resultado[0] as { neuronio: NeuronioNaTela }).neuronio.id).toBe('n1')
  })

  it('traz o livro do neurônio junto', () => {
    const [resultado] = buscar('improvisação', LIVROS, NEURONIOS)
    expect(resultado).toMatchObject({ tipo: 'neuronio', livro: LIVROS[1] })
  })

  it('bate por título vem antes de bater só por conteúdo', () => {
    const doisNeuronios = [
      neuronio('a', 'psi', 'Outra coisa', 'menciona cache de leve'),
      neuronio('b', 'psi', 'Cache', 'guardar perto o resultado'),
    ]
    const resultado = buscar('cache', [], doisNeuronios)
    expect(resultado.map((r) => (r as { neuronio: NeuronioNaTela }).neuronio.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('trecho só aparece quando o conteúdo foi quem bateu, não o título', () => {
    const [porTitulo] = buscar('improvisação', [], NEURONIOS)
    const [porConteudo] = buscar('restrições', [], NEURONIOS)
    expect((porTitulo as { trecho?: string }).trecho).toBeUndefined()
    expect((porConteudo as { trecho?: string }).trecho).toContain('restrições')
  })

  it('sem nenhum livro nem neurônio batendo, devolve lista vazia', () => {
    expect(buscar('fantasma', LIVROS, NEURONIOS)).toEqual([])
  })
})
