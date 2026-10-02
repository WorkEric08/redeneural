import { describe, expect, it } from 'vitest'

import { vetor } from './fixtures'
import {
  atualizarMapa,
  fundirMapas,
  DISTANCIA_ENTRE_PONTOS,
  FOLGA_ENTRE_ILHAS,
  MAPA_VAZIO,
  mapaCompleto,
  MARGEM_DA_COSTA,
  moverIlha,
  moverPontoNoMapa,
  pontoNoMapa,
  type MapaDoPalacio,
  type NoDoMapa,
} from './mapa'

/** Um neurônio do livro, com um vetor perto do eixo do assunto. */
function no(id: string, livroId: string, eixo: number, desvio: number, outro = eixo + 1): NoDoMapa {
  return { id, livroId, embedding: vetor({ [eixo]: 1, [outro]: desvio }) }
}

/** Três livros: psi e mus no mesmo canto (parecidos), prog longe. */
function palacio(): NoDoMapa[] {
  const nos: NoDoMapa[] = []
  for (let i = 0; i < 7; i++) nos.push(no(`psi-${String(i)}`, 'psi', 0, 0.1 * i, 1 + (i % 3)))
  for (let i = 0; i < 6; i++) nos.push(no(`mus-${String(i)}`, 'mus', 0, 0.15 * i, 4 + (i % 2)))
  for (let i = 0; i < 6; i++) nos.push(no(`prog-${String(i)}`, 'prog', 9, 0.12 * i, 10 + (i % 3)))
  return nos
}
const LIVROS = new Set(['psi', 'mus', 'prog'])

function distancia(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function semEncostar(mapa: MapaDoPalacio): void {
  const ilhas = Object.entries(mapa.ilhas)
  for (let i = 0; i < ilhas.length; i++) {
    for (let k = i + 1; k < ilhas.length; k++) {
      const [ia, a] = ilhas[i]!
      const [ib, b] = ilhas[k]!
      expect(distancia(a.centro, b.centro), `${ia} encostou em ${ib}`).toBeGreaterThanOrEqual(
        a.raio + b.raio + FOLGA_ENTRE_ILHAS - 1e-3,
      )
    }
  }
}

function dentroDaCosta(mapa: MapaDoPalacio): void {
  for (const [livroId, ilha] of Object.entries(mapa.ilhas)) {
    for (const [id, p] of Object.entries(ilha.pontos)) {
      expect(
        Math.hypot(p.x, p.y) + MARGEM_DA_COSTA,
        `${id} saiu da ilha ${livroId}`,
      ).toBeLessThanOrEqual(ilha.raio + 1e-6)
    }
  }
}

describe('mapaCompleto', () => {
  const MAPA = mapaCompleto(palacio(), LIVROS, null)

  it('uma ilha por livro de conceitos, cada neurônio na ilha do seu livro', () => {
    expect(Object.keys(MAPA.ilhas).sort()).toEqual(['mus', 'prog', 'psi'])
    expect(Object.keys(MAPA.ilhas.psi!.pontos)).toHaveLength(7)
    expect(Object.keys(MAPA.ilhas.prog!.pontos).every((id) => id.startsWith('prog'))).toBe(true)
  })

  it('livro fora da lista (uma pasta, ou vazio) não vira ilha', () => {
    const mapa = mapaCompleto(palacio(), new Set(['psi', 'prog', 'vazio']), null)
    expect(Object.keys(mapa.ilhas).sort()).toEqual(['prog', 'psi'])
  })

  it('nenhuma ilha encosta noutra, e todo ponto fica dentro da costa', () => {
    semEncostar(MAPA)
    dentroDaCosta(MAPA)
  })

  it('dois pontos da mesma ilha nunca ficam colados', () => {
    for (const ilha of Object.values(MAPA.ilhas)) {
      const pontos = Object.values(ilha.pontos)
      for (let i = 0; i < pontos.length; i++) {
        for (let k = i + 1; k < pontos.length; k++) {
          expect(distancia(pontos[i]!, pontos[k]!)).toBeGreaterThanOrEqual(
            DISTANCIA_ENTRE_PONTOS - 0.5,
          )
        }
      }
    }
  })

  it('ilhas de livros parecidos ficam mais perto que as de livros diferentes', () => {
    const { psi, mus, prog } = MAPA.ilhas
    expect(distancia(psi!.centro, mus!.centro)).toBeLessThan(distancia(psi!.centro, prog!.centro))
  })

  it('é sempre o mesmo mapa, chegue o palácio em que ordem chegar', () => {
    expect(mapaCompleto([...palacio()].reverse(), LIVROS, null)).toEqual(MAPA)
  })

  it('livro com menos de cinco neurônios, ou sem vetor, ainda vira ilha', () => {
    const pequeno = [no('a', 'x', 0, 0.1), { id: 'b', livroId: 'x', embedding: null }]
    const mapa = mapaCompleto(pequeno, new Set(['x']), null)
    expect(Object.keys(mapa.ilhas.x!.pontos).sort()).toEqual(['a', 'b'])
    dentroDaCosta(mapa)
  })

  it('pontoNoMapa soma o centro da ilha ao lugar do neurônio nela', () => {
    const ilha = MAPA.ilhas.psi!
    const p = ilha.pontos['psi-0']!
    expect(pontoNoMapa(MAPA, 'psi-0')).toEqual({ x: ilha.centro.x + p.x, y: ilha.centro.y + p.y })
    expect(pontoNoMapa(MAPA, 'ninguem')).toBeUndefined()
  })
})

describe('atualizarMapa', () => {
  const ANTES = mapaCompleto(palacio(), LIVROS, null)

  it('sem mapa anterior, desenha o mapa inteiro', () => {
    expect(atualizarMapa(MAPA_VAZIO, palacio(), LIVROS, null)).toEqual(ANTES)
  })

  it('nada mudou, nada anda', () => {
    expect(atualizarMapa(ANTES, palacio(), LIVROS, null)).toEqual(ANTES)
  })

  it('um neurônio novo entra perto dos parecidos e não mexe em mais ninguém', () => {
    const novo = no('psi-novo', 'psi', 0, 0.05, 1)
    const depois = atualizarMapa(ANTES, [...palacio(), novo], LIVROS, null)

    for (const [livroId, ilha] of Object.entries(ANTES.ilhas)) {
      expect(depois.ilhas[livroId]!.centro).toEqual(ilha.centro)
      for (const [id, p] of Object.entries(ilha.pontos)) {
        expect(depois.ilhas[livroId]!.pontos[id], `${id} andou`).toEqual(p)
      }
    }
    const lugar = depois.ilhas.psi!.pontos['psi-novo']!
    // O mais parecido com ele é psi-0 (mesmo eixo, desvio quase igual).
    const maisPerto = Object.entries(ANTES.ilhas.psi!.pontos)
      .map(([id, p]) => ({ id, d: distancia(p, lugar) }))
      .sort((a, b) => a.d - b.d)
    expect(maisPerto.slice(0, 3).map((m) => m.id)).toContain('psi-0')
    dentroDaCosta(depois)
  })

  it('um livro que ganha o primeiro neurônio vira ilha perto da mais parecida, sem mover as outras', () => {
    const novos = [0, 1, 2].map((i) => no(`arte-${String(i)}`, 'arte', 9, 0.1 * i, 13))
    const livros = new Set([...LIVROS, 'arte'])
    const depois = atualizarMapa(ANTES, [...palacio(), ...novos], livros, null)

    for (const [livroId, ilha] of Object.entries(ANTES.ilhas)) {
      expect(depois.ilhas[livroId]!.centro).toEqual(ilha.centro)
    }
    const arte = depois.ilhas.arte!
    // "arte" fala do mesmo assunto que programação (eixo 9).
    expect(distancia(arte.centro, depois.ilhas.prog!.centro)).toBeLessThan(
      distancia(arte.centro, depois.ilhas.psi!.centro),
    )
    semEncostar(depois)
  })

  it('quem saiu some do mapa, e livro que ficou vazio perde a ilha', () => {
    const semPsi0 = palacio().filter((n) => n.id !== 'psi-0')
    const semProg = semPsi0.filter((n) => n.livroId !== 'prog')
    const depois = atualizarMapa(ANTES, semProg, LIVROS, null)

    expect(depois.ilhas.psi!.pontos['psi-0']).toBeUndefined()
    expect(depois.ilhas.psi!.pontos['psi-1']).toEqual(ANTES.ilhas.psi!.pontos['psi-1'])
    expect(depois.ilhas.prog).toBeUndefined()
  })

  it('quem muda de livro sai de uma ilha e entra na outra', () => {
    const mudou = palacio().map((n) => (n.id === 'mus-0' ? { ...n, livroId: 'psi' } : n))
    const depois = atualizarMapa(ANTES, mudou, LIVROS, null)
    expect(depois.ilhas.mus!.pontos['mus-0']).toBeUndefined()
    expect(depois.ilhas.psi!.pontos['mus-0']).toBeDefined()
  })

  it('a ilha que cresceu e encostou noutra anda sozinha — as outras ficam', () => {
    // Duas ilhas pequenas, coladas no limite do mar entre elas.
    const a = mapaCompleto([no('a-0', 'a', 0, 0.1)], new Set(['a']), null).ilhas.a!
    const b = mapaCompleto([no('b-0', 'b', 9, 0.1)], new Set(['b']), null).ilhas.b!
    const juntas: MapaDoPalacio = {
      ilhas: {
        a: { ...a, centro: { x: 0, y: 0 } },
        b: { ...b, centro: { x: a.raio + b.raio + FOLGA_ENTRE_ILHAS + 1, y: 0 } },
      },
    }
    // "a" ganha 40 neurônios: o raio cresce muito além do que cabia.
    const muitos = Array.from({ length: 40 }, (_, i) =>
      no(`a-${String(i + 1)}`, 'a', 0, 0.02 * i, 1 + (i % 5)),
    )
    const depois = atualizarMapa(
      juntas,
      [no('a-0', 'a', 0, 0.1), ...muitos, no('b-0', 'b', 9, 0.1)],
      new Set(['a', 'b']),
      null,
    )

    expect(depois.ilhas.b!.centro).toEqual(juntas.ilhas.b!.centro)
    expect(depois.ilhas.a!.centro).not.toEqual(juntas.ilhas.a!.centro)
    expect(depois.ilhas.a!.pontos['a-0']).toEqual(juntas.ilhas.a!.pontos['a-0'])
    semEncostar(depois)
  })
})

describe('fundirMapas', () => {
  const ilha = (x: number, raio = 80) => ({ centro: { x, y: 0 }, raio, pontos: {} })

  it('a ilha do arquivo vence a daqui, e a que só existe aqui fica se couber', () => {
    const local: MapaDoPalacio = { ilhas: { a: ilha(0), b: ilha(1000) } }
    const doArquivo: MapaDoPalacio = { ilhas: { a: ilha(-500) } }
    expect(fundirMapas(local, doArquivo).ilhas).toEqual({ a: ilha(-500), b: ilha(1000) })
  })

  it('a daqui que encostaria numa do arquivo sai, para ser encaixada de novo', () => {
    const local: MapaDoPalacio = { ilhas: { b: ilha(100) } }
    const doArquivo: MapaDoPalacio = { ilhas: { a: ilha(0) } }
    expect(Object.keys(fundirMapas(local, doArquivo).ilhas)).toEqual(['a'])
  })
})

describe('a mão da pessoa', () => {
  const MAPA: MapaDoPalacio = {
    ilhas: {
      a: { centro: { x: 0, y: 0 }, raio: 80, pontos: { a1: { x: 0, y: 0 }, a2: { x: 30, y: 0 } } },
      b: { centro: { x: 300, y: 0 }, raio: 80, pontos: { b1: { x: 0, y: 0 } } },
    },
  }
  const distancia = (p: { x: number; y: number }, q: { x: number; y: number }): number =>
    Math.hypot(p.x - q.x, p.y - q.y)

  it('a ilha solta no mar fica exatamente ali, com os neurônios dela', () => {
    const depois = moverIlha(MAPA, 'b', { x: 0, y: 400 })
    expect(depois.ilhas.b?.centro).toEqual({ x: 0, y: 400 })
    expect(depois.ilhas.b?.pontos).toEqual(MAPA.ilhas.b?.pontos)
    expect(depois.ilhas.a).toEqual(MAPA.ilhas.a)
  })

  it('solta em cima de outra, anda o mínimo até o mar inteiro em volta — só ela', () => {
    const solta = { x: 100, y: 0 }
    const depois = moverIlha(MAPA, 'b', solta)
    const b = depois.ilhas.b!
    expect(distancia(b.centro, { x: 0, y: 0 })).toBeGreaterThanOrEqual(
      80 + 80 + FOLGA_ENTRE_ILHAS - 1e-6,
    )
    expect(distancia(b.centro, solta)).toBeLessThan(distancia(MAPA.ilhas.b!.centro, solta))
    expect(depois.ilhas.a).toEqual(MAPA.ilhas.a)
  })

  it('o neurônio vai para onde foi solto, dentro da ilha dele', () => {
    const depois = moverPontoNoMapa(MAPA, 'a2', { x: -30, y: 20 })
    expect(depois.ilhas.a?.pontos.a2).toEqual({ x: -30, y: 20 })
    expect(depois.ilhas.a?.pontos.a1).toEqual({ x: 0, y: 0 })
    expect(depois.ilhas.a?.raio).toBe(80)
    expect(depois.ilhas.b).toEqual(MAPA.ilhas.b)
  })

  it('solto fora da ilha, fica na beira de dentro — nunca sai dela', () => {
    const depois = moverPontoNoMapa(MAPA, 'a2', { x: 500, y: 0 })
    expect(depois.ilhas.a?.pontos.a2).toEqual({ x: 80 - MARGEM_DA_COSTA, y: 0 })
    expect(depois.ilhas.b?.pontos).toEqual(MAPA.ilhas.b?.pontos)
  })

  it('solto colado noutro, dá um passo para o lado, ainda dentro', () => {
    const p = moverPontoNoMapa(MAPA, 'a2', { x: 2, y: 1 }).ilhas.a!.pontos.a2!
    expect(distancia(p, { x: 0, y: 0 })).toBeGreaterThanOrEqual(DISTANCIA_ENTRE_PONTOS - 1e-6)
    expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(80 - MARGEM_DA_COSTA + 1e-6)
  })

  it('ilha ou neurônio que não existe deixa o mapa como estava', () => {
    expect(moverIlha(MAPA, 'nenhuma', { x: 1, y: 1 })).toBe(MAPA)
    expect(moverPontoNoMapa(MAPA, 'nenhum', { x: 1, y: 1 })).toBe(MAPA)
  })
})
