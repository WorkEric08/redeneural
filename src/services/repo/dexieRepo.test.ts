/**
 * @vitest-environment node
 *
 * Em jsdom, o fake-indexeddb devolve um Float32Array do realm do Node enquanto o
 * teste enxerga o do jsdom — o `instanceof` falharia por motivo de ambiente, não
 * de código. No navegador de verdade os dois realms são o mesmo.
 */
import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { conexaoId, type Conexao, type Livro, type Neuronio, type PalacioRepo } from '@/core'
import { SEED_LIVROS, SEED_NEURONIOS, seedPalacio } from '@/features/palacio/seed'
import { createDb } from '@/services/db'

import { createDexieRepo } from './dexieRepo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

let repo: PalacioRepo
let nth = 0

beforeEach(() => {
  nth += 1
  repo = createDexieRepo(createDb(`palacio-test-${nth}`))
})

function livro(id: string, titulo: string): Livro {
  return { id, titulo, cor: '#6d5bd0', createdAt: T0 }
}

function neuronio(id: string, livroId: string, embedding: Float32Array | null = null): Neuronio {
  return {
    id,
    livroId,
    titulo: `neurônio ${id}`,
    conteudo: 'conteúdo de teste',
    embedding,
    createdAt: T0,
    updatedAt: T0,
  }
}

function conexao(x: string, y: string, cross = false): Conexao {
  const [aId, bId] = x < y ? [x, y] : [y, x]
  return {
    id: conexaoId(x, y),
    aId,
    bId,
    score: 0.8,
    emb: 0.7,
    rr: 0.9,
    cross,
    mantidaPorA: true,
    mantidaPorB: true,
    updatedAt: T0,
  }
}

describe('DexieRepo', () => {
  it('cria, lê e apaga', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))

    expect(await repo.listLivros()).toHaveLength(1)
    expect((await repo.getNeuronio('n1'))?.livroId).toBe('l1')

    await repo.deleteNeuronio('n1')
    expect(await repo.getNeuronio('n1')).toBeUndefined()
  })

  it('filtra neurônios por livro', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertLivro(livro('l2', 'Música'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', 'l2'))

    expect(await repo.listNeuronios('l1')).toHaveLength(1)
    expect(await repo.listNeuronios()).toHaveLength(2)
  })

  it('guarda o embedding como Float32Array, não como array JSON', async () => {
    const embedding = new Float32Array([0.1, -0.2, 0.3])
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1', embedding))

    const lido = await repo.getNeuronio('n1')
    expect(lido?.embedding).toBeInstanceOf(Float32Array)
    expect(Array.from(lido!.embedding!)).toEqual([
      Math.fround(0.1),
      Math.fround(-0.2),
      Math.fround(0.3),
    ])
  })

  it('apagar um neurônio leva junto as arestas que o tocavam', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    for (const id of ['n1', 'n2', 'n3']) await repo.upsertNeuronio(neuronio(id, 'l1'))
    await repo.replaceConexoesDe('n2', [conexao('n1', 'n2'), conexao('n2', 'n3')])

    expect(await repo.listConexoes()).toHaveLength(2)

    await repo.deleteNeuronio('n2')
    expect(await repo.listConexoes()).toHaveLength(0)
  })

  it('apagar um livro cascateia para neurônios e arestas', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertLivro(livro('l2', 'Música'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', 'l1'))
    await repo.upsertNeuronio(neuronio('n3', 'l2'))
    await repo.replaceConexoesDe('n1', [conexao('n1', 'n2'), conexao('n1', 'n3', true)])

    await repo.deleteLivro('l1')

    expect(await repo.listLivros()).toHaveLength(1)
    expect(await repo.listNeuronios()).toHaveLength(1)
    expect(await repo.listConexoes()).toHaveLength(0)
  })

  it('replaceConexoesDe troca só a vizinhança daquele neurônio', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    for (const id of ['n1', 'n2', 'n3', 'n4']) await repo.upsertNeuronio(neuronio(id, 'l1'))

    await repo.replaceConexoesDe('n1', [conexao('n1', 'n2')])
    await repo.replaceConexoesDe('n3', [conexao('n3', 'n4')])
    await repo.replaceConexoesDe('n1', [conexao('n1', 'n4')])

    const ids = (await repo.listConexoes()).map((c) => c.id).sort()
    expect(ids).toEqual([conexaoId('n1', 'n4'), conexaoId('n3', 'n4')].sort())
  })

  it('soltar a marca de um lado mantém a aresta que o outro ainda sustenta', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', 'l1'))
    await repo.replaceConexoesDe('n1', [conexao('n1', 'n2')])

    await repo.soltarMarcas([{ noId: 'n1', outroId: 'n2' }])

    const [sobrou] = await repo.listConexoes()
    expect(sobrou?.mantidaPorA).toBe(false)
    expect(sobrou?.mantidaPorB).toBe(true)
  })

  it('soltar a última marca apaga a aresta', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', 'l1'))
    await repo.replaceConexoesDe('n1', [conexao('n1', 'n2')])

    await repo.soltarMarcas([
      { noId: 'n1', outroId: 'n2' },
      { noId: 'n2', outroId: 'n1' },
    ])

    expect(await repo.listConexoes()).toHaveLength(0)
  })

  it('soltar marca de aresta inexistente não quebra', async () => {
    await expect(repo.soltarMarcas([{ noId: 'n1', outroId: 'n2' }])).resolves.toBeUndefined()
    await expect(repo.soltarMarcas([])).resolves.toBeUndefined()
  })

  it('guarda e devolve o perfil do palácio', async () => {
    const perfil = {
      centroide: new Float32Array([0.1, -0.2, 0.3]),
      limiarPorNo: new Map([
        ['n1', 0.4],
        ['n2', 0.25],
      ]),
      escalaEmb: 0.07,
    }

    expect(await repo.getPerfil()).toBeUndefined()
    await repo.setPerfil(perfil, 2)

    const lido = await repo.getPerfil()
    expect(lido?.escalaEmb).toBeCloseTo(0.07, 6)
    expect(Array.from(lido!.centroide)).toEqual([
      Math.fround(0.1),
      Math.fround(-0.2),
      Math.fround(0.3),
    ])
    expect(lido?.limiarPorNo.get('n1')).toBeCloseTo(0.4, 6)
    expect(lido?.limiarPorNo.size).toBe(2)
  })

  it('replaceTodasConexoes troca o grafo inteiro', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    for (const id of ['n1', 'n2', 'n3']) await repo.upsertNeuronio(neuronio(id, 'l1'))
    await repo.replaceConexoesDe('n1', [conexao('n1', 'n2')])

    await repo.replaceTodasConexoes([conexao('n2', 'n3')])

    const ids = (await repo.listConexoes()).map((c) => c.id)
    expect(ids).toEqual([conexaoId('n2', 'n3')])
  })

  it('limpar leva o perfil junto', async () => {
    await repo.setPerfil(
      { centroide: new Float32Array([1]), limiarPorNo: new Map(), escalaEmb: 0.5 },
      0,
    )
    await repo.clear()
    expect(await repo.getPerfil()).toBeUndefined()
  })

  it('recusa aresta que não toca o neurônio informado', async () => {
    await expect(repo.replaceConexoesDe('n1', [conexao('n2', 'n3')])).rejects.toThrow(/não toca/)
  })

  it('recusa aresta fora da ordem canônica', async () => {
    const torta: Conexao = { ...conexao('n1', 'n2'), aId: 'n2', bId: 'n1' }
    await expect(repo.replaceConexoesDe('n1', [torta])).rejects.toThrow()
  })

  it('exporta e importa sem perder nada, e importar de novo é idempotente', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertLivro(livro('l2', 'Música'))
    await repo.upsertNeuronio(neuronio('n1', 'l1', new Float32Array([0.25, -0.5])))
    await repo.upsertNeuronio(neuronio('n2', 'l2'))
    await repo.replaceConexoesDe('n1', [conexao('n1', 'n2', true)])

    const snapshot = await repo.exportAll()

    const outro = createDexieRepo(createDb('palacio-test-import'))
    await outro.importAll(JSON.parse(JSON.stringify(snapshot)) as typeof snapshot)
    await outro.importAll(snapshot)

    expect(await outro.listLivros()).toHaveLength(2)
    expect(await outro.listNeuronios()).toHaveLength(2)
    expect(await outro.listConexoes()).toHaveLength(1)

    const n1 = await outro.getNeuronio('n1')
    expect(Array.from(n1!.embedding!)).toEqual([0.25, -0.5])
    expect((await outro.listConexoes())[0]?.cross).toBe(true)
  })

  it('recusa snapshot com neurônio apontando para livro inexistente', async () => {
    const snapshot = await repo.exportAll()
    snapshot.neuronios.push({
      id: 'n9',
      livroId: 'fantasma',
      titulo: 'órfão',
      conteudo: '',
      embedding: null,
      createdAt: T0.toISOString(),
      updatedAt: T0.toISOString(),
    })

    await expect(repo.importAll(snapshot)).rejects.toThrow(/livro inexistente/)
  })
})

describe('seed', () => {
  it('popula o palácio e não duplica na segunda chamada', async () => {
    expect(await seedPalacio(repo)).toBe(true)
    expect(await seedPalacio(repo)).toBe(false)

    expect(await repo.listLivros()).toHaveLength(SEED_LIVROS.length)
    expect(await repo.listNeuronios()).toHaveLength(SEED_NEURONIOS.length)
    expect((await repo.listNeuronios()).every((n) => n.embedding === null)).toBe(true)
  })
})
