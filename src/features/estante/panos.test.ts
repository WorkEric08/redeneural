import { describe, expect, it } from 'vitest'

import { PANOS, panoSugerido } from './panos'

describe('panoSugerido', () => {
  const AZUL = PANOS.find((p) => p.nome === 'Azul base')!.cor
  const VIOLETA = PANOS.find((p) => p.nome === 'Violeta')!.cor
  const PETROLEO = PANOS.find((p) => p.nome === 'Petróleo')!.cor
  const AZUL_PROFUNDO = PANOS.find((p) => p.nome === 'Azul profundo')!.cor

  it('sugere Azul base, o padrão de um livro novo, enquanto ele não estiver em uso', () => {
    expect(panoSugerido([])).toBe(AZUL)
    expect(panoSugerido([{ cor: VIOLETA }, { cor: PETROLEO }])).toBe(AZUL)
  })

  it('com Azul base em uso, cai para o primeiro tom que nenhum livro usa', () => {
    expect(panoSugerido([{ cor: VIOLETA }, { cor: AZUL }])).toBe(AZUL_PROFUNDO)
  })

  it('reconhece o tom em uso mesmo com a caixa do hex diferente', () => {
    expect(panoSugerido([{ cor: AZUL.toLowerCase() }])).toBe(AZUL_PROFUNDO)
  })

  it('com todos em uso, continua sugerindo um tom da paleta', () => {
    const cheia = PANOS.map((p) => ({ cor: p.cor }))
    expect(PANOS.map((p) => p.cor)).toContain(panoSugerido(cheia))
  })

  it('oferece os dez tons da paleta Noite, em hex', () => {
    expect(PANOS).toHaveLength(10)
    for (const p of PANOS) expect(p.cor).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
