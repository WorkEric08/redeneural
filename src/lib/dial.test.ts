import { describe, expect, it } from 'vitest'

import {
  ARCO_FIM,
  ARCO_INICIO,
  RAIO_EXTERNO,
  caminhoDoSetor,
  grauDe,
  pontoNoArco,
  setorEm,
  setores,
} from './dial'

describe('setores', () => {
  it('cobre o arco inteiro, sem buraco e sem sobra', () => {
    const partes = setores(3)

    expect(partes[0]?.inicio).toBe(ARCO_INICIO)
    expect(partes[2]?.fim).toBe(ARCO_FIM)
    expect(partes[0]?.fim).toBe(partes[1]?.inicio)
    expect(partes[1]?.fim).toBe(partes[2]?.inicio)
  })
})

describe('grauDe', () => {
  // A tela cresce para baixo e o ângulo não: é o erro de sinal que faria o dial
  // inteiro escolher a opção espelhada.
  it('lê para cima como 90° e para a esquerda como 180°', () => {
    expect(grauDe(0, -10)).toBeCloseTo(90)
    expect(grauDe(-10, 0)).toBeCloseTo(180)
    expect(grauDe(-10, -10)).toBeCloseTo(135)
  })
})

describe('setorEm', () => {
  it('não escolhe nada enquanto o dedo está em cima do botão', () => {
    expect(setorEm(0, 0, 3)).toBeNull()
    expect(setorEm(12, -18, 3)).toBeNull()
  })

  it('dá o primeiro setor para cima, o do meio na diagonal e o último à esquerda', () => {
    expect(setorEm(0, -80, 3)).toBe(0)
    expect(setorEm(-60, -60, 3)).toBe(1)
    expect(setorEm(-80, 0, 3)).toBe(2)
  })

  it('ignora o que está fora do arco: para a direita e para baixo não há opção', () => {
    expect(setorEm(80, 0, 3)).toBeNull()
    expect(setorEm(0, 80, 3)).toBeNull()
    expect(setorEm(-60, 60, 3)).toBeNull()
  })

  it('continua escolhendo quando o dedo passa longe do anel', () => {
    expect(setorEm(-600, -600, 3)).toBe(1)
  })
})

describe('caminhoDoSetor', () => {
  it('fecha a cunha com os dois arcos em sentidos opostos', () => {
    const d = caminhoDoSetor(setores(3)[1]!)

    expect(d.startsWith('M ')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).toContain(`A ${String(RAIO_EXTERNO)} ${String(RAIO_EXTERNO)} 0 0 0`)
    expect(d).toContain('0 0 1')
  })
})

describe('pontoNoArco', () => {
  it('põe 90° acima do centro, em pixels de tela', () => {
    const p = pontoNoArco(100, 90)

    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(-100)
  })
})
