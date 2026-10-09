import { describe, expect, it } from 'vitest'

import {
  COR_PADRAO,
  corMaisProxima,
  ehCorDaPaleta,
  ehEstiloDaLombada,
  ESTILOS_DA_LOMBADA,
  PALETA_NOITE,
} from './paletaNoite'

describe('PALETA_NOITE', () => {
  it('tem os dez tons, com hex e nome únicos', () => {
    expect(PALETA_NOITE).toHaveLength(10)
    expect(new Set(PALETA_NOITE.map((t) => t.hex)).size).toBe(10)
    expect(new Set(PALETA_NOITE.map((t) => t.nome)).size).toBe(10)
    for (const t of PALETA_NOITE) expect(t.hex).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('o padrão é o Azul base', () => {
    expect(COR_PADRAO).toBe('#1B2A6B')
  })
})

describe('corMaisProxima', () => {
  it('um tom da paleta volta como ele mesmo, qualquer que seja a caixa', () => {
    for (const t of PALETA_NOITE) {
      expect(corMaisProxima(t.hex)).toBe(t.hex)
      expect(corMaisProxima(t.hex.toLowerCase())).toBe(t.hex)
    }
  })

  it('leva as cores dos panos antigos ao tom mais perto em Lab (a luminosidade pesa)', () => {
    expect(corMaisProxima('#7b6ae0')).toBe('#2A3A8A') // violeta claro → Azul vivo
    expect(corMaisProxima('#3e9a93')).toBe('#17505A') // verde-azulado → Petróleo
    expect(corMaisProxima('#5b7fd6')).toBe('#2A3A8A') // azul → Azul vivo
    expect(corMaisProxima('#a8566f')).toBe('#4A2540') // vinho → Vinho
    expect(corMaisProxima('#123456')).toBe('#2D3A4F')
    // Terracota é claro e quente: o único tom claro da paleta é o Creme.
    expect(corMaisProxima('#c8734a')).toBe('#F1EEE6')
  })

  it('o que é quase creme vira Creme', () => {
    expect(corMaisProxima('#ffffff')).toBe('#F1EEE6')
    expect(corMaisProxima('#efece3')).toBe('#F1EEE6')
  })

  it('o que não é hex #rrggbb vira o padrão', () => {
    expect(corMaisProxima('azul')).toBe(COR_PADRAO)
    expect(corMaisProxima('#fff')).toBe(COR_PADRAO)
    expect(corMaisProxima('')).toBe(COR_PADRAO)
  })
})

describe('ehCorDaPaleta', () => {
  it('reconhece só os dez tons', () => {
    expect(ehCorDaPaleta('#17505a')).toBe(true)
    expect(ehCorDaPaleta('#123456')).toBe(false)
  })
})

describe('formas da lombada', () => {
  it('são as oito (sem "duas-cores" nem "metade"), com o sólido primeiro', () => {
    expect(ESTILOS_DA_LOMBADA).toHaveLength(8)
    expect(ehEstiloDaLombada('duas-cores')).toBe(false)
    expect(ehEstiloDaLombada('metade')).toBe(false)
    expect(ESTILOS_DA_LOMBADA[0]).toBe('solido')
    expect(ehEstiloDaLombada('degrade')).toBe(true)
    expect(ehEstiloDaLombada('espiral')).toBe(false)
    expect(ehEstiloDaLombada(undefined)).toBe(false)
  })
})
