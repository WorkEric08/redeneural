/**
 * @vitest-environment node
 *
 * Em jsdom, o fake-indexeddb devolve um Float32Array do realm do Node enquanto o
 * teste enxerga o do jsdom — o `instanceof` falharia por motivo de ambiente, não
 * de código. No navegador de verdade os dois realms são o mesmo.
 */
import 'fake-indexeddb/auto'

import Dexie from 'dexie'
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

function livro(id: string, titulo: string, ordem = 0): Livro {
  return { id, titulo, cor: '#6d5bd0', ordem, createdAt: T0 }
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

  it('nasce na mesma ordem que a estante mostrava antes de guardar ordem', async () => {
    await seedPalacio(repo)
    expect((await repo.listLivros()).map((l) => l.titulo)).toEqual([
      'Psicologia',
      'Música',
      'Programação',
    ])
  })
})

describe('ordem da estante', () => {
  const ids = async (): Promise<string[]> => (await repo.listLivros()).map((l) => l.id)

  it('lista na ordem da estante, não na de criação', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia', 2))
    await repo.upsertLivro(livro('l2', 'Música', 0))
    await repo.upsertLivro(livro('l3', 'Programação', 1))

    expect(await ids()).toEqual(['l2', 'l3', 'l1'])
  })

  it('reordenar grava a estante inteira de uma vez', async () => {
    for (const [i, id] of ['l1', 'l2', 'l3'].entries()) await repo.upsertLivro(livro(id, id, i))

    await repo.reordenarLivros(['l3', 'l1', 'l2'])

    expect((await repo.listLivros()).map((l) => [l.id, l.ordem])).toEqual([
      ['l3', 0],
      ['l1', 1],
      ['l2', 2],
    ])
  })

  // Gravar uma lista pela metade deixaria dois livros no mesmo lugar.
  it('recusa lista que não bate com a estante gravada, sem mexer em nada', async () => {
    for (const [i, id] of ['l1', 'l2', 'l3'].entries()) await repo.upsertLivro(livro(id, id, i))

    await expect(repo.reordenarLivros(['l2', 'l1'])).rejects.toThrow()
    await expect(repo.reordenarLivros(['l2', 'l1', 'l1'])).rejects.toThrow()
    await expect(repo.reordenarLivros(['l2', 'l1', 'fantasma'])).rejects.toThrow(/l3/)

    expect(await ids()).toEqual(['l1', 'l2', 'l3'])
  })
})

describe('migração para a v3', () => {
  // É o que acontece no aparelho de quem já usava o app: o banco abre em v2, com
  // livros sem `ordem`, e nenhum deles pode mudar de lugar na tela.
  it('dá a cada livro antigo a posição que ele tinha na estante', async () => {
    const nome = `palacio-migracao-${String(nth)}`

    const antigo = new Dexie(nome)
    antigo.version(1).stores({
      livros: 'id, createdAt',
      neuronios: 'id, livroId, updatedAt',
      conexoes: 'id, aId, bId, updatedAt',
    })
    antigo.version(2).stores({ meta: 'chave' })
    await antigo.table<Omit<Livro, 'ordem'>, string>('livros').bulkPut([
      { id: 'b5fd', titulo: 'Programação', cor: '#3e9a93', createdAt: T0 },
      { id: '382f', titulo: 'Psicologia', cor: '#7b6ae0', createdAt: T0 },
      { id: '8ef8', titulo: 'Música', cor: '#c8734a', createdAt: T0 },
      { id: 'zzzz', titulo: 'O mais antigo', cor: '#6d5bd0', createdAt: new Date(0) },
    ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))

    // A tela ordenava por `createdAt` e o IndexedDB desempatava pelo id.
    expect((await migrado.listLivros()).map((l) => [l.titulo, l.ordem])).toEqual([
      ['O mais antigo', 0],
      ['Psicologia', 1],
      ['Música', 2],
      ['Programação', 3],
    ])
  })
})
