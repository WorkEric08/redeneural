import { describe, expect, it } from 'vitest'

import { PANOS, panoSugerido } from './panos'

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
