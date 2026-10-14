import { describe, expect, it } from 'vitest'

import type { Livro } from '@/core'

import { barraDeSoltura } from './barraDeSoltura'
import { FOLGA_ENTRE_LUGARES, montarPrateleiras } from './prateleiras'
import type { LivroNaEstante } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')
const ALTURA = 100

function livro(
  id: string,
  ordem: number,
  { deitado = false, nivel = 0, largura = 38 } = {},
): LivroNaEstante {
  const l: Livro = {
    id,
    titulo: id,
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira: 0,
    ordem,
    tipo: 'conceitos',
    emblema: null,
    larguraLombada: largura,
    comprimentoLombada: null,
    executavel: false,
    orientacao: deitado ? 'deitado' : 'em-pe',
    nivel,
    diasParaAdormecer: 30,
    createdAt: T0,
  }
  return {
    livro: l,
    neuronios: 3,
    anexos: 0,
    internas: 0,
    saindo: 0,
    altura: 0.5,
    andamento: null,
    comIdeiaAdormecida: false,
  }
}

function montar(estante: LivroNaEstante[]) {
  return montarPrateleiras(estante, [], 4, undefined, [], ALTURA)
}

describe('barraDeSoltura', () => {
  it('livro de pé: vertical, na borda esquerda do lugar, com a altura do livro', () => {
    const prateleiras = montar([livro('a', 2), livro('b', 5)])
    const lugares = prateleiras[0]!.lugares
    const antes = lugares.slice(0, 5).reduce((s, l) => s + l.largura + FOLGA_ENTRE_LUGARES, 0)

    const barra = barraDeSoltura({
      prateleiras,
      prateleira: 0,
      indice: 5,
      livroId: 'x',
      deitado: false,
      comprimento: 87,
      alturaDaFileira: ALTURA,
    })

    expect(barra).toEqual({
      prateleira: 0,
      eixo: 'vertical',
      esquerda: antes,
      comprimento: 87,
      base: 0,
    })
  })

  it('a borda é a do lugar: soltar num enfeite encostado no livro dá a borda direita dele', () => {
    const prateleiras = montar([livro('a', 2)])
    const lugares = prateleiras[0]!.lugares
    const fimDoLivro = lugares.slice(0, 3).reduce((s, l) => s + l.largura + FOLGA_ENTRE_LUGARES, 0)

    const barra = barraDeSoltura({
      prateleiras,
      prateleira: 0,
      indice: 3,
      livroId: 'x',
      deitado: false,
      comprimento: 60,
      alturaDaFileira: ALTURA,
    })

    expect(barra?.esquerda).toBe(fimDoLivro)
  })

  it('livro deitado: horizontal, com o comprimento dele, no topo da pilha onde entra', () => {
    const prateleiras = montar([
      livro('a', 4, { deitado: true, nivel: 0, largura: 24 }),
      livro('b', 4, { deitado: true, nivel: 1, largura: 38 }),
    ])

    const barra = barraDeSoltura({
      prateleiras,
      prateleira: 0,
      indice: 4,
      livroId: 'b',
      deitado: true,
      comprimento: 90,
      alturaDaFileira: ALTURA,
    })

    expect(barra?.eixo).toBe('horizontal')
    expect(barra?.comprimento).toBe(90)
    // o fio passa pelo topo do livro dele: a espessura dos dois, 24 + 38 (a pilha cabe na fileira)
    expect(barra?.base).toBeCloseTo(62, 5)
  })

  it('um livro deitado que ainda não está na pilha marca o topo dela', () => {
    const prateleiras = montar([livro('a', 4, { deitado: true, largura: 24 })])

    const barra = barraDeSoltura({
      prateleiras,
      prateleira: 0,
      indice: 4,
      livroId: 'fora',
      deitado: true,
      comprimento: 90,
      alturaDaFileira: ALTURA,
    })

    expect(barra?.base).toBeCloseTo(24, 5)
  })

  it('um lugar que não existe na prateleira não tem barra', () => {
    const prateleiras = montar([livro('a', 2)])
    expect(
      barraDeSoltura({
        prateleiras,
        prateleira: 0,
        indice: 99,
        livroId: 'x',
        deitado: false,
        comprimento: 50,
        alturaDaFileira: ALTURA,
      }),
    ).toBeNull()
    expect(
      barraDeSoltura({
        prateleiras,
        prateleira: 9,
        indice: 0,
        livroId: 'x',
        deitado: false,
        comprimento: 50,
        alturaDaFileira: ALTURA,
      }),
    ).toBeNull()
  })
})
