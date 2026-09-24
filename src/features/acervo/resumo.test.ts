import { describe, expect, it } from 'vitest'

import type { AnexoNaTela, NeuronioNaTela, Vinculo } from '@/core'

import { conceitosPorAnexo, situacaoDoAnexo } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function neuronio(id: string): NeuronioNaTela {
  return {
    id,
    livroId: 'l1',
    titulo: `título ${id}`,
    conteudo: '',
    processando: false,
    createdAt: T0,
    updatedAt: T0,
  }
}

function vinculo(anexoId: string, conceitoId: string, score: number, ordem = 0): Vinculo {
  return { id: `${anexoId}::${conceitoId}`, anexoId, conceitoId, score, ordem, updatedAt: T0 }
}

function anexo(legenda: string, processando = false): AnexoNaTela {
  return {
    id: 'a1',
    livroId: 'p1',
    legenda,
    midia: { tipo: 'link', url: 'https://exemplo.com' },
    processando,
    createdAt: T0,
    updatedAt: T0,
  }
}

describe('conceitosPorAnexo', () => {
  it('lista do mais parecido para o menos, com o título do conceito', () => {
    const mapa = conceitosPorAnexo(
      [vinculo('a1', 'n1', 0.4, 1), vinculo('a1', 'n2', 0.9, 0), vinculo('a2', 'n1', 0.5, 0)],
      [neuronio('n1'), neuronio('n2')],
    )

    expect(mapa.get('a1')?.map((c) => [c.id, c.titulo])).toEqual([
      ['n2', 'título n2'],
      ['n1', 'título n1'],
    ])
    expect(mapa.get('a2')).toHaveLength(1)
  })

  it('com o score saturado em 100%, a ordem gravada decide — não o id', () => {
    const mapa = conceitosPorAnexo(
      [vinculo('a1', 'n1', 1, 1), vinculo('a1', 'n2', 1, 0)],
      [neuronio('n1'), neuronio('n2')],
    )

    expect(mapa.get('a1')?.map((c) => c.id)).toEqual(['n2', 'n1'])
  })

  it('ignora vínculo com conceito que a tela já não tem', () => {
    const mapa = conceitosPorAnexo([vinculo('a1', 'sumiu', 0.9)], [neuronio('n1')])
    expect(mapa.get('a1')).toBeUndefined()
  })
})

describe('situacaoDoAnexo', () => {
  const preso = [{ id: 'n1', titulo: 't', livroId: 'l1', score: 0.8, ordem: 0 }]

  it('processando vence tudo', () => {
    expect(situacaoDoAnexo(anexo('um vídeo', true), [])).toBe('processando')
  })

  it('sem legenda, e legenda só de espaços, ficam só na pasta', () => {
    expect(situacaoDoAnexo(anexo(''), [])).toBe('sem-legenda')
    expect(situacaoDoAnexo(anexo('   '), [])).toBe('sem-legenda')
  })

  it('com legenda: preso se escolheu alguém, solto se não', () => {
    expect(situacaoDoAnexo(anexo('um vídeo'), preso)).toBe('preso')
    expect(situacaoDoAnexo(anexo('um vídeo'), [])).toBe('solto')
  })
})
