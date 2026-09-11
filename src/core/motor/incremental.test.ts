import { describe, expect, it } from 'vitest'

import type { Conexao } from '../domain/types'

import { OPCOES_PADRAO } from './config'
import { HUB, mantidasPorNo, no, PALACIO, porPar, vizinhosDe } from './fixtures'
import {
  arestaParaConexao,
  construirGrafo,
  perfilDoPalacio,
  SEM_RERANK,
  type ArestaCalculada,
  type NoDoGrafo,
  type PontuarPar,
} from './grafo'
import {
  aplicarIncremental,
  estadoDosVizinhos,
  recalcularVizinhanca,
  type ResultadoIncremental,
} from './incremental'

const T0 = new Date('2026-01-01T12:00:00.000Z')

/** Estado derivado do último reprocessamento — congelado enquanto neurônios entram. */
const PERFIL = perfilDoPalacio(PALACIO)

function comoConexoes(arestas: readonly ArestaCalculada[]): Conexao[] {
  return arestas.map((a) => arestaParaConexao(a, T0))
}

function tocam(arestas: readonly ArestaCalculada[], id: string): ArestaCalculada[] {
  return arestas.filter((a) => a.aId === id || a.bId === id)
}

interface Comparacao {
  resultado: ResultadoIncremental
  /** O grafo anterior com o recálculo aplicado — o que o banco teria. */
  aplicado: ArestaCalculada[]
  /** O grafo inteiro recalculado do zero — a verdade. */
  completo: ArestaCalculada[]
}

/**
 * Roda os dois caminhos sobre o mesmo cenário: chegar um neurônio novo pelo
 * caminho incremental tem que dar exatamente o mesmo grafo que reprocessar tudo.
 */
async function comparar(alvo: NoDoGrafo, pontuar: PontuarPar = SEM_RERANK): Promise<Comparacao> {
  const todos = [...PALACIO, alvo]
  const antes = await construirGrafo(PALACIO, pontuar, OPCOES_PADRAO, PERFIL)

  const resultado = await recalcularVizinhanca(
    alvo.id,
    todos,
    estadoDosVizinhos(comoConexoes(antes)),
    PERFIL,
    pontuar,
    OPCOES_PADRAO,
  )

  return {
    resultado,
    aplicado: aplicarIncremental(antes, alvo.id, resultado),
    completo: await construirGrafo(todos, pontuar, OPCOES_PADRAO, PERFIL),
  }
}

describe('perfilDoPalacio', () => {
  it('guarda o cosseno do último candidato que coube na lista de cada nó', () => {
    expect(PERFIL.limiarPorNo.size).toBe(PALACIO.length)
    for (const n of PALACIO) {
      const limiar = PERFIL.limiarPorNo.get(n.id)!
      expect(limiar).toBeGreaterThanOrEqual(-1)
      expect(limiar).toBeLessThanOrEqual(1)
    }
  })

  it('com menos nós que candK, o limiar cai para o pior vizinho', () => {
    const dois = PALACIO.slice(0, 2)
    const perfil = perfilDoPalacio(dois)
    expect(perfil.limiarPorNo.get(dois[0]!.id)).toBeCloseTo(-1, 6)
  })

  it('deriva a escala do corpus, e não de uma constante', async () => {
    // O defeito que o spike da Fase 3 achou: com divisor fixo de 0,45 sobre um
    // corpus de cossenos centralizados baixos, todo `emb` saía perto de zero.
    const arestas = await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, PERFIL)
    const melhorEmb = Math.max(...arestas.map((a) => a.emb))

    expect(PERFIL.escalaEmb).not.toBe(0.45)
    expect(melhorEmb).toBeGreaterThan(0.5)
  })

  it('não deixa a escala cair a zero num palácio degenerado', () => {
    // Dois textos idênticos: centralizar anula os dois vetores e todo cosseno é 0.
    const iguais = [no('a', 'l', { 0: 1 }), no('b', 'l', { 0: 1 })]
    expect(perfilDoPalacio(iguais).escalaEmb).toBe(OPCOES_PADRAO.escalaEmbMinima)
  })

  it('mudar só a escala não inventa nem apaga aresta', async () => {
    // Enquanto nada satura, a seleção é por corte relativo — invariante a escala.
    const largo = { ...PERFIL, escalaEmb: PERFIL.escalaEmb * 4 }

    const a = await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, PERFIL)
    const b = await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, largo)

    expect([...porPar(b).keys()].sort()).toEqual([...porPar(a).keys()].sort())
    expect(porPar(b).values().next().value!.score).not.toBe(porPar(a).values().next().value!.score)
  })
})

describe('estadoDosVizinhos', () => {
  it('só conta a aresta para o lado que a mantém', () => {
    const conexoes: Conexao[] = [
      {
        id: 'a::b',
        aId: 'a',
        bId: 'b',
        score: 0.9,
        emb: 0.9,
        rr: null,
        cross: false,
        mantidaPorA: true,
        mantidaPorB: false,
        updatedAt: T0,
      },
    ]

    const estado = estadoDosVizinhos(conexoes)
    expect(estado.get('a')).toEqual([{ outroId: 'b', score: 0.9 }])
    expect(estado.get('b')).toBeUndefined()
  })

  it('ordena o que cada nó mantém do melhor para o pior', () => {
    const aresta = (b: string, score: number): Conexao => ({
      id: `a::${b}`,
      aId: 'a',
      bId: b,
      score,
      emb: score,
      rr: null,
      cross: false,
      mantidaPorA: true,
      mantidaPorB: true,
      updatedAt: T0,
    })

    const estado = estadoDosVizinhos([aresta('x', 0.3), aresta('z', 0.9), aresta('y', 0.6)])
    expect(estado.get('a')?.map((m) => m.outroId)).toEqual(['z', 'y', 'x'])
  })
})

describe('recalcularVizinhanca', () => {
  it('exige que o alvo esteja na lista de nós', async () => {
    await expect(recalcularVizinhanca('fantasma', PALACIO, new Map(), PERFIL)).rejects.toThrow(
      /não está na lista/,
    )
  })

  it('o neurônio novo nunca nasce órfão', async () => {
    const solto = no('mus-solto', 'mus', { 15: 1 })
    const { resultado } = await comparar(solto)

    expect(resultado.arestas.length).toBeGreaterThanOrEqual(OPCOES_PADRAO.minVizinhos)
    expect(resultado.arestas.every((a) => a.aId === solto.id || a.bId === solto.id)).toBe(true)
  })

  it('dá o mesmo grafo que reprocessar tudo — vizinho isolado', async () => {
    const primo = no('mus-primo', 'mus', { 13: 1, 15: 0.2 })
    const { resultado, aplicado, completo } = await comparar(primo)

    expect(porPar(aplicado)).toEqual(porPar(completo))
    expect(vizinhosDe(resultado.arestas, primo.id)).toContain('mus-iso')
  })

  it('dá o mesmo grafo que reprocessar tudo — hub lotado', async () => {
    // Este é o caso duro: o recém-chegado é muito mais próximo do hub que os
    // satélites, então levanta o corte do hub e derruba as marcas dele de uma vez.
    const maisPerto = no('psi-s0', 'psi', { 0: 1, 7: 0.5 })
    const { resultado, aplicado, completo } = await comparar(maisPerto)

    expect(porPar(aplicado)).toEqual(porPar(completo))
    expect(vizinhosDe(resultado.arestas, HUB)).toContain(maisPerto.id)
    expect(resultado.marcasPerdidas.length).toBeGreaterThan(0)
    expect(mantidasPorNo(aplicado).get(HUB)).toBe(mantidasPorNo(completo).get(HUB))
  })

  it('dá o mesmo grafo que reprocessar tudo — mais um satélite comum', async () => {
    const maisUm = no('psi-s9', 'psi', { 0: 1, 8: 1.4 })
    const { aplicado, completo } = await comparar(maisUm)

    expect(porPar(aplicado)).toEqual(porPar(completo))
  })

  it('dá o mesmo grafo que reprocessar tudo — com o reranker ligado', async () => {
    const pontuar: PontuarPar = (a, b) => Promise.resolve(a.livroId === b.livroId ? 0.9 : 0.1)
    const primo = no('mus-primo', 'mus', { 13: 1, 15: 0.2 })
    const { aplicado, completo } = await comparar(primo, pontuar)

    expect(porPar(aplicado)).toEqual(porPar(completo))
  })

  it('sem o limiar recíproco perderia a aresta que só o vizinho quer', async () => {
    const maisPerto = no('psi-s0', 'psi', { 0: 1, 7: 0.5 })
    const perfilCego = { ...PERFIL, limiarPorNo: new Map<string, number>() }
    const todos = [...PALACIO, maisPerto]
    const estado = estadoDosVizinhos(
      comoConexoes(await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, PERFIL)),
    )

    const comLimiar = await recalcularVizinhanca(maisPerto.id, todos, estado, PERFIL)
    const semLimiar = await recalcularVizinhanca(maisPerto.id, todos, estado, perfilCego)

    expect(comLimiar.arestas.length).toBeGreaterThan(semLimiar.arestas.length)
  })

  it('toda aresta devolvida é sustentada por pelo menos um dos dois lados', async () => {
    const primo = no('mus-primo', 'mus', { 13: 1, 15: 0.2 })
    const { resultado } = await comparar(primo)

    for (const a of resultado.arestas) {
      expect(a.mantidaPorA || a.mantidaPorB, `${a.aId}--${a.bId} não é mantida por ninguém`).toBe(
        true,
      )
    }
  })

  it('reprocessar um neurônio que não mudou não mexe em nada', async () => {
    const completoAntes = await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, PERFIL)
    const estado = estadoDosVizinhos(comoConexoes(completoAntes))
    const alvo = PALACIO.find((n) => n.id === 'mus-iso')!

    const resultado = await recalcularVizinhanca(alvo.id, PALACIO, estado, PERFIL)

    expect(porPar(resultado.arestas)).toEqual(porPar(tocam(completoAntes, alvo.id)))
    expect(resultado.marcasPerdidas).toEqual([])
  })

  it('chama o reranker muito menos que o grafo inteiro', async () => {
    let chamadas = 0
    const contando: PontuarPar = () => {
      chamadas += 1
      return Promise.resolve(0.5)
    }

    const primo = no('mus-primo', 'mus', { 13: 1, 15: 0.2 })
    const todos = [...PALACIO, primo]
    const estado = estadoDosVizinhos(
      comoConexoes(await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, PERFIL)),
    )

    chamadas = 0
    await recalcularVizinhanca(primo.id, todos, estado, PERFIL, contando)
    const doIncremental = chamadas

    chamadas = 0
    await construirGrafo(todos, contando, OPCOES_PADRAO, PERFIL)
    const doCompleto = chamadas

    expect(doIncremental * 3).toBeLessThan(doCompleto)
  })
})

describe('aplicarIncremental', () => {
  it('apaga a aresta quando nenhum dos dois lados a sustenta mais', () => {
    const aresta: ArestaCalculada = {
      aId: 'x',
      bId: 'y',
      score: 0.4,
      emb: 0.4,
      rr: null,
      cross: false,
      mantidaPorA: true,
      mantidaPorB: false,
    }

    const depois = aplicarIncremental([aresta], 'alvo', {
      arestas: [],
      marcasPerdidas: [{ noId: 'x', outroId: 'y' }],
    })

    expect(depois).toEqual([])
  })

  it('mantém a aresta quando o outro lado ainda a sustenta', () => {
    const aresta: ArestaCalculada = {
      aId: 'x',
      bId: 'y',
      score: 0.4,
      emb: 0.4,
      rr: null,
      cross: false,
      mantidaPorA: true,
      mantidaPorB: true,
    }

    const depois = aplicarIncremental([aresta], 'alvo', {
      arestas: [],
      marcasPerdidas: [{ noId: 'x', outroId: 'y' }],
    })

    expect(depois).toEqual([{ ...aresta, mantidaPorA: false, mantidaPorB: true }])
  })
})
