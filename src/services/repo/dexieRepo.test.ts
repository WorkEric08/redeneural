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

import {
  conexaoId,
  ehCorDaPaleta,
  LUGARES_POR_PRATELEIRA,
  type Conexao,
  type EnfeiteGravado,
  type Livro,
  type Neuronio,
  type PalacioRepo,
} from '@/core'
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
    tipo: 'conceitos',
    titulo,
    cor: '#3A2F6B',
    estilo: 'solido',
    prateleira,
    ordem,
    emblema: null,
    larguraLombada: null,
    comprimentoLombada: null,
    executavel: false,
    diasParaAdormecer: 30,
    createdAt: T0,
  }
}

function neuronio(
  id: string,
  livroId: string | null,
  embedding: Float32Array | null = null,
): Neuronio {
  return {
    id,
    livroId,
    titulo: `neurônio ${id}`,
    conteudo: 'conteúdo de teste',
    embedding,
    estado: null,
    ultimoToque: T0,
    resultadoLink: null,
    resultadoImagem: null,
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

  it('lista neurônios do mais recente para o mais antigo, não na ordem do uuid', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    // Fora de ordem de propósito, e com ids cuja ordem alfabética contraria a
    // cronológica: sem ordenação, a lista sairia na ordem da chave primária.
    await repo.upsertNeuronio({ ...neuronio('a', 'l1'), createdAt: new Date('2026-02-01') })
    await repo.upsertNeuronio({ ...neuronio('c', 'l1'), createdAt: new Date('2026-03-01') })
    await repo.upsertNeuronio({ ...neuronio('b', 'l1'), createdAt: new Date('2026-01-01') })

    expect((await repo.listNeuronios()).map((n) => n.id)).toEqual(['c', 'a', 'b'])
    expect((await repo.listNeuronios('l1')).map((n) => n.id)).toEqual(['c', 'a', 'b'])
  })

  it('editar não muda o lugar na lista — a ordem é de criação, não de alteração', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    const velho = { ...neuronio('a', 'l1'), createdAt: new Date('2026-01-01') }
    await repo.upsertNeuronio(velho)
    await repo.upsertNeuronio({ ...neuronio('b', 'l1'), createdAt: new Date('2026-02-01') })

    await repo.upsertNeuronio({ ...velho, titulo: 'corrigido', updatedAt: new Date('2026-03-01') })

    expect((await repo.listNeuronios()).map((n) => n.id)).toEqual(['b', 'a'])
  })

  it('dois neurônios do mesmo instante não trocam de lugar entre leituras', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    const mesmoInstante = new Date('2026-02-01')
    await repo.upsertNeuronio({ ...neuronio('z', 'l1'), createdAt: mesmoInstante })
    await repo.upsertNeuronio({ ...neuronio('y', 'l1'), createdAt: mesmoInstante })

    const primeira = (await repo.listNeuronios()).map((n) => n.id)
    expect(primeira).toEqual(['y', 'z'])
    expect((await repo.listNeuronios()).map((n) => n.id)).toEqual(primeira)
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

describe('porto', () => {
  it('guarda e lista um neurônio sem livro', async () => {
    await repo.upsertNeuronio(neuronio('n1', null))
    const [lido] = await repo.listNeuronios()
    expect(lido?.livroId).toBeNull()
  })

  it('apagar um livro não leva junto quem está no porto', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', null))

    await repo.deleteLivro('l1')
    expect((await repo.listNeuronios()).map((n) => n.id)).toEqual(['n2'])
  })

  it('o backup leva e traz o neurônio no porto, e ele não conta como órfão', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', null))
    const snapshot = await repo.exportAll()

    const outro = createDexieRepo(createDb(`palacio-test-porto-${String(nth)}`))
    await outro.importAll(JSON.parse(JSON.stringify(snapshot)) as typeof snapshot)
    expect((await outro.getNeuronio('n2'))?.livroId).toBeNull()
    expect((await outro.getNeuronio('n1'))?.livroId).toBe('l1')
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

  it('mover para um lugar com livro empurra a fila até o buraco, sem abrir vaga', async () => {
    for (const [i, id] of ['l1', 'l2', 'l3'].entries()) await repo.upsertLivro(livro(id, id, i))

    await repo.moverLivro('l3', 0, 0)

    expect((await repo.listLivros()).map((l) => [l.id, l.ordem])).toEqual([
      ['l3', 0],
      ['l1', 1],
      ['l2', 2],
    ])
    // A origem de l3 (lugar 2) foi ocupada pelo empurrão.
    expect(await repo.listVagas()).toEqual([])
  })

  it('mover para outra prateleira não faz ninguém andar, e a origem vira vaga', async () => {
    await repo.upsertLivro(livro('a', 'a', 0, 0))
    await repo.upsertLivro(livro('b', 'b', 1, 0))
    await repo.upsertLivro(livro('x', 'x', 0, 2))

    await repo.moverLivro('a', 5, 7)

    const porId = new Map((await repo.listLivros()).map((l) => [l.id, [l.prateleira, l.ordem]]))
    expect(porId.get('a')).toEqual([5, 7])
    expect(porId.get('b')).toEqual([0, 1]) // o buraco que 'a' deixou continua lá
    expect(porId.get('x')).toEqual([2, 0])
    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 0 }])
  })

  it('chegar num lugar aberto fecha a vaga dele', async () => {
    await repo.upsertLivro(livro('a', 'a', 0, 0))
    await repo.upsertLivro(livro('b', 'b', 4, 0))
    await repo.moverLivro('a', 0, 9) // abre o 0

    await repo.moverLivro('b', 0, 0)

    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 4 }])
  })

  it('recusa mover para uma prateleira cheia de livros, sem mexer em nada', async () => {
    for (let i = 0; i < LUGARES_POR_PRATELEIRA; i += 1) {
      await repo.upsertLivro(livro(`c${String(i)}`, 'c', i, 0))
    }
    await repo.upsertLivro(livro('n', 'n', 0, 1))

    await expect(repo.moverLivro('n', 0, 3)).rejects.toThrow(/prateleira 1/)
    expect((await repo.getLivro('n'))?.prateleira).toBe(1)
  })

  it('recusa mover livro que não existe', async () => {
    await expect(repo.moverLivro('fantasma', 0, 0)).rejects.toThrow(/fantasma/)
  })
})

describe('vagas', () => {
  it('apagar um livro deixa o lugar dele aberto', async () => {
    await repo.upsertLivro(livro('a', 'a', 3, 1))
    await repo.deleteLivro('a')
    expect(await repo.listVagas()).toEqual([{ prateleira: 1, ordem: 3 }])
  })

  it('gravar um livro num lugar aberto fecha a vaga', async () => {
    await repo.abrirVaga({ prateleira: 0, ordem: 2 })
    await repo.upsertLivro(livro('a', 'a', 2, 0))
    expect(await repo.listVagas()).toEqual([])
  })

  it('tirar e pôr o enfeite abre e fecha a vaga, sem duplicar', async () => {
    await repo.abrirVaga({ prateleira: 0, ordem: 5 })
    await repo.abrirVaga({ prateleira: 0, ordem: 5 })
    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 5 }])

    await repo.fecharVaga({ prateleira: 0, ordem: 5 })
    await repo.fecharVaga({ prateleira: 0, ordem: 5 })
    expect(await repo.listVagas()).toEqual([])
  })

  it('recusa abrir vaga embaixo de um livro', async () => {
    await repo.upsertLivro(livro('a', 'a', 1, 0))
    await expect(repo.abrirVaga({ prateleira: 0, ordem: 1 })).rejects.toThrow(/livro/)
    expect(await repo.listVagas()).toEqual([])
  })

  it('diminuir as prateleiras apaga as vagas das que deixaram de existir', async () => {
    await repo.definirQuantidadeDePrateleiras(6)
    await repo.abrirVaga({ prateleira: 1, ordem: 0 })
    await repo.abrirVaga({ prateleira: 5, ordem: 0 })

    await repo.definirQuantidadeDePrateleiras(4)

    expect(await repo.listVagas()).toEqual([{ prateleira: 1, ordem: 0 }])
  })

  it('limpar leva as vagas junto', async () => {
    await repo.abrirVaga({ prateleira: 0, ordem: 0 })
    await repo.clear()
    expect(await repo.listVagas()).toEqual([])
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

  it('recusa passar de 6 prateleiras', async () => {
    await expect(repo.definirQuantidadeDePrateleiras(7)).rejects.toThrow(/6/)
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

describe('intensidade da luz dos enfeites', () => {
  it('0 (a cor real) por padrão, quando nunca foi definida', async () => {
    expect(await repo.getIntensidadeDaLuzDoEnfeite()).toBe(0)
  })

  it('grava, recorta para 0-100 e devolve', async () => {
    await repo.definirIntensidadeDaLuzDoEnfeite(65)
    expect(await repo.getIntensidadeDaLuzDoEnfeite()).toBe(65)

    await repo.definirIntensidadeDaLuzDoEnfeite(250)
    expect(await repo.getIntensidadeDaLuzDoEnfeite()).toBe(100)
  })

  it('é independente da luz dos livros: mexer numa não apaga nem muda a outra', async () => {
    await repo.definirIntensidadeDaLuz(70)
    await repo.definirIntensidadeDaLuzDoEnfeite(20)
    expect(await repo.getIntensidadeDaLuz()).toBe(70)

    await repo.definirIntensidadeDaLuz(10)
    expect(await repo.getIntensidadeDaLuzDoEnfeite()).toBe(20)
  })
})

describe('modo da busca', () => {
  it('"sentido" por padrão, quando nunca foi escolhido', async () => {
    expect(await repo.getModoDaBusca()).toBe('sentido')
  })

  it('devolve o último que foi escolhido', async () => {
    await repo.definirModoDaBusca('exata')
    expect(await repo.getModoDaBusca()).toBe('exata')

    await repo.definirModoDaBusca('sentido')
    expect(await repo.getModoDaBusca()).toBe('sentido')
  })

  it('mexer nas prateleiras ou na luz não apaga o modo, e escolher o modo não apaga as duas', async () => {
    await repo.definirModoDaBusca('exata')
    await repo.definirQuantidadeDePrateleiras(6)
    await repo.definirIntensidadeDaLuz(70)
    expect(await repo.getModoDaBusca()).toBe('exata')

    await repo.definirModoDaBusca('sentido')
    expect(await repo.getQuantidadeDePrateleiras()).toBe(6)
    expect(await repo.getIntensidadeDaLuz()).toBe(70)
  })

  it('importar um backup que aumenta as prateleiras não apaga o modo', async () => {
    const origem = createDexieRepo(createDb(`palacio-test-modo-${String(nth)}`))
    await origem.upsertLivro(livro('l1', 'Psicologia', 0, 5))
    const snapshot = await origem.exportAll()

    await repo.definirModoDaBusca('exata')
    await repo.importAll(snapshot)

    expect(await repo.getQuantidadeDePrateleiras()).toBe(6)
    expect(await repo.getModoDaBusca()).toBe('exata')
  })
})

describe('modo da Rede', () => {
  it('"rede" por padrão, e devolve o último escolhido', async () => {
    expect(await repo.getModoDaRede()).toBe('rede')
    await repo.definirModoDaRede('mapa')
    expect(await repo.getModoDaRede()).toBe('mapa')
  })

  it('não apaga o modo da busca nem a luz, e eles não o apagam', async () => {
    await repo.definirModoDaRede('mapa')
    await repo.definirModoDaBusca('exata')
    await repo.definirIntensidadeDaLuz(30)
    expect(await repo.getModoDaRede()).toBe('mapa')
    expect(await repo.getModoDaBusca()).toBe('exata')
    expect(await repo.getIntensidadeDaLuz()).toBe(30)
  })
})

describe('mapa', () => {
  const ilha = (x: number) => ({ centro: { x, y: 0 }, raio: 80, pontos: { n1: { x: 3, y: -4 } } })

  it('vazio num palácio que nunca o desenhou, e devolve o que foi gravado', async () => {
    expect(await repo.getMapa()).toEqual({ ilhas: {} })
    await repo.setMapa({ ilhas: { l1: ilha(10) } })
    expect(await repo.getMapa()).toEqual({ ilhas: { l1: ilha(10) } })
  })

  it('vai no backup e volta com as ilhas do arquivo vencendo', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.setMapa({ ilhas: { l1: ilha(10) } })
    const snapshot = await repo.exportAll()
    expect(snapshot.mapa).toEqual({ ilhas: { l1: ilha(10) } })

    const outro = createDexieRepo(createDb(`palacio-test-mapa-${String(nth)}`))
    await outro.setMapa({ ilhas: { l1: ilha(-999), l2: ilha(5000) } })
    await outro.importAll(JSON.parse(JSON.stringify(snapshot)) as typeof snapshot)
    expect(await outro.getMapa()).toEqual({ ilhas: { l1: ilha(10), l2: ilha(5000) } })
  })

  it('backup de antes do mapa importa sem mexer no mapa daqui', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    const snapshot = await repo.exportAll()
    delete snapshot.mapa
    await repo.setMapa({ ilhas: { l1: ilha(7) } })
    await repo.importAll(snapshot)
    expect(await repo.getMapa()).toEqual({ ilhas: { l1: ilha(7) } })
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
      .table<
        Omit<
          Livro,
          | 'ordem'
          | 'prateleira'
          | 'emblema'
          | 'larguraLombada'
          | 'comprimentoLombada'
          | 'tipo'
          | 'estilo'
          | 'executavel'
          | 'diasParaAdormecer'
        >,
        string
      >('livros')
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
      .table<
        Omit<
          Livro,
          | 'prateleira'
          | 'emblema'
          | 'larguraLombada'
          | 'comprimentoLombada'
          | 'tipo'
          | 'estilo'
          | 'executavel'
          | 'diasParaAdormecer'
        >,
        string
      >('livros')
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
      .table<
        Omit<
          Livro,
          | 'emblema'
          | 'larguraLombada'
          | 'comprimentoLombada'
          | 'tipo'
          | 'estilo'
          | 'executavel'
          | 'diasParaAdormecer'
        >,
        string
      >('livros')
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
    await antigo
      .table<
        Omit<
          Livro,
          | 'larguraLombada'
          | 'comprimentoLombada'
          | 'tipo'
          | 'estilo'
          | 'executavel'
          | 'diasParaAdormecer'
        >,
        string
      >('livros')
      .bulkPut([
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

describe('migração para a v8', () => {
  // Quem já tinha livro antes de 14/09/2026 não tinha `comprimentoLombada` gravado.
  it('dá `null` a cada livro que já existia', async () => {
    const nome = `palacio-migracao-v8-${String(nth)}`

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
    antigo.version(7).stores({})
    await antigo
      .table<
        Omit<Livro, 'comprimentoLombada' | 'tipo' | 'estilo' | 'executavel' | 'diasParaAdormecer'>,
        string
      >('livros')
      .bulkPut([
        {
          id: 'l1',
          titulo: 'Psicologia',
          cor: '#7b6ae0',
          prateleira: 0,
          ordem: 0,
          emblema: null,
          larguraLombada: null,
          createdAt: T0,
        },
      ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const [livro1] = await migrado.listLivros()

    expect(livro1?.comprimentoLombada).toBeNull()
    // A migração não mexeu em mais nada.
    expect(livro1).toMatchObject({ prateleira: 0, ordem: 0, titulo: 'Psicologia', emblema: null })
  })

  it('livro novo, criado depois da v8, já nasce com o campo', async () => {
    await repo.upsertLivro(livro('l1', 'Psicologia'))
    const [livro1] = await repo.listLivros()
    expect(livro1?.comprimentoLombada).toBeNull()
  })
})

describe('migração para a v9', () => {
  // Os lugares fixos não mudaram nenhum livro: `ordem` denso já é um lugar
  // válido, e sem vaga gravada todo lugar sem livro continua mostrando enfeite.
  it('ninguém muda de lugar, e nenhuma vaga nasce aberta', async () => {
    const nome = `palacio-migracao-v9-${String(nth)}`

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
    antigo.version(7).stores({})
    antigo.version(8).stores({})
    await antigo
      .table<Livro, string>('livros')
      .bulkPut([livro('l1', 'Psicologia', 0, 0), livro('l2', 'Música', 1, 0)])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))

    expect((await migrado.listLivros()).map((l) => [l.id, l.prateleira, l.ordem])).toEqual([
      ['l1', 0, 0],
      ['l2', 0, 1],
    ])
    expect(await migrado.listVagas()).toEqual([])
  })
})

describe('migração para a v11', () => {
  // Antes de 01/10/2026 não havia livro executável nem estado de ideia.
  it('todo livro fica de pensamentos, e toda ideia sem estado e com o toque na última edição', async () => {
    const nome = `palacio-migracao-v11-${String(nth)}`
    const editadoEm = new Date('2026-09-20T08:00:00.000Z')

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
    antigo.version(7).stores({})
    antigo.version(8).stores({})
    antigo.version(9).stores({ vagas: '[prateleira+ordem], prateleira' })
    antigo.version(10).stores({
      anexos: 'id, livroId, updatedAt',
      arquivos: 'anexoId',
      vinculos: 'id, anexoId, conceitoId',
    })
    const l = livro('l1', 'Psicologia')
    const n = neuronio('n1', 'l1')
    await antigo.table('livros').bulkPut([
      {
        id: l.id,
        tipo: l.tipo,
        titulo: l.titulo,
        cor: l.cor,
        prateleira: l.prateleira,
        ordem: l.ordem,
        emblema: l.emblema,
        larguraLombada: l.larguraLombada,
        comprimentoLombada: l.comprimentoLombada,
        createdAt: l.createdAt,
      },
    ])
    await antigo.table('neuronios').bulkPut([
      {
        id: n.id,
        livroId: n.livroId,
        titulo: n.titulo,
        conteudo: n.conteudo,
        embedding: n.embedding,
        createdAt: n.createdAt,
        updatedAt: editadoEm,
      },
    ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    expect(await migrado.getLivro('l1')).toMatchObject({ executavel: false, diasParaAdormecer: 30 })
    expect(await migrado.getNeuronio('n1')).toMatchObject({
      estado: null,
      ultimoToque: editadoEm,
      resultadoLink: null,
      resultadoImagem: null,
    })
  })
})

describe('livros executáveis', () => {
  it('uma pasta de acervo não pode ser executável', async () => {
    await expect(
      repo.upsertLivro({ ...livro('p1', 'Vídeos'), tipo: 'acervo', executavel: true }),
    ).rejects.toThrow()
  })

  it('o estado e o link do resultado são gravados, e o link só aceita http e https', async () => {
    await repo.upsertLivro({ ...livro('l1', 'Ideias'), executavel: true })
    await expect(
      repo.upsertNeuronio({
        ...neuronio('n1', 'l1'),
        estado: 'feita',
        resultadoLink: 'javascript:alert(1)',
        resultadoImagem: null,
      }),
    ).rejects.toThrow()

    await repo.upsertNeuronio({
      ...neuronio('n1', 'l1'),
      estado: 'feita',
      resultadoLink: 'https://exemplo.com/texto',
      resultadoImagem: null,
    })
    expect(await repo.getNeuronio('n1')).toMatchObject({
      estado: 'feita',
      resultadoLink: 'https://exemplo.com/texto',
      resultadoImagem: null,
    })
  })
})

describe('migração para a v12', () => {
  // Antes de 06/10/2026 a cor era um hex livre e não havia forma de lombada.
  it('todo livro ganha a forma sólido e a cor vai ao tom mais próximo da paleta', async () => {
    const nome = `palacio-migracao-v12-${String(nth)}`

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
    antigo.version(7).stores({})
    antigo.version(8).stores({})
    antigo.version(9).stores({ vagas: '[prateleira+ordem], prateleira' })
    antigo.version(10).stores({
      anexos: 'id, livroId, updatedAt',
      arquivos: 'anexoId',
      vinculos: 'id, anexoId, conceitoId',
    })
    antigo.version(11).stores({})
    const base = {
      tipo: 'conceitos',
      prateleira: 0,
      emblema: null,
      larguraLombada: 34,
      comprimentoLombada: null,
      executavel: false,
      diasParaAdormecer: 30,
      createdAt: T0,
    }
    await antigo.table('livros').bulkPut([
      { ...base, id: 'a', titulo: 'Roxo', cor: '#7b6ae0', ordem: 0 },
      { ...base, id: 'b', titulo: 'Quase creme', cor: '#efece3', ordem: 1 },
      { ...base, id: 'c', titulo: 'Já da paleta', cor: '#12204f', ordem: 2 },
    ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const livros = await migrado.listLivros()

    for (const l of livros) {
      expect(l.estilo).toBe('solido')
      expect(ehCorDaPaleta(l.cor)).toBe(true)
    }
    expect(livros.find((l) => l.id === 'a')?.cor).toBe('#2A3A8A')
    expect(livros.find((l) => l.id === 'b')?.cor).toBe('#F1EEE6')
    expect(livros.find((l) => l.id === 'c')?.cor).toBe('#12204F')
    // A migração não mexeu em mais nada.
    expect(livros.find((l) => l.id === 'a')).toMatchObject({ larguraLombada: 34, titulo: 'Roxo' })
  })
})

describe('cor e forma da lombada', () => {
  it('grava e devolve a forma escolhida', async () => {
    await repo.upsertLivro({ ...livro('l1', 'Psicologia'), estilo: 'papel', cor: '#F1EEE6' })
    expect(await repo.getLivro('l1')).toMatchObject({ estilo: 'papel', cor: '#F1EEE6' })
  })

  it('recusa uma cor fora da paleta Noite', async () => {
    await expect(
      repo.upsertLivro({ ...livro('l1', 'Psicologia'), cor: '#7b6ae0' }),
    ).rejects.toThrow()
  })

  it('aceita o tom da paleta em hex minúsculo', async () => {
    await repo.upsertLivro({ ...livro('l1', 'Psicologia'), cor: '#1b2a6b' })
    expect((await repo.getLivro('l1'))?.cor).toBe('#1b2a6b')
  })

  it('recusa uma forma que não existe', async () => {
    await expect(
      repo.upsertLivro({ ...livro('l1', 'Psicologia'), estilo: 'espiral' as never }),
    ).rejects.toThrow()
  })
})

describe('enfeites gravados', () => {
  const enfeite = (ordem: number, prateleira = 0): EnfeiteGravado => ({
    prateleira,
    ordem,
    cor: '#4A2540',
    estilo: 'contorno',
    larguraLombada: 52,
    comprimentoLombada: 90,
    dourado: true,
    detalheEscuro: false,
  })

  const dadosDe = (e: EnfeiteGravado) => ({
    cor: e.cor,
    estilo: e.estilo,
    larguraLombada: e.larguraLombada,
    comprimentoLombada: e.comprimentoLombada,
    dourado: e.dourado,
    detalheEscuro: e.detalheEscuro,
  })

  it('grava o enfeite, regravar o mesmo lugar não duplica, e fecha a vaga dele', async () => {
    await repo.abrirVaga({ prateleira: 0, ordem: 5 })
    await repo.salvarEnfeite(enfeite(5))
    await repo.salvarEnfeite({ ...enfeite(5), cor: '#17505A' })

    expect(await repo.listEnfeites()).toEqual([{ ...enfeite(5), cor: '#17505A' }])
    expect(await repo.listVagas()).toEqual([])
  })

  it('recusa uma cor fora da paleta, uma medida absurda e um lugar com livro', async () => {
    await expect(repo.salvarEnfeite({ ...enfeite(5), cor: '#ff0000' })).rejects.toThrow()
    await expect(repo.salvarEnfeite({ ...enfeite(5), larguraLombada: 400 })).rejects.toThrow()
    await repo.upsertLivro(livro('a', 'a', 2, 0))
    await expect(repo.salvarEnfeite(enfeite(2))).rejects.toThrow(/livro/)
    expect(await repo.listEnfeites()).toEqual([])
  })

  it('um livro gravado no lugar tira o enfeite que estava ali', async () => {
    await repo.salvarEnfeite(enfeite(2))
    await repo.upsertLivro(livro('a', 'a', 2, 0))
    expect(await repo.listEnfeites()).toEqual([])
  })

  it('tirar o enfeite apaga o gravado e deixa a vaga', async () => {
    await repo.salvarEnfeite(enfeite(4))
    await repo.abrirVaga({ prateleira: 0, ordem: 4 })
    expect(await repo.listEnfeites()).toEqual([])
    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 4 }])
  })

  it('mover um livro para cima de um enfeite gravado o apaga', async () => {
    await repo.upsertLivro(livro('a', 'a', 0, 0))
    await repo.salvarEnfeite(enfeite(7))
    await repo.moverLivro('a', 0, 7)
    expect(await repo.listEnfeites()).toEqual([])
  })

  it('mover o enfeite: ele chega com a mesma cara e o lugar de origem vira vaga', async () => {
    await repo.salvarEnfeite(enfeite(5))
    const { prateleira, ordem, ...dados } = enfeite(5)
    expect([prateleira, ordem]).toEqual([0, 5])

    await repo.moverEnfeite({ prateleira: 0, ordem: 5 }, { prateleira: 1, ordem: 2 }, dados)

    expect(await repo.listEnfeites()).toEqual([enfeite(2, 1)])
    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 5 }])
  })

  it('mover o enfeite sorteado (sem registro) o grava no destino', async () => {
    const dados = dadosDe(enfeite(0))
    await repo.moverEnfeite({ prateleira: 0, ordem: 3 }, { prateleira: 0, ordem: 8 }, dados)

    expect(await repo.listEnfeites()).toEqual([enfeite(8)])
    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 3 }])
  })

  it('mover o enfeite sobre um livro empurra a fila, como entre livros', async () => {
    await repo.upsertLivro(livro('a', 'a', 3, 0))
    await repo.upsertLivro(livro('b', 'b', 4, 0))
    const dados = dadosDe(enfeite(0))

    await repo.moverEnfeite({ prateleira: 0, ordem: 9 }, { prateleira: 0, ordem: 3 }, dados)

    expect((await repo.getLivro('a'))?.ordem).toBe(4)
    expect((await repo.getLivro('b'))?.ordem).toBe(5)
    expect(await repo.listEnfeites()).toEqual([enfeite(3)])
  })

  it('numa prateleira cheia de livros recusa, e nada muda', async () => {
    for (let i = 0; i < LUGARES_POR_PRATELEIRA; i += 1) {
      await repo.upsertLivro(livro(`x${String(i)}`, 'x', i, 1))
    }
    const dados = dadosDe(enfeite(0))

    await expect(
      repo.moverEnfeite({ prateleira: 0, ordem: 3 }, { prateleira: 1, ordem: 4 }, dados),
    ).rejects.toThrow(/lugar sem livro/)
    expect(await repo.listEnfeites()).toEqual([])
    expect(await repo.listVagas()).toEqual([])
  })

  it('diminuir as prateleiras apaga os enfeites das que deixaram de existir', async () => {
    await repo.definirQuantidadeDePrateleiras(6)
    await repo.salvarEnfeite(enfeite(0, 1))
    await repo.salvarEnfeite(enfeite(0, 5))

    await repo.definirQuantidadeDePrateleiras(4)

    expect(await repo.listEnfeites()).toEqual([enfeite(0, 1)])
  })

  it('o backup leva os enfeites e a cor livre do arquivo vai ao tom mais perto', async () => {
    await repo.salvarEnfeite(enfeite(5))
    const snapshot = await repo.exportAll()
    expect(snapshot.enfeites).toEqual([enfeite(5)])

    await repo.clear()
    await repo.importAll({
      ...snapshot,
      enfeites: [{ ...enfeite(6), cor: '#4b2641' }],
    })
    expect(await repo.listEnfeites()).toEqual([enfeite(6)])
  })

  it('importar não deixa enfeite embaixo de um livro, e backup de antes não traz enfeites', async () => {
    await repo.upsertLivro(livro('a', 'a', 2, 0))
    const snapshot = await repo.exportAll()
    const semEnfeites = { ...snapshot, enfeites: undefined }

    await repo.importAll({ ...semEnfeites, enfeites: [enfeite(2)] })
    expect(await repo.listEnfeites()).toEqual([])

    await repo.importAll(semEnfeites)
    expect(await repo.listEnfeites()).toEqual([])
  })

  it('limpar leva os enfeites junto', async () => {
    await repo.salvarEnfeite(enfeite(0))
    await repo.clear()
    expect(await repo.listEnfeites()).toEqual([])
  })
})

describe('a imagem do resultado de uma ideia', () => {
  const imagem = { mime: 'image/webp', largura: 40, altura: 20 }
  const bytes = { imagem: new Uint8Array([1, 2, 3]), miniatura: new Uint8Array([4, 5]) }
  const feita = (id = 'n1', livroId = 'l1'): Neuronio => ({
    ...neuronio(id, livroId),
    estado: 'feita',
    resultadoImagem: imagem,
  })

  beforeEach(async () => {
    await repo.upsertLivro({ ...livro('l1', 'Ideias'), executavel: true })
  })

  it('grava a imagem com o neurônio, e os bytes saem à parte da lista de neurônios', async () => {
    await repo.upsertNeuronio(feita(), bytes)

    expect((await repo.getNeuronio('n1'))?.resultadoImagem).toEqual(imagem)
    expect(await repo.getResultado('n1')).toEqual(bytes)
    // Listar neurônios nunca arrasta os bytes.
    expect(JSON.stringify(Object.keys((await repo.listNeuronios())[0] ?? {}))).not.toMatch(
      /miniatura/,
    )
  })

  it('regravar o neurônio sem os bytes mantém a imagem; com bytes novos, troca', async () => {
    await repo.upsertNeuronio(feita(), bytes)
    await repo.upsertNeuronio({ ...feita(), titulo: 'outro título' })
    expect(await repo.getResultado('n1')).toEqual(bytes)

    const nova = { imagem: new Uint8Array([9, 9]), miniatura: new Uint8Array([8]) }
    await repo.upsertNeuronio({ ...feita(), resultadoImagem: { ...imagem, largura: 20 } }, nova)
    expect(await repo.getResultado('n1')).toEqual(nova)
    expect((await repo.getNeuronio('n1'))?.resultadoImagem?.largura).toBe(20)
  })

  it('gravar com resultadoImagem null apaga os bytes', async () => {
    await repo.upsertNeuronio(feita(), bytes)
    await repo.upsertNeuronio({ ...feita(), resultadoImagem: null })

    expect(await repo.getResultado('n1')).toBeUndefined()
    expect((await repo.getNeuronio('n1'))?.resultadoImagem).toBeNull()
  })

  it('recusa um tipo de arquivo que não é imagem e bytes vazios', async () => {
    await expect(
      repo.upsertNeuronio({ ...feita(), resultadoImagem: { ...imagem, mime: 'text/html' } }, bytes),
    ).rejects.toThrow()
    await expect(
      repo.upsertNeuronio(feita(), { imagem: new Uint8Array(), miniatura: new Uint8Array([1]) }),
    ).rejects.toThrow()
    expect(await repo.getResultado('n1')).toBeUndefined()
  })

  it('apagar o neurônio apaga a imagem, e apagar o livro apaga a de todas as ideias dele', async () => {
    await repo.upsertNeuronio(feita('n1'), bytes)
    await repo.deleteNeuronio('n1')
    expect(await repo.getResultado('n1')).toBeUndefined()

    await repo.upsertNeuronio(feita('n2'), bytes)
    await repo.upsertNeuronio(feita('n3'), bytes)
    await repo.deleteLivro('l1')
    expect(await repo.getResultado('n2')).toBeUndefined()
    expect(await repo.getResultado('n3')).toBeUndefined()
  })

  it('o backup leva a imagem, e restaurar a devolve com os mesmos bytes', async () => {
    await repo.upsertNeuronio(feita(), bytes)
    const snapshot = await repo.exportAll()
    expect(snapshot.neuronios[0]?.resultadoImagem).toEqual(imagem)
    expect(snapshot.neuronios[0]?.resultadoArquivo).toBeDefined()

    await repo.clear()
    expect(await repo.getResultado('n1')).toBeUndefined()
    await repo.importAll(snapshot)

    expect((await repo.getNeuronio('n1'))?.resultadoImagem).toEqual(imagem)
    expect(await repo.getResultado('n1')).toEqual(bytes)
  })

  it('backup sem os bytes não deixa a ideia apontando para uma imagem que não existe', async () => {
    await repo.upsertNeuronio(feita(), bytes)
    const snapshot = await repo.exportAll()
    const semBytes = {
      ...snapshot,
      neuronios: snapshot.neuronios.map((n) => ({ ...n, resultadoArquivo: undefined })),
    }

    await repo.clear()
    await repo.importAll(semBytes)
    expect((await repo.getNeuronio('n1'))?.resultadoImagem).toBeNull()
    expect(await repo.getResultado('n1')).toBeUndefined()
  })

  it('backup de antes da imagem importa igual, sem imagem', async () => {
    await repo.upsertNeuronio(neuronio('n9', 'l1'))
    const snapshot = await repo.exportAll()
    const antigo = {
      ...snapshot,
      neuronios: snapshot.neuronios.map((n) => ({
        ...n,
        resultadoImagem: undefined,
        resultadoArquivo: undefined,
      })),
    }

    await repo.clear()
    await repo.importAll(antigo)
    expect((await repo.getNeuronio('n9'))?.resultadoImagem).toBeNull()
  })

  it('limpar leva as imagens junto', async () => {
    await repo.upsertNeuronio(feita(), bytes)
    await repo.clear()
    expect(await repo.getResultado('n1')).toBeUndefined()
  })
})

describe('migração para a v14', () => {
  // Antes de 07/10/2026 uma ideia feita não guardava imagem.
  it('toda ideia que já existia fica sem imagem, e o resto não muda', async () => {
    const nome = `palacio-migracao-v14-${String(nth)}`

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
    antigo.version(7).stores({})
    antigo.version(8).stores({})
    antigo.version(9).stores({ vagas: '[prateleira+ordem], prateleira' })
    antigo.version(10).stores({
      anexos: 'id, livroId, updatedAt',
      arquivos: 'anexoId',
      vinculos: 'id, anexoId, conceitoId',
    })
    antigo.version(11).stores({})
    antigo.version(12).stores({})
    antigo.version(13).stores({ enfeites: '[prateleira+ordem], prateleira' })
    await antigo.table('neuronios').bulkPut([
      {
        id: 'n1',
        livroId: 'l1',
        titulo: 'Uma ideia feita',
        conteudo: 'texto',
        embedding: null,
        estado: 'feita',
        ultimoToque: T0,
        resultadoLink: 'https://exemplo.com/r',
        createdAt: T0,
        updatedAt: T0,
      },
    ])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const n = await migrado.getNeuronio('n1')

    expect(n?.resultadoImagem).toBeNull()
    expect(n).toMatchObject({ estado: 'feita', resultadoLink: 'https://exemplo.com/r' })
    expect(await migrado.getResultado('n1')).toBeUndefined()
  })
})
