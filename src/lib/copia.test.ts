import { describe, expect, it } from 'vitest'

import { haQuantoTempo, resumoDaCopia } from './copia'

describe('resumoDaCopia', () => {
  it('conta livros e pensamentos de uma cópia', () => {
    const texto = JSON.stringify({ version: 1, livros: [{}, {}], neuronios: [{}, {}, {}] })
    expect(resumoDaCopia(texto)).toEqual({ livros: 2, pensamentos: 3 })
  })

  it('aceita uma cópia vazia', () => {
    expect(resumoDaCopia(JSON.stringify({ livros: [], neuronios: [] }))).toEqual({
      livros: 0,
      pensamentos: 0,
    })
  })

  it('recusa o que claramente não é uma cópia', () => {
    expect(resumoDaCopia('isto não é json')).toBeNull()
    expect(resumoDaCopia('42')).toBeNull()
    expect(resumoDaCopia('null')).toBeNull()
    expect(resumoDaCopia('[]')).toBeNull()
    expect(resumoDaCopia(JSON.stringify({ livros: [] }))).toBeNull()
    expect(resumoDaCopia(JSON.stringify({ livros: 1, neuronios: 2 }))).toBeNull()
  })
})

describe('haQuantoTempo', () => {
  const agora = new Date(2026, 9, 15, 10, 0)

  it('hoje e ontem', () => {
    expect(haQuantoTempo(new Date(2026, 9, 15, 0, 5), agora)).toBe('hoje')
    expect(haQuantoTempo(new Date(2026, 9, 14, 23, 59), agora)).toBe('ontem')
  })

  it('conta por dia de calendário, não por 24 horas', () => {
    // Ontem à noite, mas há menos de 24 h: ainda é "ontem".
    expect(haQuantoTempo(new Date(2026, 9, 14, 22, 0), agora)).toBe('ontem')
  })

  it('há N dias', () => {
    expect(haQuantoTempo(new Date(2026, 9, 3, 12, 0), agora)).toBe('há 12 dias')
    expect(haQuantoTempo(new Date(2026, 9, 13, 12, 0), agora)).toBe('há 2 dias')
  })

  it('um relógio que andou para trás não vira "há -1 dia"', () => {
    expect(haQuantoTempo(new Date(2026, 9, 16, 12, 0), agora)).toBe('hoje')
  })
})
