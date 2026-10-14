import { describe, expect, it } from 'vitest'

import { ALTURA_UTIL_DA_PILHA_PX } from './medidas'
import {
  alturaDaPilhaNoLugar,
  cabeNaPilha,
  cabeNaPilhaDepoisDeMudar,
  entraNaPilha,
  LUGARES_POR_PRATELEIRA,
  lugarParaChegar,
  moverEnfeiteNaEstante,
  moverLivroNaEstante,
  mudarOrientacaoNaEstante,
  primeiroLugarLivre,
  vagasDepoisDeMover,
} from './ordem'
import type { EnfeiteGravado, OrientacaoDoLivro } from './types'

interface L {
  id: string
  prateleira: number
  ordem: number
  orientacao: OrientacaoDoLivro
  nivel: number
  larguraLombada: number | null
}

/** Um livro deitado: a largura é a espessura que enche a pilha. */
const d = (id: string, ordem: number, espessura = 24, nivel = 0, prateleira = 0): L => ({
  id,
  prateleira,
  ordem,
  orientacao: 'deitado',
  nivel,
  larguraLombada: espessura,
})

/** Um livro de pé. */
const p = (id: string, ordem: number, prateleira = 0): L => ({
  id,
  prateleira,
  ordem,
  orientacao: 'em-pe',
  nivel: 0,
  larguraLombada: 38,
})

function onde(livros: readonly L[] | null): Record<string, [number, number, number]> {
  if (!livros) throw new Error('esperava uma estante, veio recusa')
  return Object.fromEntries(livros.map((x) => [x.id, [x.prateleira, x.ordem, x.nivel]]))
}

describe('o limite de altura de uma pilha', () => {
  it('é a de 3 livros Normais (38 px cada) — igual em toda tela', () => {
    expect(ALTURA_UTIL_DA_PILHA_PX).toBe(114)
  })

  it('cabe enquanto a soma das espessuras não passa dele', () => {
    expect(cabeNaPilha([38, 38, 38])).toBe(true) // 114, exatamente no limite
    expect(cabeNaPilha([38, 24, 24, 24])).toBe(true) // 1 Normal e 3 Finos: 110
    expect(cabeNaPilha([52, 38, 24])).toBe(true) // 114
    expect(cabeNaPilha([68, 38])).toBe(true) // 106
    expect(cabeNaPilha([68])).toBe(true)
  })

  it('não cabe quando passa, nem por um px', () => {
    expect(cabeNaPilha([38, 24, 24, 24, 24])).toBe(false) // 1 Normal e 4 Finos: 134
    expect(cabeNaPilha([24, 24, 24, 24, 24])).toBe(false) // 120
    expect(cabeNaPilha([38, 38, 38, 24])).toBe(false) // 138
    expect(cabeNaPilha([68, 24, 24])).toBe(false) // 116
    expect(cabeNaPilha([38, 38, 39])).toBe(false) // 115
  })
})

describe('moverLivroNaEstante com pilhas', () => {
  it('um livro deitado sobre uma pilha com altura de sobra sobe nela, e ninguém anda', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), p('x', 4), d('n', 9)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3))).toEqual({
      a: [0, 3, 0],
      b: [0, 3, 1],
      x: [0, 4, 0],
      n: [0, 3, 2],
    })
  })

  it('o que sobe fica no topo, acima do maior nível já usado', () => {
    // Níveis com lacuna (alguém saiu do meio): o novo vai acima do maior, sem colidir.
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 5), d('n', 9, 24)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3))['n']).toEqual([0, 3, 6])
  })

  it('uma pilha sem altura de sobra não recebe: ela anda inteira até o buraco mais perto', () => {
    const estante = [d('a', 3, 38, 0), d('b', 3, 38, 1), d('c', 4, 24), d('n', 9, 52)]
    // 38 + 38 + 52 = 128 > 114: não sobe. A pilha de a e b vai para a direita, empurrando c.
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3))).toEqual({
      n: [0, 3, 0],
      a: [0, 4, 0],
      b: [0, 4, 1],
      c: [0, 5, 0],
    })
  })

  it('a pilha que anda mantém a ordem interna', () => {
    const estante = [d('a', 3, 38, 0), d('b', 3, 38, 1), d('n', 9, 68)]
    const depois = onde(moverLivroNaEstante(estante, 'n', 0, 3))
    expect(depois['a']).toEqual([0, 4, 0])
    expect(depois['b']).toEqual([0, 4, 1])
  })

  it('um livro de pé sobre uma pilha de deitados empurra a pilha inteira', () => {
    const estante = [d('a', 3), d('b', 3, 24, 1), p('n', 9)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3))).toEqual({
      n: [0, 3, 0],
      a: [0, 4, 0],
      b: [0, 4, 1],
    })
  })

  it('um livro deitado sobre um livro de pé empurra ele', () => {
    const estante = [p('a', 3), d('n', 9)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3))).toEqual({
      n: [0, 3, 0],
      a: [0, 4, 0],
    })
  })

  it('um deitado sobre um deitado sozinho forma a pilha', () => {
    const estante = [d('a', 3, 24), d('n', 9, 24)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3))).toEqual({
      a: [0, 3, 0],
      n: [0, 3, 1],
    })
  })

  it('soltar no próprio lugar não leva o livro do meio da pilha para o topo', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('c', 3, 24, 2)]
    expect(onde(moverLivroNaEstante(estante, 'b', 0, 3))).toEqual({
      a: [0, 3, 0],
      b: [0, 3, 1],
      c: [0, 3, 2],
    })
  })

  it('tirar um livro do meio da pilha deixa o lugar ocupado pelos outros', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('c', 3, 24, 2)]
    const depois = moverLivroNaEstante(estante, 'b', 0, 8)
    expect(onde(depois)).toEqual({ a: [0, 3, 0], b: [0, 8, 0], c: [0, 3, 2] })
    // O lugar 3 continua tendo gente: nenhuma vaga abre embaixo da pilha.
    expect(vagasDepoisDeMover([], depois ?? [])).toEqual([])
  })

  it('tirar o último livro da pilha também não abre vaga: o lugar volta ao enfeite', () => {
    const estante = [d('a', 3)]
    const depois = moverLivroNaEstante(estante, 'a', 0, 8)
    expect(vagasDepoisDeMover([], depois ?? [])).toEqual([])
  })

  it('a pilha só aceita quem está na mesma prateleira que ela', () => {
    const estante = [d('a', 3, 24, 0, 1), d('n', 3, 24, 0, 0)]
    // `n` é da prateleira 0, no lugar 3; a pilha `a` está na prateleira 1.
    expect(onde(moverLivroNaEstante(estante, 'n', 1, 3))).toEqual({
      a: [1, 3, 0],
      n: [1, 3, 1],
    })
  })

  it('sem buraco para empurrar a pilha, recusa e nada muda', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) =>
      i === 3 ? d('a', 3, 52) : p(`x${String(i)}`, i),
    )
    // `a` está sozinho no 3; um deitado de 68 não sobe (52 + 68 > 114) e não há buraco.
    expect(moverLivroNaEstante([...cheia, d('n', 0, 68, 0, 1)], 'n', 0, 3)).toBeNull()
  })

  it('não muta as entradas', () => {
    const estante = [d('a', 3), d('n', 9)]
    const copia = structuredClone(estante)
    moverLivroNaEstante(estante, 'n', 0, 3)
    expect(estante).toEqual(copia)
  })
})

describe('reordenar e inserir no meio de uma pilha (posicao)', () => {
  const pilha = () => [d('a', 3, 24, 0), d('b', 3, 24, 1), d('c', 3, 24, 2)]

  it('o livro do topo pode virar o primeiro, na própria pilha', () => {
    expect(onde(moverLivroNaEstante(pilha(), 'c', 0, 3, { posicao: 0 }))).toEqual({
      c: [0, 3, 0],
      a: [0, 3, 1],
      b: [0, 3, 2],
    })
  })

  it('o da base pode ir para o topo, e o do meio para a base', () => {
    expect(onde(moverLivroNaEstante(pilha(), 'a', 0, 3, { posicao: 2 }))).toEqual({
      b: [0, 3, 0],
      c: [0, 3, 1],
      a: [0, 3, 2],
    })
    expect(onde(moverLivroNaEstante(pilha(), 'b', 0, 3, { posicao: 0 }))).toEqual({
      b: [0, 3, 0],
      a: [0, 3, 1],
      c: [0, 3, 2],
    })
  })

  it('a posição conta só os outros livros: soltar onde o livro já está não muda nada', () => {
    const antes = pilha()
    expect(moverLivroNaEstante(antes, 'b', 0, 3, { posicao: 1 })).toEqual(antes)
    expect(moverLivroNaEstante(antes, 'a', 0, 3, { posicao: 0 })).toEqual(antes)
    expect(moverLivroNaEstante(antes, 'c', 0, 3, { posicao: 2 })).toEqual(antes)
  })

  it('sem posição, soltar no próprio lugar continua não mudando nada', () => {
    const antes = pilha()
    expect(moverLivroNaEstante(antes, 'a', 0, 3)).toEqual(antes)
  })

  it('reordenar não mexe em quem está em outro lugar', () => {
    const estante = [...pilha(), p('x', 4), d('z', 9)]
    const depois = onde(moverLivroNaEstante(estante, 'c', 0, 3, { posicao: 0 }))
    expect(depois['x']).toEqual([0, 4, 0])
    expect(depois['z']).toEqual([0, 9, 0])
    expect(Object.values(depois).filter(([, ordem]) => ordem === 3)).toHaveLength(3)
  })

  it('reordena mesmo uma pilha gravada acima do teto, sem empurrar ninguém', () => {
    const alta = [d('a', 3, 68, 0), d('b', 3, 68, 1)] // 136, de um dado antigo
    expect(onde(moverLivroNaEstante(alta, 'b', 0, 3, { posicao: 0 }))).toEqual({
      b: [0, 3, 0],
      a: [0, 3, 1],
    })
  })

  it('os andares com buraco (0, 2, 5) são renumerados em sequência', () => {
    const buracos = [d('a', 3, 24, 0), d('b', 3, 24, 2), d('c', 3, 24, 5)]
    expect(onde(moverLivroNaEstante(buracos, 'c', 0, 3, { posicao: 1 }))).toEqual({
      a: [0, 3, 0],
      c: [0, 3, 1],
      b: [0, 3, 2],
    })
  })

  it('um deitado de outro lugar entra no meio da pilha, e os de cima sobem um andar', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('n', 9, 24)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3, { posicao: 1 }))).toEqual({
      a: [0, 3, 0],
      n: [0, 3, 1],
      b: [0, 3, 2],
    })
  })

  it('entrar de outra prateleira também aceita o ponto de inserção', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('n', 2, 24, 0, 1)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3, { posicao: 0 }))).toEqual({
      n: [0, 3, 0],
      a: [0, 3, 1],
      b: [0, 3, 2],
    })
  })

  it('a posição no topo (ou além dele) é o que já era: sobe para o topo', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('n', 9, 24)]
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3, { posicao: 2 }))).toEqual({
      a: [0, 3, 0],
      b: [0, 3, 1],
      n: [0, 3, 2],
    })
    expect(onde(moverLivroNaEstante(estante, 'n', 0, 3, { posicao: 99 }))['n']).toEqual([0, 3, 2])
  })

  it('a altura ainda vale para quem vem de fora: pilha cheia não recebe, por mais que se aponte', () => {
    const cheia = [d('a', 3, 38, 0), d('b', 3, 38, 1), d('c', 3, 38, 2), d('n', 9, 38)]
    const depois = onde(moverLivroNaEstante(cheia, 'n', 0, 3, { posicao: 1 }))
    expect(depois['n']).toEqual([0, 3, 0]) // tomou o lugar
    expect(depois['a']?.[1]).toBe(4) // e a pilha andou inteira
  })

  it('um livro de pé sobre uma pilha ignora a posição: toma o lugar e empurra a pilha', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), p('x', 9)]
    const depois = onde(moverLivroNaEstante(estante, 'x', 0, 3, { posicao: 1 }))
    expect(depois['x']).toEqual([0, 3, 0])
    expect(depois['a']?.[1]).toBe(4)
    expect(depois['b']?.[1]).toBe(4)
  })

  it('posição fora do intervalo é limitada às pontas', () => {
    expect(onde(moverLivroNaEstante(pilha(), 'b', 0, 3, { posicao: -5 }))['b']).toEqual([0, 3, 0])
    expect(onde(moverLivroNaEstante(pilha(), 'b', 0, 3, { posicao: 40 }))['b']).toEqual([0, 3, 2])
  })

  it('uma pilha de um livro só (ele mesmo) não tem o que reordenar', () => {
    const sozinho = [d('a', 3, 24, 0)]
    expect(moverLivroNaEstante(sozinho, 'a', 0, 3, { posicao: 0 })).toEqual(sozinho)
  })

  it('não muta as entradas', () => {
    const estante = pilha()
    const copia = JSON.stringify(estante)
    moverLivroNaEstante(estante, 'c', 0, 3, { posicao: 0 })
    expect(JSON.stringify(estante)).toBe(copia)
  })
})

describe('entraNaPilha (a linha de inserção só vale quando soltar entra de fato)', () => {
  it('um deitado sobre uma pilha de deitados que o comporta', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('n', 9, 24)]
    expect(entraNaPilha(estante, 'n', 0, 3, 1)).toBe(true)
  })

  it('um livro da própria pilha, apontando outro ponto dela', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), d('c', 3, 24, 2)]
    expect(entraNaPilha(estante, 'c', 0, 3, 0)).toBe(true)
  })

  it('não numa pilha cheia, não um livro de pé, não um lugar sem pilha', () => {
    const cheia = [d('a', 3, 38, 0), d('b', 3, 38, 1), d('c', 3, 38, 2), d('n', 9, 38)]
    expect(entraNaPilha(cheia, 'n', 0, 3, 1)).toBe(false)
    const dePe = [d('a', 3, 24, 0), d('b', 3, 24, 1), p('x', 9)]
    expect(entraNaPilha(dePe, 'x', 0, 3, 1)).toBe(false)
    expect(entraNaPilha(dePe, 'x', 0, 12, 0)).toBe(false)
  })

  it('não quando a altura estoura, mesmo apontando o ponto', () => {
    const estante = [d('a', 3, 68, 0), d('n', 9, 68)] // 136: não cabe
    expect(entraNaPilha(estante, 'n', 0, 3, 0)).toBe(false)
  })
})

describe('um lugar com pilha continua sendo um lugar ocupado', () => {
  it('o primeiro lugar livre pula o da pilha', () => {
    expect(primeiroLugarLivre([d('a', 2), d('b', 2, 24, 1)], 0, 2)).toBe(3)
  })

  it('um enfeite empurra a pilha inteira, como empurraria um livro', () => {
    const estado = {
      livros: [d('a', 3, 38, 0), d('b', 3, 38, 1)],
      vagas: [],
      enfeites: [] as EnfeiteGravado[],
    }
    const dados = {
      cor: '#1B2A6B',
      estilo: 'solido',
      larguraLombada: 38,
      comprimentoLombada: 80,
      dourado: true,
      detalheEscuro: true,
    } as const
    const depois = moverEnfeiteNaEstante(
      estado,
      { prateleira: 0, ordem: 9 },
      { prateleira: 0, ordem: 3 },
      dados,
    )
    expect(onde(depois?.livros ?? null)).toEqual({ a: [0, 4, 0], b: [0, 4, 1] })
  })
})

describe('lugarParaChegar (livro vindo de um backup)', () => {
  it('o próprio lugar, se está livre', () => {
    expect(lugarParaChegar([p('a', 1)], d('n', 5))).toEqual({ ordem: 5, nivel: 0 })
  })

  it('sobe na pilha que já está no lugar, se é deitado e cabe', () => {
    expect(lugarParaChegar([d('a', 5, 24, 0)], d('n', 5, 24, 4))).toEqual({ ordem: 5, nivel: 1 })
  })

  it('não cabe na pilha: vai para o buraco mais perto, sem empurrar', () => {
    expect(lugarParaChegar([d('a', 5, 68, 0)], d('n', 5, 52))).toEqual({ ordem: 6, nivel: 0 })
  })

  it('um livro de pé nunca sobe numa pilha', () => {
    expect(lugarParaChegar([d('a', 5, 24, 0)], p('n', 5))).toEqual({ ordem: 6, nivel: 0 })
  })

  it('um deitado nunca sobe num livro de pé', () => {
    expect(lugarParaChegar([p('a', 5)], d('n', 5))).toEqual({ ordem: 6, nivel: 0 })
  })

  it('prateleira sem buraco e sem pilha que o receba: null', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => p(`x${String(i)}`, i))
    expect(lugarParaChegar(cheia, d('n', 4))).toBeNull()
  })
})

describe('mudarOrientacaoNaEstante', () => {
  it('um livro sozinho no lugar só vira, sem sair dele', () => {
    const estante = [p('a', 3), p('b', 4)]
    expect(onde(mudarOrientacaoNaEstante(estante, 'a', 'deitado'))).toEqual({
      a: [0, 3, 0],
      b: [0, 4, 0],
    })
    expect(mudarOrientacaoNaEstante(estante, 'a', 'deitado')?.[0]?.orientacao).toBe('deitado')
  })

  it('o que sai do meio de uma pilha vai para o lugar livre mais perto', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1), p('x', 4)]
    expect(onde(mudarOrientacaoNaEstante(estante, 'b', 'em-pe'))).toEqual({
      a: [0, 3, 0],
      b: [0, 5, 0],
      x: [0, 4, 0],
    })
  })

  it('a pilha restante continua no lugar dela', () => {
    const estante = [d('a', 3, 24, 0), d('b', 3, 24, 1)]
    const depois = mudarOrientacaoNaEstante(estante, 'a', 'em-pe')
    expect(onde(depois)['b']).toEqual([0, 3, 1])
    expect(depois?.find((x) => x.id === 'a')?.orientacao).toBe('em-pe')
  })

  it('já na orientação pedida, não muda nada', () => {
    const estante = [d('a', 3), d('b', 3, 24, 1)]
    expect(mudarOrientacaoNaEstante(estante, 'a', 'deitado')).toEqual(estante)
  })

  it('sem lugar livre para quem sai da pilha, recusa e nada muda', () => {
    const cheia = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) =>
      i === 3 ? d('a', 3, 24, 0) : p(`x${String(i)}`, i),
    )
    expect(mudarOrientacaoNaEstante([...cheia, d('b', 3, 24, 1)], 'b', 'em-pe')).toBeNull()
  })

  it('id inexistente não muda nada', () => {
    const estante = [p('a', 0)]
    expect(mudarOrientacaoNaEstante(estante, 'fantasma', 'deitado')).toEqual(estante)
  })
})

describe('mudar a espessura de um livro da pilha (editar)', () => {
  it('a altura da pilha é a soma das espessuras; lugar com livro de pé não é pilha', () => {
    const livros = [d('a', 3, 24), d('b', 3, 38, 1), p('x', 5), d('c', 7, 52)]
    expect(alturaDaPilhaNoLugar(livros, 0, 3)).toBe(62)
    expect(alturaDaPilhaNoLugar(livros, 0, 5)).toBe(0)
    expect(alturaDaPilhaNoLugar(livros, 0, 9)).toBe(0)
  })

  it('escolher uma largura que estoura o teto da pilha é recusado', () => {
    const antes = [d('a', 3, 52), d('b', 3, 38, 1)] // 90
    const grossa = antes.map((l) => (l.id === 'b' ? { ...l, larguraLombada: 52 } : l)) // 104
    const grande = antes.map((l) => (l.id === 'b' ? { ...l, larguraLombada: 68 } : l)) // 120
    expect(cabeNaPilhaDepoisDeMudar(antes, grossa, 0, 3)).toBe(true)
    expect(cabeNaPilhaDepoisDeMudar(antes, grande, 0, 3)).toBe(false)
  })

  it('uma pilha que já passava do teto pode ser mexida, desde que não piore', () => {
    const antes = [d('a', 3, 68), d('b', 3, 52, 1)] // 120, de um dado antigo
    const menor = antes.map((l) => (l.id === 'b' ? { ...l, larguraLombada: 38 } : l))
    const maior = antes.map((l) => (l.id === 'b' ? { ...l, larguraLombada: 68 } : l))
    expect(cabeNaPilhaDepoisDeMudar(antes, menor, 0, 3)).toBe(true)
    expect(cabeNaPilhaDepoisDeMudar(antes, maior, 0, 3)).toBe(false)
  })

  it('livro de pé não tem pilha: a largura dele nunca é recusada por altura', () => {
    const antes = [p('x', 3)]
    const depois = [{ ...p('x', 3), larguraLombada: 68 }]
    expect(cabeNaPilhaDepoisDeMudar(antes, depois, 0, 3)).toBe(true)
  })
})
