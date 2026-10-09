import { describe, expect, it } from 'vitest'

import { espacoParaMeiaOpcao } from './faixa'

/** Onde cai o meio da opção `k`, com o espaço dado. */
function meioDe(larguras: number[], k: number, recuo: number, espaco: number): number {
  const antes = larguras.slice(0, k).reduce((s, l) => s + l, 0)
  return recuo + antes + k * espaco + (larguras[k] ?? 0) / 2
}

describe('espacoParaMeiaOpcao', () => {
  it('não mexe em nada quando a fileira inteira cabe', () => {
    expect(espacoParaMeiaOpcao([44, 44, 44], 300, 4, 2, 2)).toBeNull()
  })

  it('põe o meio de uma opção exatamente na borda visível', () => {
    const larguras = Array.from({ length: 10 }, () => 44)
    const espaco = espacoParaMeiaOpcao(larguras, 360, 4, 2, 2)
    expect(espaco).not.toBeNull()
    const k = larguras.findIndex(
      (_, i) => Math.abs(meioDe(larguras, i, 4, espaco ?? 0) - 360) < 0.001,
    )
    expect(k).toBeGreaterThan(0)
  })

  it('usa o menor espaço que ainda serve: mais opções inteiras à mostra', () => {
    const larguras = Array.from({ length: 10 }, () => 44)
    const espaco = espacoParaMeiaOpcao(larguras, 360, 4, 2, 2) ?? 0
    expect(espaco).toBeGreaterThanOrEqual(2)
    // Com o espaço mínimo a mais por opção, uma opção inteira a mais já não caberia antes da borda.
    expect(espaco).toBeLessThan(2 + 44)
  })

  it('aceita opções de larguras diferentes', () => {
    const larguras = [38, 44, 44, 44, 68, 44, 44]
    const espaco = espacoParaMeiaOpcao(larguras, 300, 4, 2, 2) ?? 0
    expect(espaco).toBeGreaterThanOrEqual(2)
    const meios = larguras.map((_, k) => meioDe(larguras, k, 4, espaco))
    expect(meios.some((m) => Math.abs(m - 300) < 0.001)).toBe(true)
  })

  it('devolve null quando nem duas opções cabem com o espaço mínimo', () => {
    expect(espacoParaMeiaOpcao([200, 200, 200], 150, 4, 2, 2)).toBeNull()
  })
})
