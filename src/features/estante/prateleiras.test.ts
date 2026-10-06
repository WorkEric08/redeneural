import { describe, expect, it } from 'vitest'

import { LUGARES_POR_PRATELEIRA, type Livro, type Vaga } from '@/core'

import {
  cabeNaPrateleira,
  LARGURA_MINIMA_DO_ENFEITE,
  larguraDosLivros,
  larguraDosLivrosDaPrateleira,
  montarPrateleiras,
  type Lugar,
  type Prateleira,
} from './prateleiras'
import type { LivroNaEstante } from './resumo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

function livro(
  id: string,
  prateleira: number,
  ordem: number,
  larguraLombada: number | null = null,
): LivroNaEstante {
  const l: Livro = {
    id,
    titulo: `Livro ${id}`,
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira,
    ordem,
    tipo: 'conceitos',
    emblema: null,
    larguraLombada,
    comprimentoLombada: null,
    executavel: false,
    diasParaAdormecer: 30,
    createdAt: T0,
  }
  return { livro: l, neuronios: 3, anexos: 0, internas: 0, saindo: 0, altura: 0.5, andamento: null }
}

/** `L:id` para livro, `E` para enfeite, `_` para vaga — a fileira num relance. */
function fileira(p: Prateleira, ate = 6): string[] {
  return p.lugares
    .slice(0, ate)
    .map((x) => (x.tipo === 'livro' ? `L:${x.item.livro.id}` : x.tipo === 'enfeite' ? 'E' : '_'))
}

function livrosDe(prateleiras: readonly Prateleira[]): Extract<Lugar, { tipo: 'livro' }>[] {
  return prateleiras.flatMap((p) => p.lugares.filter((x) => x.tipo === 'livro'))
}

function enfeites(p: Prateleira): Extract<Lugar, { tipo: 'enfeite' }>[] {
  return p.lugares.filter((x): x is Extract<Lugar, { tipo: 'enfeite' }> => x.tipo === 'enfeite')
}

describe('o enfeite no estilo Noite', () => {
  const todos = montarPrateleiras([], [], 4).flatMap(enfeites)

  it('sorteia a forma entre as três sem escurecer o topo, a largura entre 24, 38 e 52 e a altura entre 63% e 93,5%', () => {
    expect(new Set(todos.map((e) => e.estilo))).toEqual(new Set(['solido', 'faixa', 'fio']))
    expect(new Set(todos.map((e) => e.largura))).toEqual(new Set([24, 38, 52]))
    for (const e of todos) {
      expect(e.altura).toBeGreaterThanOrEqual(63)
      expect(e.altura).toBeLessThanOrEqual(93.5)
    }
  })

  it('o mesmo lugar dá sempre o mesmo enfeite, mesmo com a estante mudando', () => {
    const [a] = montarPrateleiras([], [], 2)
    const [b] = montarPrateleiras([livro('x', 1, 3)], [{ prateleira: 1, ordem: 9 }], 3)
    expect(enfeites(b!).map((e) => [e.indice, e.estilo, e.altura, e.largura])).toEqual(
      enfeites(a!).map((e) => [e.indice, e.estilo, e.altura, e.largura]),
    )
  })

  it('enfeite com outro enfeite ao lado forma um grupo e leva os filetes dourados', () => {
    const [p] = montarPrateleiras([], [], 1)
    expect(enfeites(p!).every((e) => e.dourado)).toBe(true)
  })

  it('o enfeite isolado só tem dourado se o sorteio pedir: uma minoria, cerca de 1 em 5', () => {
    // Um livro em cada lugar par deixa todo enfeite entre dois livros, isolado.
    const livros = Array.from({ length: 4 }, (_, prateleira) =>
      Array.from({ length: LUGARES_POR_PRATELEIRA / 2 }, (_, i) =>
        livro(`l${String(prateleira)}-${String(i)}`, prateleira, i * 2),
      ),
    ).flat()
    const isolados = montarPrateleiras(livros, [], 4).flatMap(enfeites)
    const comDourado = isolados.filter((e) => e.dourado).length

    expect(isolados).toHaveLength(4 * (LUGARES_POR_PRATELEIRA / 2))
    expect(comDourado).toBeGreaterThan(0)
    expect(comDourado).toBeLessThan(isolados.length / 2)
  })

  it('tirar o vizinho enfeite de um enfeite isolado tira o dourado de grupo dele', () => {
    const cercado = montarPrateleiras([livro('a', 0, 4), livro('b', 0, 6)], [], 1)[0]!
      .lugares[5] as Extract<Lugar, { tipo: 'enfeite' }>
    const comGrupo = montarPrateleiras([], [], 1)[0]!.lugares[5] as Extract<
      Lugar,
      { tipo: 'enfeite' }
    >
    expect(comGrupo.dourado).toBe(true)
    // Isolado, o dourado é o do sorteio do lugar — o mesmo número, sem o grupo.
    expect(typeof cercado.dourado).toBe('boolean')
    expect({ ...cercado, dourado: comGrupo.dourado }).toEqual(comGrupo)
  })
})

describe('montarPrateleiras', () => {
  it('cada prateleira tem sempre todos os lugares, com livro ou sem', () => {
    const prateleiras = montarPrateleiras([livro('a', 0, 3)], [], 4)
    expect(prateleiras.length).toBe(4)
    for (const p of prateleiras) expect(p.lugares.length).toBe(LUGARES_POR_PRATELEIRA)
  })

  it('põe cada livro no lugar gravado, deixando buraco entre eles', () => {
    const [p] = montarPrateleiras([livro('a', 0, 0), livro('b', 0, 3)], [], 1)
    expect(fileira(p!)).toEqual(['L:a', 'E', 'E', 'L:b', 'E', 'E'])
  })

  it('lugar sem livro mostra enfeite, a não ser que haja vaga aberta ali', () => {
    const vagas: Vaga[] = [{ prateleira: 0, ordem: 1 }]
    const [p] = montarPrateleiras([livro('a', 0, 0)], vagas, 1)
    expect(fileira(p!, 3)).toEqual(['L:a', '_', 'E'])
  })

  it('o livro vence uma vaga gravada no mesmo lugar', () => {
    const [p] = montarPrateleiras([livro('a', 0, 0)], [{ prateleira: 0, ordem: 0 }], 1)
    expect(fileira(p!, 1)).toEqual(['L:a'])
  })

  it('vaga de outra prateleira não abre buraco nesta', () => {
    const [p0, p1] = montarPrateleiras([], [{ prateleira: 1, ordem: 2 }], 2)
    expect(fileira(p0!, 3)).toEqual(['E', 'E', 'E'])
    expect(fileira(p1!, 3)).toEqual(['E', 'E', '_'])
  })

  it('a forma, a altura e a largura de um enfeite são do lugar: pôr um livro ao lado não as troca', () => {
    const vazio = montarPrateleiras([], [], 1)[0]!.lugares[5]
    const comVizinho = montarPrateleiras([livro('a', 0, 4)], [], 1)[0]!.lugares[5]
    expect(comVizinho).toEqual(vazio)
  })

  it('a vaga tem a largura que o enfeite daquele lugar tinha: tirá-lo não faz a fileira andar', () => {
    const cheia = montarPrateleiras([], [], 1)[0]!
    const comVagas = montarPrateleiras(
      [],
      Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, i) => ({ prateleira: 0, ordem: i })),
      1,
    )[0]!
    expect(comVagas.lugares.every((l) => l.tipo === 'vazio')).toBe(true)
    expect(comVagas.lugares.map((l) => l.largura)).toEqual(cheia.lugares.map((l) => l.largura))
  })

  it('nunca perde um livro, nem os de fora da grade (dados de antes dos lugares)', () => {
    const estante = Array.from({ length: 30 }, (_, i) => livro(`l${String(i)}`, 0, i))
    const ids = livrosDe(montarPrateleiras(estante, [], 4)).map((x) => x.item.livro.id)
    expect(ids).toEqual(estante.map((e) => e.livro.id))
  })

  // A promessa da mobília: o mesmo palácio tem que dar sempre o mesmo desenho,
  // ou reabrir o app reembaralharia a estante. Vale para enfeite também.
  it('é determinístico entre chamadas', () => {
    const estante = Array.from({ length: 9 }, (_, i) => livro(`l${String(i)}`, i % 4, i))
    const vagas: Vaga[] = [{ prateleira: 2, ordem: 11 }]
    expect(montarPrateleiras(estante, vagas, 4)).toEqual(montarPrateleiras(estante, vagas, 4))
  })

  it('dá à mesma lombada sempre a mesma largura, esteja onde estiver', () => {
    const largura = (ps: readonly Prateleira[]): number | undefined =>
      livrosDe(ps).find((x) => x.item.livro.id === 'psi')?.largura

    const sozinho = montarPrateleiras([livro('psi', 0, 0)], [], 4)
    const acompanhado = montarPrateleiras(
      [livro('a', 0, 0), livro('b', 0, 1), livro('c', 1, 0), livro('psi', 2, 9)],
      [],
      4,
    )
    expect(largura(sozinho)).toBe(largura(acompanhado))
  })

  it('usa a largura escolhida na mão, ignorando a semente do id', () => {
    const [x] = livrosDe(montarPrateleiras([livro('psi', 0, 0, 68)], [], 1))
    expect(x!.largura).toBe(68)
  })

  it('sem largura escolhida, cai na semente do id (comportamento de sempre)', () => {
    const [x] = livrosDe(montarPrateleiras([livro('psi', 0, 0, null)], [], 1))
    expect(x!.largura).toBeGreaterThanOrEqual(30)
    expect(x!.largura).toBeLessThanOrEqual(46)
  })
})

describe('as laterais sólidas', () => {
  /** O que a fileira ocupa do primeiro lugar até o último livro, com o 1px entre eles. */
  function ocupadoAteOUltimoLivro(p: Prateleira): number {
    let ultimo = -1
    p.lugares.forEach((l, i) => {
      if (l.tipo === 'livro') ultimo = i
    })
    const larguras = p.lugares.slice(0, ultimo + 1).map((l) => l.largura)
    return larguras.reduce((total, w) => total + w, 0) + larguras.length - 1
  }

  const livrosDoPrefixo = (p: Prateleira): number[] =>
    p.lugares.filter((l) => l.tipo === 'livro').map((l) => l.largura)

  it('cabendo do tamanho de sempre, nada muda', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 9, 38)]
    expect(montarPrateleiras(estante, [], 1, 10_000)).toEqual(montarPrateleiras(estante, [], 1))
  })

  it('sem enfeite entre os livros que precise ceder, também não muda', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 1, 38)]
    const natural = montarPrateleiras(estante, [], 1)
    expect(montarPrateleiras(estante, [], 1, 120)[0]!.lugares.slice(0, 2)).toEqual(
      natural[0]!.lugares.slice(0, 2),
    )
  })

  it('o livro longe da lateral esquerda faz os enfeites encolherem, e ele cabe inteiro', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 9, 38)]
    const natural = montarPrateleiras(estante, [], 1)[0]!
    expect(ocupadoAteOUltimoLivro(natural)).toBeGreaterThan(300)

    const ajustada = montarPrateleiras(estante, [], 1, 300)[0]!
    expect(ocupadoAteOUltimoLivro(ajustada)).toBeLessThanOrEqual(300)
    expect(livrosDoPrefixo(ajustada)).toEqual([38, 38])

    // Nenhum lugar sumiu e só enfeite encolheu — nunca abaixo do mínimo.
    expect(ajustada.lugares).toHaveLength(natural.lugares.length)
    ajustada.lugares.forEach((l, i) => {
      const antes = natural.lugares[i]!
      expect(l.indice).toBe(antes.indice)
      if (l.tipo === 'enfeite') {
        expect(l.largura).toBeGreaterThanOrEqual(LARGURA_MINIMA_DO_ENFEITE)
        expect(l.largura).toBeLessThanOrEqual(antes.largura)
      }
    })
  })

  it('a vaga encolhe junto com o enfeite: a fileira não anda quando um vira o outro', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 9, 38)]
    const comEnfeite = montarPrateleiras(estante, [], 1, 300)[0]!
    const comVaga = montarPrateleiras(estante, [{ prateleira: 0, ordem: 4 }], 1, 300)[0]!
    expect(comVaga.lugares.map((l) => l.largura)).toEqual(comEnfeite.lugares.map((l) => l.largura))
  })

  it('o que vem depois do último livro usa a mesma escala, sem passar da largura de sempre', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 9, 38)]
    const natural = montarPrateleiras(estante, [], 1)[0]!
    const ajustada = montarPrateleiras(estante, [], 1, 300)[0]!
    for (const [i, l] of ajustada.lugares.slice(10).entries()) {
      expect(l.largura).toBeLessThanOrEqual(natural.lugares[10 + i]!.largura)
    }
  })

  it('se nem com todos os enfeites no mínimo cabe, os que estão mais perto da lateral somem', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 9, 38)]
    const natural = montarPrateleiras(estante, [], 1)[0]!
    const ajustada = montarPrateleiras(estante, [], 1, 120)[0]!

    expect(ocupadoAteOUltimoLivro(ajustada)).toBeLessThanOrEqual(120)
    expect(livrosDoPrefixo(ajustada)).toEqual([38, 38])
    expect(ajustada.lugares.length).toBeLessThan(natural.lugares.length)

    // O que sobrou continua na ordem, e os livros não trocaram de lugar.
    const indices = ajustada.lugares.map((l) => l.indice)
    expect([...indices].sort((a, b) => a - b)).toEqual(indices)
    expect(ajustada.lugares.filter((l) => l.tipo === 'livro').map((l) => l.indice)).toEqual([0, 9])
  })

  it('livros que sozinhos passam da fileira ficam todos, sem enfeite nenhum antes do último', () => {
    const estante = [livro('a', 0, 0, 68), livro('b', 0, 3, 68), livro('c', 0, 7, 68)]
    const ajustada = montarPrateleiras(estante, [], 1, 150)[0]!
    expect(livrosDoPrefixo(ajustada)).toEqual([68, 68, 68])
    const ate = ajustada.lugares.findLastIndex((l) => l.tipo === 'livro')
    expect(ajustada.lugares.slice(0, ate + 1).every((l) => l.tipo === 'livro')).toBe(true)
  })

  it('prateleira sem livro não tem o que proteger', () => {
    expect(montarPrateleiras([], [], 1, 50)).toEqual(montarPrateleiras([], [], 1))
  })

  it('é determinístico: a mesma largura dá sempre a mesma fileira', () => {
    const estante = [livro('a', 0, 0, 52), livro('b', 0, 11, 24)]
    expect(montarPrateleiras(estante, [], 2, 280)).toEqual(montarPrateleiras(estante, [], 2, 280))
  })

  it('só a prateleira com o problema é ajustada', () => {
    const estante = [livro('a', 0, 0, 38), livro('b', 0, 9, 38), livro('c', 1, 0, 38)]
    const natural = montarPrateleiras(estante, [], 2)
    const ajustada = montarPrateleiras(estante, [], 2, 300)
    expect(ajustada[1]).toEqual(natural[1])
    expect(ajustada[0]).not.toEqual(natural[0])
  })
})

describe('quanto os livros ocupam', () => {
  it('soma as larguras e o 1px entre dois livros', () => {
    expect(larguraDosLivros([])).toBe(0)
    expect(larguraDosLivros([38])).toBe(38)
    expect(larguraDosLivros([38, 24, 68])).toBe(38 + 24 + 68 + 2)
  })

  it('conta só os livros da prateleira pedida', () => {
    const livros = [livro('a', 0, 0, 38), livro('b', 0, 3, 52), livro('c', 1, 0, 68)].map(
      (e) => e.livro,
    )
    expect(larguraDosLivrosDaPrateleira(livros, 0)).toBe(38 + 52 + 1)
    expect(larguraDosLivrosDaPrateleira(livros, 1)).toBe(68)
    expect(larguraDosLivrosDaPrateleira(livros, 2)).toBe(0)
  })
})

describe('cabeNaPrateleira', () => {
  it('cabe enquanto os livros ficam dentro da fileira', () => {
    expect(cabeNaPrateleira(300, 372, 372)).toBe(true)
    expect(cabeNaPrateleira(300, 373, 372)).toBe(false)
  })

  it('quem já estava além do limite pode ser mexido, desde que não piore', () => {
    expect(cabeNaPrateleira(400, 400, 372)).toBe(true)
    expect(cabeNaPrateleira(400, 390, 372)).toBe(true)
    expect(cabeNaPrateleira(400, 410, 372)).toBe(false)
  })
})
