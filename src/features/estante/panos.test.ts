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
  it('sugere o primeiro pano que nenhum livro usa', () => {
    expect(panoSugerido([{ cor: '#7b6ae0' }, { cor: '#3E9A93' }])).toBe('#c8734a')
  })

  it('com todos em uso, continua sugerindo um pano da paleta', () => {
    const cheia = PANOS.map((p) => ({ cor: p.cor }))
    expect(PANOS.map((p) => p.cor)).toContain(panoSugerido(cheia))
  })

  it('só oferece hex, porque cor de livro é dado e vai no backup', () => {
    for (const p of PANOS) expect(p.cor).toMatch(/^#[0-9a-f]{6}$/)
  })
})
