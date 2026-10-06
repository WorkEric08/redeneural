import { describe, expect, it } from 'vitest'

import { COMPRIMENTOS } from './comprimentos'
import { LARGURAS } from './larguras'
import { opcaoMaisProxima } from './opcaoMaisProxima'

const comprimentos = COMPRIMENTOS.map((c) => c.percentual)
const larguras = LARGURAS.map((l) => l.px)

describe('opcaoMaisProxima', () => {
  it('uma medida que já é uma opção fica nela', () => {
    expect(opcaoMaisProxima(88, comprimentos)).toBe(88)
    expect(opcaoMaisProxima(24, larguras)).toBe(24)
  })

  it('o comprimento sorteado de um enfeite (63 a 93,5%) vai à opção mais perto', () => {
    expect(opcaoMaisProxima(84.9652, comprimentos)).toBe(88)
    expect(opcaoMaisProxima(63, comprimentos)).toBe(55)
    expect(opcaoMaisProxima(93.5, comprimentos)).toBe(98)
    expect(opcaoMaisProxima(70, comprimentos)).toBe(72)
  })

  it('a largura de um enfeite espremido pela fileira vai à opção mais perto', () => {
    expect(opcaoMaisProxima(10, larguras)).toBe(24)
    expect(opcaoMaisProxima(62, larguras)).toBe(68)
    expect(opcaoMaisProxima(46, larguras)).toBe(52)
  })

  it('empate fica com a menor', () => {
    expect(opcaoMaisProxima(31, larguras)).toBe(24)
  })
})
