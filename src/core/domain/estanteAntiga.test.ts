import { describe, expect, it } from 'vitest'

import { distribuicaoAntiga, posicoesAntigas } from './estanteAntiga'

function ids(quantidade: number): string[] {
  return Array.from({ length: quantidade }, (_, i) => `l${String(i)}`)
}

describe('distribuicaoAntiga', () => {
  it('mantém o mínimo de 4 prateleiras mesmo vazia ou com poucos livros', () => {
    expect(distribuicaoAntiga(0).quantas).toBe(4)
    expect(distribuicaoAntiga(1).quantas).toBe(4)
  })

  it('não passa do teto de 14 — acomoda mais em cada uma', () => {
    expect(distribuicaoAntiga(90).quantas).toBe(14)
    expect(distribuicaoAntiga(90).porPrateleira).toBeGreaterThan(1)
  })

  it('cresce conforme os livros passam de 6 por prateleira', () => {
    expect(distribuicaoAntiga(7).quantas).toBe(4)
    expect(distribuicaoAntiga(25).quantas).toBeGreaterThan(4)
  })
})

describe('posicoesAntigas', () => {
  it('nunca perde um id, por mais que existam', () => {
    for (const quantidade of [0, 1, 3, 7, 32, 33, 90]) {
      const posicoes = posicoesAntigas(ids(quantidade))
      expect(posicoes.size).toBe(quantidade)
    }
  })

  it('espalha poucos livros pelo móvel em vez de amontoá-los na primeira fila', () => {
    const posicoes = posicoesAntigas(ids(3))
    expect([...posicoes.values()].map((p) => p.prateleira)).toEqual([0, 1, 2])
  })

  it('dentro de cada prateleira, a ordem é densa a partir de 0', () => {
    const posicoes = posicoesAntigas(ids(7))
    const porPrateleira = new Map<number, number[]>()
    for (const [, p] of posicoes) {
      const lista = porPrateleira.get(p.prateleira) ?? []
      lista.push(p.ordem)
      porPrateleira.set(p.prateleira, lista)
    }
    for (const [, ordens] of porPrateleira) {
      expect(ordens.sort((a, b) => a - b)).toEqual(ordens.map((_, i) => i))
    }
  })

  it('é determinístico entre chamadas', () => {
    const lista = ids(9)
    expect(posicoesAntigas(lista)).toEqual(posicoesAntigas(lista))
  })
})
