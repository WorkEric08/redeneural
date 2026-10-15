import { describe, expect, it } from 'vitest'

import type { AnexoNaTela, Livro, NeuronioNaTela } from '@/core'

import { buscar, buscarAnexos } from './buscar'

const T0 = new Date('2026-01-01T12:00:00.000Z')

const LIVROS: Livro[] = [
  {
    id: 'psi',
    titulo: 'Psicologia',
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira: 0,
    ordem: 0,
    tipo: 'conceitos',
    emblema: null,
    larguraLombada: null,
    comprimentoLombada: null,
    executavel: false,
    orientacao: 'em-pe',
    nivel: 0,
    diasParaAdormecer: 30,
    createdAt: T0,
  },
  {
    id: 'mus',
    titulo: 'Música',
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira: 1,
    ordem: 0,
    tipo: 'conceitos',
    emblema: null,
    larguraLombada: null,
    comprimentoLombada: null,
    executavel: false,
    orientacao: 'em-pe',
    nivel: 0,
    diasParaAdormecer: 30,
    createdAt: T0,
  },
]

function neuronio(id: string, livroId: string, titulo: string, conteudo: string): NeuronioNaTela {
  return {
    id,
    livroId,
    titulo,
    conteudo,
    processando: false,
    estado: null,
    ultimoToque: T0,
    resultadoLink: null,
    resultadoImagem: null,
    createdAt: T0,
    updatedAt: T0,
  }
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

  it('acha pensamento pelo título', () => {
    const resultado = buscar('improvisação', [], NEURONIOS)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toMatchObject({ tipo: 'neuronio', neuronio: NEURONIOS[1] })
  })

  it('acha pensamento pelo conteúdo, mesmo sem bater no título', () => {
    const resultado = buscar('restrições combinadas', [], NEURONIOS)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]).toMatchObject({ tipo: 'neuronio', neuronio: NEURONIOS[1] })
  })

  it('ignora acento: "pratica" acha "Prática"', () => {
    const resultado = buscar('pratica deliberada', [], NEURONIOS)
    expect(resultado).toHaveLength(1)
    expect((resultado[0] as { neuronio: NeuronioNaTela }).neuronio.id).toBe('n1')
  })

  it('traz o livro do pensamento junto', () => {
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

  it('sem nenhum livro nem pensamento batendo, devolve lista vazia', () => {
    expect(buscar('fantasma', LIVROS, NEURONIOS)).toEqual([])
  })
})

describe('buscar — texto longo', () => {
  it('acha uma palavra que só aparece depois do que o modelo lê', () => {
    // O embedding lê só os primeiros 2500 caracteres; a busca exata lê tudo.
    const longo = `${'Um parágrafo qualquer sobre outra coisa. '.repeat(80)}E no fim: serendipidade.`
    expect(longo.length).toBeGreaterThan(2500)
    const [achado] = buscar('SERENDIPIDADE', [], [neuronio('n3', 'psi', 'Notas soltas', longo)])

    expect(achado).toMatchObject({ tipo: 'neuronio', neuronio: { id: 'n3' } })
    expect((achado as { trecho?: string }).trecho).toContain('serendipidade')
  })
})

describe('buscarAnexos', () => {
  function anexo(id: string, legenda: string, url?: string, titulo = ''): AnexoNaTela {
    return {
      id,
      livroId: 'pasta',
      titulo,
      legenda,
      midia:
        url === undefined
          ? { tipo: 'imagem', mime: 'image/webp', largura: 10, altura: 10 }
          : { tipo: 'link', url },
      processando: false,
      createdAt: T0,
      updatedAt: T0,
    }
  }
  const ITENS = [
    anexo('a', 'Diagrama de memória de trabalho'),
    anexo('b', 'Artigo sobre refatoração', 'https://exemplo.com/refatoracao'),
    anexo('c', '', 'https://youtu.be/recursao'),
  ]

  it('sem termo não devolve nada', () => {
    expect(buscarAnexos('  ', ITENS)).toEqual([])
  })

  it('acha pela legenda, sem acento e sem caixa', () => {
    expect(buscarAnexos('MEMORIA', ITENS).map((a) => a.id)).toEqual(['a'])
  })

  it('acha um link pelo endereço, mesmo sem legenda', () => {
    expect(buscarAnexos('youtu', ITENS).map((a) => a.id)).toEqual(['c'])
  })

  it('legenda bate antes de endereço', () => {
    const itens = [anexo('x', 'Outra coisa', 'https://site.com/recursao'), anexo('y', 'Recursão')]
    expect(buscarAnexos('recurs', itens).map((a) => a.id)).toEqual(['y', 'x'])
  })

  it('acha também pelo título, antes do endereço', () => {
    const itens = [
      anexo('x', 'Outra coisa', 'https://site.com/memoria'),
      anexo('y', '', undefined, 'Memória'),
    ]
    expect(buscarAnexos('memoria', itens).map((a) => a.id)).toEqual(['y', 'x'])
  })

  it('não olha o endereço de uma imagem nem acha o que não bate', () => {
    expect(buscarAnexos('zzz', ITENS)).toEqual([])
  })
})
