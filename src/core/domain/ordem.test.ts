import { describe, expect, it } from 'vitest'

import type { DadosDoEnfeite, EnfeiteGravado, Vaga } from './types'
import {
  enfeitesSemLivroEmCima,
  LUGARES_POR_PRATELEIRA,
  moverEnfeiteNaEstante,
  moverLivroNaEstante,
  primeiroLugarDaEstante,
  primeiroLugarLivre,
  vagasDepoisDeMover,
} from './ordem'

interface L {
  id: string
  prateleira: number
  ordem: number
}

const l = (id: string, prateleira: number, ordem: number): L => ({ id, prateleira, ordem })

function lugares(livros: readonly L[] | null): Record<string, [number, number]> {
  if (!livros) throw new Error('esperava uma estante, veio recusa')
  return Object.fromEntries(livros.map((x) => [x.id, [x.prateleira, x.ordem]]))
}

describe('primeiroLugarLivre', () => {
  it('o próprio lugar pedido, quando não tem livro', () => {
    expect(primeiroLugarLivre([l('a', 0, 0)], 0, 5)).toBe(5)
  })

  it('com livro no lugar, o primeiro buraco à direita', () => {
    const estante = [l('a', 0, 2), l('b', 0, 3), l('c', 0, 5)]
    expect(primeiroLugarLivre(estante, 0, 2)).toBe(4)
  })

  it('sem buraco à direita, o mais perto à esquerda', () => {
    const cheiaDoMeioAoFim = Array.from({ length: 6 }, (_, i) =>
      l(`x${String(i)}`, 0, LUGARES_POR_PRATELEIRA - 6 + i),
    )
    expect(primeiroLugarLivre(cheiaDoMeioAoFim, 0, LUGARES_POR_PRATELEIRA - 3)).toBe(
      LUGARES_POR_PRATELEIRA - 7,
    )
  })

  it('só olha a prateleira pedida', () => {
    expect(primeiroLugarLivre([l('a', 1, 0)], 0, 0)).toBe(0)
  })

  it('prateleira cheia de livros não tem lugar', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 0, i))
    expect(primeiroLugarLivre(cheia, 0, 4)).toBeNull()
  })
})

describe('primeiroLugarDaEstante', () => {
  it('o primeiro buraco da prateleira de cima', () => {
    expect(primeiroLugarDaEstante([l('a', 0, 0), l('b', 0, 1)], 4)).toEqual({
      prateleira: 0,
      lugar: 2,
    })
  })

  it('desce para a próxima prateleira quando a de cima está cheia', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 0, i))
    expect(primeiroLugarDaEstante(cheia, 4)).toEqual({ prateleira: 1, lugar: 0 })
  })

  it('estante inteira cheia não tem lugar', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 0, i))
    expect(primeiroLugarDaEstante(cheia, 1)).toBeNull()
  })
})

describe('moverLivroNaEstante', () => {
  it('para um lugar sem livro, só o livro se move — nem a origem fecha', () => {
    const estante = [l('a', 0, 0), l('b', 0, 1), l('c', 0, 2)]
    expect(lugares(moverLivroNaEstante(estante, 'a', 0, 9))).toEqual({
      a: [0, 9],
      b: [0, 1],
      c: [0, 2],
    })
  })

  it('para o meio de uma prateleira vazia, fica no meio', () => {
    expect(lugares(moverLivroNaEstante([l('a', 0, 0)], 'a', 3, 7))).toEqual({ a: [3, 7] })
  })

  it('para um lugar com livro, empurra a fila até o primeiro buraco à direita', () => {
    const estante = [l('a', 0, 2), l('b', 0, 3), l('c', 0, 6), l('n', 1, 0)]
    expect(lugares(moverLivroNaEstante(estante, 'n', 0, 2))).toEqual({
      n: [0, 2],
      a: [0, 3],
      b: [0, 4], // o buraco no 4 absorveu o empurrão
      c: [0, 6], // depois do buraco, ninguém anda
    })
  })

  it('sem buraco à direita, empurra para a esquerda', () => {
    const ultimo = LUGARES_POR_PRATELEIRA - 1
    const estante = [l('a', 0, ultimo - 1), l('b', 0, ultimo), l('n', 1, 0)]
    expect(lugares(moverLivroNaEstante(estante, 'n', 0, ultimo))).toEqual({
      a: [0, ultimo - 2],
      b: [0, ultimo - 1],
      n: [0, ultimo],
    })
  })

  it('dentro da mesma prateleira, o lugar que o livro deixa conta como buraco', () => {
    const estante = [l('a', 0, 3), l('b', 0, 4), l('c', 0, 5)]
    expect(lugares(moverLivroNaEstante(estante, 'c', 0, 3))).toEqual({
      c: [0, 3],
      a: [0, 4],
      b: [0, 5],
    })
  })

  it('soltar no próprio lugar não muda nada', () => {
    const estante = [l('a', 0, 0), l('b', 0, 4)]
    expect(lugares(moverLivroNaEstante(estante, 'b', 0, 4))).toEqual({ a: [0, 0], b: [0, 4] })
  })

  it('lugar fora da prateleira vai para a ponta mais próxima', () => {
    expect(lugares(moverLivroNaEstante([l('a', 0, 0)], 'a', 0, 999))).toEqual({
      a: [0, LUGARES_POR_PRATELEIRA - 1],
    })
    expect(lugares(moverLivroNaEstante([l('a', 0, 5)], 'a', 0, -3))).toEqual({ a: [0, 0] })
  })

  it('recusa uma prateleira cheia de livros, sem mexer em nada', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 0, i))
    expect(moverLivroNaEstante([...cheia, l('n', 1, 0)], 'n', 0, 3)).toBeNull()
  })

  it('id inexistente não muda nada', () => {
    const estante = [l('a', 0, 0)]
    expect(moverLivroNaEstante(estante, 'fantasma', 0, 0)).toEqual(estante)
  })
})

describe('vagasDepoisDeMover', () => {
  it('abre a vaga de onde o livro saiu e fecha a de onde chegou', () => {
    const antes = [l('a', 0, 1)]
    const depois = [l('a', 0, 8)]
    expect(vagasDepoisDeMover([{ prateleira: 0, ordem: 8 }], antes, depois, 'a')).toEqual([
      { prateleira: 0, ordem: 1 },
    ])
  })

  it('não abre vaga na origem que o empurrão ocupou', () => {
    const antes = [l('a', 0, 3), l('b', 0, 4), l('c', 0, 5)]
    const depois = moverLivroNaEstante(antes, 'c', 0, 3)
    expect(vagasDepoisDeMover([], antes, depois ?? [], 'c')).toEqual([])
  })

  it('mantém as vagas que ninguém tocou, sem duplicar a da origem', () => {
    const vagas = [
      { prateleira: 2, ordem: 0 },
      { prateleira: 0, ordem: 1 },
    ]
    const antes = [l('a', 0, 1)]
    const depois = [l('a', 1, 0)]
    expect(vagasDepoisDeMover(vagas, antes, depois, 'a')).toEqual(vagas)
  })
})

describe('moverEnfeiteNaEstante', () => {
  const dados: DadosDoEnfeite = {
    cor: '#4A2540',
    estilo: 'contorno',
    larguraLombada: 52,
    comprimentoLombada: 90,
    dourado: true,
    detalheEscuro: false,
  }
  const vazio = { vagas: [] as Vaga[], enfeites: [] as EnfeiteGravado[] }

  function mover(
    livros: L[],
    origem: [number, number],
    destino: [number, number],
    resto: { vagas: Vaga[]; enfeites: EnfeiteGravado[] } = vazio,
  ) {
    return moverEnfeiteNaEstante(
      { livros, ...resto },
      { prateleira: origem[0], ordem: origem[1] },
      { prateleira: destino[0], ordem: destino[1] },
      dados,
    )
  }

  it('lugar sem livro: só o enfeite anda, e o lugar de onde saiu fica aberto', () => {
    const livros = [l('a', 0, 3)]
    const depois = mover(livros, [0, 6], [0, 9])!

    expect(depois.livros).toEqual(livros)
    expect(depois.enfeites).toEqual([{ ...dados, prateleira: 0, ordem: 9 }])
    expect(depois.vagas).toEqual([{ prateleira: 0, ordem: 6 }])
  })

  it('o enfeite que estava no destino dá lugar a ele, e a vaga do destino fecha', () => {
    const resto = {
      vagas: [{ prateleira: 0, ordem: 9 }],
      enfeites: [{ ...dados, cor: '#17505A', prateleira: 0, ordem: 9 }],
    }
    const depois = mover([], [0, 6], [0, 9], resto)!

    expect(depois.enfeites).toEqual([{ ...dados, prateleira: 0, ordem: 9 }])
    expect(depois.vagas).toEqual([{ prateleira: 0, ordem: 6 }])
  })

  it('sobre um livro: a fila empurra até o buraco mais perto, como entre livros', () => {
    const livros = [l('a', 0, 3), l('b', 0, 4), l('c', 0, 6)]
    const depois = mover(livros, [0, 9], [0, 3])!

    expect(lugares(depois.livros)).toEqual({ a: [0, 4], b: [0, 5], c: [0, 6] })
    expect(depois.enfeites).toEqual([{ ...dados, prateleira: 0, ordem: 3 }])
    expect(depois.vagas).toEqual([{ prateleira: 0, ordem: 9 }])
  })

  it('o buraco que o enfeite deixou pode ser ocupado pelo livro empurrado: nesse caso não vira vaga', () => {
    const livros = [l('a', 0, 3), l('b', 0, 4)]
    const depois = mover(livros, [0, 5], [0, 3])!

    expect(lugares(depois.livros)).toEqual({ a: [0, 4], b: [0, 5] })
    expect(depois.vagas).toEqual([])
  })

  it('o enfeite gravado embaixo de um livro empurrado some', () => {
    const resto = {
      vagas: [],
      enfeites: [{ ...dados, prateleira: 0, ordem: 4 }],
    }
    const depois = mover([l('a', 0, 3)], [0, 8], [0, 3], resto)!

    expect(lugares(depois.livros)).toEqual({ a: [0, 4] })
    expect(depois.enfeites.map((e) => e.ordem)).toEqual([3])
  })

  it('entre prateleiras: o livro do destino é empurrado na prateleira dele', () => {
    const depois = mover([l('a', 1, 2)], [0, 5], [1, 2])!

    expect(lugares(depois.livros)).toEqual({ a: [1, 3] })
    expect(depois.enfeites).toEqual([{ ...dados, prateleira: 1, ordem: 2 }])
    expect(depois.vagas).toEqual([{ prateleira: 0, ordem: 5 }])
  })

  it('prateleira cheia de livros: recusa, e nada muda', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => l(`x${String(i)}`, 1, i))
    expect(mover(cheia, [0, 5], [1, 4])).toBeNull()
  })

  it('largar no mesmo lugar não muda nada', () => {
    const resto = { vagas: [], enfeites: [{ ...dados, prateleira: 0, ordem: 6 }] }
    const depois = mover([l('a', 0, 3)], [0, 6], [0, 6], resto)!

    expect(depois.enfeites).toEqual(resto.enfeites)
    expect(depois.vagas).toEqual([])
  })

  it('não muta as entradas', () => {
    const livros = [l('a', 0, 3)]
    const resto = { vagas: [] as Vaga[], enfeites: [] as EnfeiteGravado[] }
    mover(livros, [0, 3 + 3], [0, 3], resto)
    expect(livros).toEqual([l('a', 0, 3)])
    expect(resto).toEqual({ vagas: [], enfeites: [] })
  })
})

describe('enfeitesSemLivroEmCima', () => {
  it('tira o enfeite de todo lugar onde há livro', () => {
    const e = (ordem: number): EnfeiteGravado => ({
      prateleira: 0,
      ordem,
      cor: '#1B2A6B',
      estilo: 'solido',
      larguraLombada: null,
      comprimentoLombada: null,
      dourado: false,
      detalheEscuro: true,
    })
    expect(enfeitesSemLivroEmCima([e(1), e(2), e(3)], [l('a', 0, 2)]).map((x) => x.ordem)).toEqual([
      1, 3,
    ])
  })
})
