import { describe, expect, it } from 'vitest'

import { PANOS, pano, panoSugerido } from './panos'

function panoLavado(cor: string, intensidadeDaLuz?: number): string {
  return (pano(cor, intensidadeDaLuz) as Record<string, string>)['--pano-lavado']!
}

describe('pano', () => {
  it('mistura menos luz quanto menor a intensidade', () => {
    expect(panoLavado('#7b6ae0', 0)).toContain('100%')
    expect(panoLavado('#7b6ae0', 100)).toContain('0%')
    expect(panoLavado('#7b6ae0', 42)).toContain('58%')
  })

  it('sem intensidade informada, usa o padrão de antes da Fase 17', () => {
    expect(pano('#7b6ae0')).toEqual(pano('#7b6ae0', 42))
  })
})

describe('panoSugerido', () => {
  const AZUL = PANOS.find((p) => p.nome === 'Azul')!.cor
  const VIOLETA = PANOS.find((p) => p.nome === 'Violeta')!.cor
  const VERDE_AZULADO = PANOS.find((p) => p.nome === 'Verde-azulado')!.cor

  it('sugere Azul, o padrão de um livro novo, enquanto ele não estiver em uso', () => {
    expect(panoSugerido([])).toBe(AZUL)
    expect(panoSugerido([{ cor: VIOLETA }, { cor: VERDE_AZULADO }])).toBe(AZUL)
  })

  it('com Azul em uso, cai para o primeiro pano que nenhum livro usa', () => {
    expect(panoSugerido([{ cor: VIOLETA }, { cor: AZUL }])).toBe(VERDE_AZULADO)
  })

  it('com todos em uso, continua sugerindo um pano da paleta', () => {
    const cheia = PANOS.map((p) => ({ cor: p.cor }))
    expect(PANOS.map((p) => p.cor)).toContain(panoSugerido(cheia))
  })

  it('só oferece hex, porque cor de livro é dado e vai no backup', () => {
    for (const p of PANOS) expect(p.cor).toMatch(/^#[0-9a-f]{6}$/)
  })
})
