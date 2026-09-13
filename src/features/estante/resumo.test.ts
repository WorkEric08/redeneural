import { describe, expect, it } from 'vitest'

import type { Conexao, Livro, NeuronioNaTela } from '@/core'

import { montarEstante, pontesEntreLivros, vizinhosPorNeuronio } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

const LIVROS: Livro[] = [
  { id: 'psi', titulo: 'Psicologia', cor: '#7b6ae0', ordem: 0, createdAt: T0 },
  { id: 'prog', titulo: 'Programação', cor: '#3e9a93', ordem: 1, createdAt: T0 },
  { id: 'vazio', titulo: 'Botânica', cor: '#56a063', ordem: 2, createdAt: T0 },
]

function neuronio(id: string, livroId: string): NeuronioNaTela {
  return {
    id,
    livroId,
    titulo: `n ${id}`,
    conteudo: '',
    processando: false,
    createdAt: T0,
    updatedAt: T0,
  }
}

const NEURONIOS = [
  neuronio('p1', 'psi'),
  neuronio('p2', 'psi'),
  neuronio('p3', 'psi'),
  neuronio('g1', 'prog'),
]

function conexao(aId: string, bId: string, cross: boolean, score = 0.5): Conexao {
  return {
    id: `${aId}::${bId}`,
    aId,
    bId,
    score,
    emb: score,
    rr: null,
    cross,
    mantidaPorA: true,
    mantidaPorB: true,
    updatedAt: T0,
  }
}

describe('montarEstante', () => {
  it('conta neurônios, fios internos e fios que saem', () => {
    const estante = montarEstante(LIVROS, NEURONIOS, [
      conexao('p1', 'p2', false),
      conexao('p1', 'g1', true),
    ])

    const psi = estante.find((e) => e.livro.id === 'psi')!
    expect(psi.neuronios).toBe(3)
    expect(psi.internas).toBe(1)
    expect(psi.saindo).toBe(1)
  })

  it('a conexão dourada sai dos dois livros', () => {
    const estante = montarEstante(LIVROS, NEURONIOS, [conexao('p1', 'g1', true)])

    expect(estante.find((e) => e.livro.id === 'psi')!.saindo).toBe(1)
    expect(estante.find((e) => e.livro.id === 'prog')!.saindo).toBe(1)
  })

  it('a altura da lombada é relativa ao maior livro', () => {
    const estante = montarEstante(LIVROS, NEURONIOS, [])

    expect(estante.find((e) => e.livro.id === 'psi')!.altura).toBe(1)
    expect(estante.find((e) => e.livro.id === 'prog')!.altura).toBeCloseTo(1 / 3, 6)
    expect(estante.find((e) => e.livro.id === 'vazio')!.altura).toBe(0)
  })

  it('livro vazio aparece na estante em vez de sumir', () => {
    const estante = montarEstante(LIVROS, NEURONIOS, [])

    expect(estante).toHaveLength(3)
    expect(estante.find((e) => e.livro.id === 'vazio')!.neuronios).toBe(0)
  })

  it('não quebra com um palácio recém-nascido', () => {
    expect(montarEstante([], [], [])).toEqual([])
  })

  it('ignora conexão que aponta para neurônio que não está na tela', () => {
    const estante = montarEstante(LIVROS, NEURONIOS, [conexao('p1', 'fantasma', false)])
    expect(estante.find((e) => e.livro.id === 'psi')!.internas).toBe(0)
  })
})

describe('vizinhosPorNeuronio', () => {
  it('cada lado enxerga o outro, com o livro de quem está do outro lado', () => {
    const mapa = vizinhosPorNeuronio(NEURONIOS, LIVROS, [conexao('p1', 'g1', true, 0.8)])

    expect(mapa.get('p1')![0]!.outroTitulo).toBe('n g1')
    expect(mapa.get('p1')![0]!.outroLivro).toBe('Programação')
    expect(mapa.get('g1')![0]!.outroLivro).toBe('Psicologia')
  })

  it('ordena do fio mais forte para o mais fraco', () => {
    const mapa = vizinhosPorNeuronio(NEURONIOS, LIVROS, [
      conexao('p1', 'p2', false, 0.2),
      conexao('p1', 'p3', false, 0.9),
      conexao('p1', 'g1', true, 0.5),
    ])

    expect(mapa.get('p1')!.map((v) => v.outroId)).toEqual(['p3', 'g1', 'p2'])
  })

  it('neurônio sem conexão simplesmente não entra no mapa', () => {
    const mapa = vizinhosPorNeuronio(NEURONIOS, LIVROS, [])
    expect(mapa.get('p1')).toBeUndefined()
  })
})

describe('pontesEntreLivros', () => {
  const MUSICA = neuronio('m1', 'mus')

  it('conta os fios dourados de cada par, enxergados pelos dois lados', () => {
    const mapa = pontesEntreLivros(
      [...NEURONIOS, MUSICA],
      [conexao('p1', 'g1', true), conexao('p2', 'g1', true), conexao('p3', 'm1', true)],
    )

    expect(mapa.get('psi')?.get('prog')).toBe(2)
    expect(mapa.get('prog')?.get('psi')).toBe(2)
    expect(mapa.get('psi')?.get('mus')).toBe(1)
    expect(mapa.get('prog')?.get('mus')).toBeUndefined()
  })

  it('fio de dentro do mesmo livro não é ponte', () => {
    const mapa = pontesEntreLivros(NEURONIOS, [conexao('p1', 'p2', false)])
    expect(mapa.get('psi')).toBeUndefined()
  })

  it('ignora fio para neurônio que não está na tela', () => {
    const mapa = pontesEntreLivros(NEURONIOS, [conexao('p1', 'fantasma', true)])
    expect(mapa.size).toBe(0)
  })
})
