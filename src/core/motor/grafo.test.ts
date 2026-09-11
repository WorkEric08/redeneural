import { describe, expect, it } from 'vitest'

import { OPCOES_PADRAO, type OpcoesMotor } from './config'
import {
  grausDe,
  HUB,
  mantidasPorNo,
  no,
  PALACIO,
  PALACIO_GRANDE,
  PERIFERICO,
  porPar,
  vizinhosDe,
} from './fixtures'
import {
  perfilDoPalacio,
  construirGrafo,
  SEM_RERANK,
  textoDoNeuronio,
  type ArestaCalculada,
  type PontuarPar,
} from './grafo'

function rerankFixo(valor: number): PontuarPar {
  return () => Promise.resolve(valor)
}

describe('construirGrafo', () => {
  it('não inventa aresta com menos de dois nós', async () => {
    expect(await construirGrafo([])).toEqual([])
    expect(await construirGrafo([PALACIO[0]!])).toEqual([])
  })

  it('não deixa nenhum neurônio órfão', async () => {
    const grau = grausDe(await construirGrafo(PALACIO))

    for (const n of PALACIO) {
      expect(grau.get(n.id) ?? 0, `${n.id} ficou órfão`).toBeGreaterThanOrEqual(1)
    }
  })

  it('mantém pelo menos um vizinho mesmo para quem não se parece com nada', async () => {
    const arestas = await construirGrafo(PALACIO)
    expect(mantidasPorNo(arestas).get('mus-iso') ?? 0).toBeGreaterThanOrEqual(1)
  })

  it('nenhum nó mantém mais vizinhos que o teto', async () => {
    // candK acima do teto para que o corte seja mesmo o teto, e não a lista de candidatos.
    const apertado: OpcoesMotor = { ...OPCOES_PADRAO, candK: 10, maxVizinhos: 3 }
    const arestas = await construirGrafo(PALACIO, SEM_RERANK, apertado)

    for (const [id, quantas] of mantidasPorNo(arestas)) {
      expect(quantas, `${id} manteve ${quantas}`).toBeLessThanOrEqual(apertado.maxVizinhos)
    }
  })

  it('o teto limita o que o nó mantém, não o grau dele — é assim que nasce um hub', async () => {
    const arestas = await construirGrafo(PALACIO_GRANDE)

    // O hub só cabe seis vizinhos, mas os oito satélites o escolhem de volta e a
    // aresta sobrevive pelo lado deles. É a assimetria que faz um hub existir.
    expect(mantidasPorNo(arestas).get(HUB)).toBe(OPCOES_PADRAO.maxVizinhos)
    expect(grausDe(arestas).get(HUB)).toBe(8)

    for (let k = 1; k <= 8; k++) {
      expect(grausDe(arestas).get(`psi-s${k}`)).toBe(1)
    }
  })

  it('o hub tem mais conexões que o periférico', async () => {
    const grau = grausDe(await construirGrafo(PALACIO))

    expect(grau.get(HUB)!).toBeGreaterThan(grau.get(PERIFERICO)!)
    expect(grau.get(HUB)!).toBeGreaterThan(grau.get('mus-iso')!)
  })

  it('marca como cross só o que atravessa livros', async () => {
    const arestas = await construirGrafo(PALACIO)
    const livroDe = new Map(PALACIO.map((n) => [n.id, n.livroId]))

    for (const a of arestas) {
      expect(a.cross).toBe(livroDe.get(a.aId) !== livroDe.get(a.bId))
    }
    expect(arestas.some((a) => a.cross)).toBe(true)
  })

  it('sem reranker, o score é o embedding puro', async () => {
    const arestas = await construirGrafo(PALACIO, SEM_RERANK)

    for (const a of arestas) {
      expect(a.rr).toBeNull()
      expect(a.score).toBe(a.emb)
    }
  })

  it('com reranker, os dois votos pesam igual', async () => {
    const arestas = await construirGrafo(PALACIO, rerankFixo(0.4))

    for (const a of arestas) {
      expect(a.rr).toBe(0.4)
      expect(a.score).toBeCloseTo(0.5 * a.emb + 0.5 * 0.4, 9)
    }
  })

  it('o reranker consegue derrubar um par que o embedding aproximou', async () => {
    const soEmbedding = porPar(await construirGrafo(PALACIO, SEM_RERANK))
    const comCastigo: PontuarPar = (a, b) => Promise.resolve(a.livroId === b.livroId ? 0.9 : 0)

    const comReranker = porPar(await construirGrafo(PALACIO, comCastigo))
    const parCross = [...soEmbedding.values()].find((a) => a.cross)!

    expect(comReranker.get(`${parCross.aId}::${parCross.bId}`)!.score).toBeLessThan(parCross.score)
  })

  it('não depende da ordem de entrada', async () => {
    const perfil = perfilDoPalacio(PALACIO)
    const embaralhado = [...PALACIO].reverse()

    const a = porPar(await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, perfil))
    const b = porPar(await construirGrafo(embaralhado, SEM_RERANK, OPCOES_PADRAO, perfil))

    expect([...b.keys()].sort()).toEqual([...a.keys()].sort())
    for (const [chave, aresta] of a) {
      expect(b.get(chave)!.score).toBe(aresta.score)
      expect(b.get(chave)!.mantidaPorA).toBe(aresta.mantidaPorA)
      expect(b.get(chave)!.mantidaPorB).toBe(aresta.mantidaPorB)
    }
  })

  it('adicionar um neurônio não muda o score de nenhum par existente', async () => {
    // Cenário real: o centroide foi calculado no último reprocessamento e fica
    // congelado enquanto neurônios entram.
    const perfil = perfilDoPalacio(PALACIO)
    const novo = no('mus-novo', 'mus', { 14: 1, 15: 0.4 })

    const antes = porPar(await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, perfil))
    const depois = porPar(
      await construirGrafo([...PALACIO, novo], SEM_RERANK, OPCOES_PADRAO, perfil),
    )

    let comparados = 0
    for (const [chave, aresta] of depois) {
      const original = antes.get(chave)
      if (!original) continue
      expect(aresta.score, `score de ${chave} mudou`).toBe(original.score)
      expect(aresta.emb).toBe(original.emb)
      comparados++
    }
    expect(comparados).toBeGreaterThan(0)
  })

  it('quem está longe do neurônio novo não sente nada', async () => {
    const perfil = perfilDoPalacio(PALACIO)
    const novo = no('mus-novo', 'mus', { 14: 1, 15: 0.4 })
    const soPsi = ([chave]: [string, ArestaCalculada]): boolean =>
      chave.split('::').every((id) => id.startsWith('psi-'))

    const antes = [...porPar(await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, perfil))]
    const depois = [
      ...porPar(await construirGrafo([...PALACIO, novo], SEM_RERANK, OPCOES_PADRAO, perfil)),
    ]

    expect(depois.filter(soPsi)).toEqual(antes.filter(soPsi))
    expect(antes.filter(soPsi).length).toBeGreaterThan(0)
  })

  it('mas quem estava sozinho pode trocar de vizinho quando aparece um parente', async () => {
    // O contrário disso seria pior: um neurônio ficaria preso para sempre à
    // primeira aproximação ruim que fez.
    const perfil = perfilDoPalacio(PALACIO)
    const primo = no('mus-primo', 'mus', { 13: 1, 15: 0.2 })

    const antes = await construirGrafo(PALACIO, SEM_RERANK, OPCOES_PADRAO, perfil)
    const depois = await construirGrafo([...PALACIO, primo], SEM_RERANK, OPCOES_PADRAO, perfil)

    expect(vizinhosDe(antes, 'mus-iso')).toEqual(['prog-p1', 'prog-p2'])
    expect(vizinhosDe(depois, 'mus-iso')).toContain('mus-primo')
  })

  it('recalcular o centroide reembaralha os scores — é por isso que ele é congelado', async () => {
    const novo = no('mus-novo', 'mus', { 14: 1, 15: 0.4 })
    const todos = [...PALACIO, novo]

    const congelado = porPar(
      await construirGrafo(todos, SEM_RERANK, OPCOES_PADRAO, perfilDoPalacio(PALACIO)),
    )
    const recalculado = porPar(
      await construirGrafo(todos, SEM_RERANK, OPCOES_PADRAO, perfilDoPalacio(todos)),
    )

    const mudou = [...congelado].some(([chave, a]) => recalculado.get(chave)?.score !== a.score)
    expect(mudou).toBe(true)
  })

  it('ignora o reranker quando ele devolve null, sem quebrar', async () => {
    const intermitente: PontuarPar = (a) => Promise.resolve(a.livroId === 'psi' ? 0.8 : null)
    const arestas = await construirGrafo(PALACIO, intermitente)

    expect(arestas.some((a) => a.rr === null)).toBe(true)
    expect(arestas.some((a) => a.rr === 0.8)).toBe(true)
    for (const a of arestas) {
      expect(a.score).toBeGreaterThanOrEqual(0)
      expect(a.score).toBeLessThanOrEqual(1)
    }
  })
})

describe('textoDoNeuronio', () => {
  it('junta título e conteúdo, e aguenta conteúdo vazio', () => {
    expect(textoDoNeuronio({ titulo: ' Cache ', conteudo: ' guardar perto ' })).toBe(
      'Cache. guardar perto',
    )
    expect(textoDoNeuronio({ titulo: 'Cache', conteudo: '   ' })).toBe('Cache')
  })
})
