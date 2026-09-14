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

function livro(id: string, titulo: string, ordem = 0, prateleira = 0): Livro {
  return {
    id,
    titulo,
    cor: '#6d5bd0',
    prateleira,
    ordem,
    emblema: null,
    larguraLombada: null,
    createdAt: T0,
  }
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

  it('grava e devolve o emblema do livro', async () => {
    await repo.upsertLivro({ ...livro('l1', 'Psicologia'), emblema: 'estrela' })
    expect((await repo.getLivro('l1'))?.emblema).toBe('estrela')
  })

  it('recusa emblema com string vazia — use null para "nenhum"', async () => {
    await expect(repo.upsertLivro({ ...livro('l1', 'Psicologia'), emblema: '' })).rejects.toThrow()
  })

  it('grava e devolve a largura da lombada escolhida na mão', async () => {
    await repo.upsertLivro({ ...livro('l1', 'Psicologia'), larguraLombada: 68 })
    expect((await repo.getLivro('l1'))?.larguraLombada).toBe(68)
  })

  it('recusa largura fora da faixa — livro não vira cartaz nem desaparece', async () => {
    await expect(
      repo.upsertLivro({ ...livro('l1', 'Psicologia'), larguraLombada: 4 }),
    ).rejects.toThrow()
    await expect(
      repo.upsertLivro({ ...livro('l1', 'Psicologia'), larguraLombada: 500 }),
    ).rejects.toThrow()
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

  it('lista por prateleira, e dentro dela por ordem — não pela de criação', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia', 2))
    await repo.upsertLivro(livro('l2', 'Música', 0))
    await repo.upsertLivro(livro('l3', 'Programação', 1))

    expect(await ids()).toEqual(['l2', 'l3', 'l1'])
  })

  it('lista prateleira por prateleira, mesmo fora de ordem de criação', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia', 0, 1))
    await repo.upsertLivro(livro('l2', 'Música', 0, 0))
    await repo.upsertLivro(livro('l3', 'Programação', 1, 0))

    expect(await ids()).toEqual(['l2', 'l3', 'l1'])
  })

  it('mover empurra quem está na posição em diante, dentro da prateleira', async () => {
    for (const [i, id] of ['l1', 'l2', 'l3'].entries()) await repo.upsertLivro(livro(id, id, i))

    await repo.moverLivro('l3', 0, 0)

    expect((await repo.listLivros()).map((l) => [l.id, l.ordem])).toEqual([
      ['l3', 0],
      ['l1', 1],
      ['l2', 2],
    ])
  })

  it('mover para outra prateleira não mexe em livro de uma terceira', async () => {
    await repo.upsertLivro(livro('a', 'a', 0, 0))
    await repo.upsertLivro(livro('b', 'b', 1, 0))
    await repo.upsertLivro(livro('x', 'x', 0, 2))

    await repo.moverLivro('a', 5, 0)

    const porId = new Map((await repo.listLivros()).map((l) => [l.id, [l.prateleira, l.ordem]]))
    expect(porId.get('a')).toEqual([5, 0])
    expect(porId.get('b')).toEqual([0, 0]) // fechou o buraco que 'a' deixou
    expect(porId.get('x')).toEqual([2, 0]) // outra prateleira, intocada
  })

  it('recusa mover livro que não existe', async () => {
    await expect(repo.moverLivro('fantasma', 0, 0)).rejects.toThrow(/fantasma/)
  })
})

describe('quantidade de prateleiras', () => {
  it('4 por padrão, quando nunca foi definida', async () => {
    expect(await repo.getQuantidadeDePrateleiras()).toBe(4)
  })

  it('grava e devolve o que foi definido', async () => {
    await repo.definirQuantidadeDePrateleiras(6)
    expect(await repo.getQuantidadeDePrateleiras()).toBe(6)
  })

  // Diminuir sem mover os livros antes perderia livro de vista: a prateleira
  // deixaria de existir na tela, mas ele continuaria gravado nela.
  it('recusa diminuir se sobrar livro numa prateleira que deixaria de existir', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia', 0, 2))

    await expect(repo.definirQuantidadeDePrateleiras(2)).rejects.toThrow()
    expect(await repo.getQuantidadeDePrateleiras()).toBe(4)
  })

  it('aceita diminuir quando nenhum livro fica para trás', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia', 0, 1))

    await repo.definirQuantidadeDePrateleiras(2)
    expect(await repo.getQuantidadeDePrateleiras()).toBe(2)
  })

  it('definir uma não apaga a intensidade da luz já gravada, e vice-versa', async () => {
    await repo.definirIntensidadeDaLuz(70)
    await repo.definirQuantidadeDePrateleiras(6)
    expect(await repo.getIntensidadeDaLuz()).toBe(70)

    await repo.definirIntensidadeDaLuz(10)
    expect(await repo.getQuantidadeDePrateleiras()).toBe(6)
  })
})

describe('intensidade da luz', () => {
  it('42 por padrão, quando nunca foi definida', async () => {
    expect(await repo.getIntensidadeDaLuz()).toBe(42)
  })

  it('grava e devolve o que foi definido', async () => {
    await repo.definirIntensidadeDaLuz(80)
    expect(await repo.getIntensidadeDaLuz()).toBe(80)
  })

  it('recorta para 0-100', async () => {
    await repo.definirIntensidadeDaLuz(150)
    expect(await repo.getIntensidadeDaLuz()).toBe(100)

    await repo.definirIntensidadeDaLuz(-30)
    expect(await repo.getIntensidadeDaLuz()).toBe(0)
  })
})

describe('migração para a v3', () => {
  // É o que acontece no aparelho de quem já usava o app: o banco abre em v2, com
  // livros sem `ordem`, e nenhum deles pode mudar de lugar na tela. Como
  // `createDb` já define até a v4, a migração passa pelas duas em sequência —
  // por isso o teste também confere prateleira/quantidade, e não só ordem.
  it('dá a cada livro antigo a posição que ele tinha na estante', async () => {
    const nome = `palacio-migracao-${String(nth)}`

    const antigo = new Dexie(nome)
    antigo.version(1).stores({
      livros: 'id, createdAt',
      neuronios: 'id, livroId, updatedAt',
      conexoes: 'id, aId, bId, updatedAt',
    })
    antigo.version(2).stores({ meta: 'chave' })
    await antigo
      .table<Omit<Livro, 'ordem' | 'prateleira' | 'emblema' | 'larguraLombada'>, string>('livros')
      .bulkPut([
        { id: 'b5fd', titulo: 'Programação', cor: '#3e9a93', createdAt: T0 },
        { id: '382f', titulo: 'Psicologia', cor: '#7b6ae0', createdAt: T0 },
        { id: '8ef8', titulo: 'Música', cor: '#c8734a', createdAt: T0 },
        { id: 'zzzz', titulo: 'O mais antigo', cor: '#6d5bd0', createdAt: new Date(0) },
      ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))

    // A tela ordenava por `createdAt` e o IndexedDB desempatava pelo id. Com só
    // 4 livros, a distribuição antiga dava uma prateleira para cada um.
    expect((await migrado.listLivros()).map((l) => [l.titulo, l.prateleira, l.ordem])).toEqual([
      ['O mais antigo', 0, 0],
      ['Psicologia', 1, 0],
      ['Música', 2, 0],
      ['Programação', 3, 0],
    ])
    expect(await migrado.getQuantidadeDePrateleiras()).toBe(4)
  })
})

describe('migração para a v4', () => {
  // Parte de um banco já em v3 (com `ordem`, sem `prateleira`) — o estado de
  // quem atualizou o app entre a Fase 9 e a Fase 10.
  it('agrupa os livros antigos pela mesma distribuição automática de antes', async () => {
    const nome = `palacio-migracao-v4-${String(nth)}`

    const antigo = new Dexie(nome)
    antigo.version(1).stores({
      livros: 'id, createdAt',
      neuronios: 'id, livroId, updatedAt',
      conexoes: 'id, aId, bId, updatedAt',
    })
    antigo.version(2).stores({ meta: 'chave' })
    antigo.version(3).stores({ livros: 'id, createdAt, ordem' })
    // 7 livros: a distribuição antiga dá 4 prateleiras, 2 por prateleira (a
    // última com sobra), então o teste exercita mais de um livro por prateleira.
    await antigo
      .table<Omit<Livro, 'prateleira' | 'emblema' | 'larguraLombada'>, string>('livros')
      .bulkPut(
        Array.from({ length: 7 }, (_, i) => ({
          id: `l${String(i)}`,
          titulo: `Livro ${String(i)}`,
          cor: '#6d5bd0',
          ordem: i,
          createdAt: T0,
        })),
      )
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const livros = await migrado.listLivros()

    expect(livros.map((l) => [l.prateleira, l.ordem])).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 1],
      [3, 0],
    ])
    expect(await migrado.getQuantidadeDePrateleiras()).toBe(4)
    // A v6 (Fase 16) e a v7 (Fase 19) rodam em seguida, na mesma cadeia —
    // todos ganham `null` nos dois campos.
    expect(livros.every((l) => l.emblema === null)).toBe(true)
    expect(livros.every((l) => l.larguraLombada === null)).toBe(true)
  })
})

describe('migração para a v6', () => {
  // Quem já tinha livro antes da Fase 16 não tinha `emblema` gravado.
  it('dá `null` a cada livro que já existia', async () => {
    const nome = `palacio-migracao-v6-${String(nth)}`

    const antigo = new Dexie(nome)
    antigo.version(1).stores({
      livros: 'id, createdAt',
      neuronios: 'id, livroId, updatedAt',
      conexoes: 'id, aId, bId, updatedAt',
    })
    antigo.version(2).stores({ meta: 'chave' })
    antigo.version(3).stores({ livros: 'id, createdAt, ordem' })
    antigo.version(4).stores({ livros: 'id, createdAt, ordem, prateleira' })
    antigo.version(5).stores({ etiquetas: 'prateleira' })
    await antigo
      .table<Omit<Livro, 'emblema' | 'larguraLombada'>, string>('livros')
      .bulkPut([
        { id: 'l1', titulo: 'Psicologia', cor: '#7b6ae0', prateleira: 0, ordem: 0, createdAt: T0 },
      ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const [livro1] = await migrado.listLivros()

    expect(livro1?.emblema).toBeNull()
    expect(livro1?.larguraLombada).toBeNull()
    // A migração não mexeu em mais nada.
    expect(livro1).toMatchObject({ prateleira: 0, ordem: 0, titulo: 'Psicologia' })
  })

  it('livro novo, criado depois da v6, já nasce com o campo', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    const [livro1] = await repo.listLivros()
    expect(livro1?.emblema).toBeNull()
  })
})

describe('migração para a v7', () => {
  // Quem já tinha livro antes da Fase 19 não tinha `larguraLombada` gravada.
  it('dá `null` a cada livro que já existia', async () => {
    const nome = `palacio-migracao-v7-${String(nth)}`

    const antigo = new Dexie(nome)
    antigo.version(1).stores({
      livros: 'id, createdAt',
      neuronios: 'id, livroId, updatedAt',
      conexoes: 'id, aId, bId, updatedAt',
    })
    antigo.version(2).stores({ meta: 'chave' })
    antigo.version(3).stores({ livros: 'id, createdAt, ordem' })
    antigo.version(4).stores({ livros: 'id, createdAt, ordem, prateleira' })
    antigo.version(5).stores({ etiquetas: 'prateleira' })
    antigo.version(6).stores({})
    await antigo.table<Omit<Livro, 'larguraLombada'>, string>('livros').bulkPut([
      {
        id: 'l1',
        titulo: 'Psicologia',
        cor: '#7b6ae0',
        prateleira: 0,
        ordem: 0,
        emblema: null,
        createdAt: T0,
      },
    ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const [livro1] = await migrado.listLivros()

    expect(livro1?.larguraLombada).toBeNull()
    // A migração não mexeu em mais nada.
    expect(livro1).toMatchObject({ prateleira: 0, ordem: 0, titulo: 'Psicologia', emblema: null })
  })

  it('livro novo, criado depois da v7, já nasce com o campo', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    const [livro1] = await repo.listLivros()
    expect(livro1?.larguraLombada).toBeNull()
  })
})
