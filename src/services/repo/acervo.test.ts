/**
 * @vitest-environment node
 *
 * Em jsdom o fake-indexeddb devolve tipos de outro realm e o `instanceof` falha
 * por motivo de ambiente, não de código — ver `dexieRepo.test.ts`.
 */
import 'fake-indexeddb/auto'

import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  conexaoId,
  type Anexo,
  type Conexao,
  type Livro,
  type Neuronio,
  type PalacioRepo,
  type Vinculo,
} from '@/core'
import { createDb } from '@/services/db'

import { createDexieRepo } from './dexieRepo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

let repo: PalacioRepo
let nth = 0

beforeEach(() => {
  nth += 1
  repo = createDexieRepo(createDb(`palacio-acervo-${String(nth)}`))
})

function livro(id: string, ordem = 0, tipo: Livro['tipo'] = 'conceitos'): Livro {
  return {
    id,
    tipo,
    titulo: `livro ${id}`,
    cor: '#6d5bd0',
    prateleira: 0,
    ordem,
    emblema: null,
    larguraLombada: null,
    comprimentoLombada: null,
    createdAt: T0,
  }
}

function neuronio(id: string, livroId: string): Neuronio {
  return {
    id,
    livroId,
    titulo: `neurônio ${id}`,
    conteudo: '',
    embedding: null,
    createdAt: T0,
    updatedAt: T0,
  }
}

function conexao(x: string, y: string): Conexao {
  const [aId, bId] = x < y ? [x, y] : [y, x]
  return {
    id: conexaoId(x, y),
    aId,
    bId,
    score: 0.8,
    emb: 0.8,
    rr: null,
    cross: false,
    mantidaPorA: true,
    mantidaPorB: true,
    updatedAt: T0,
  }
}

function anexo(id: string, livroId: string, criadoEm = T0): Anexo {
  return {
    id,
    livroId,
    legenda: `sobre ${id}`,
    midia: { tipo: 'link', url: `https://exemplo.com/${id}` },
    embedding: null,
    createdAt: criadoEm,
    updatedAt: criadoEm,
  }
}

function imagem(id: string, livroId: string): Anexo {
  return {
    ...anexo(id, livroId),
    midia: { tipo: 'imagem', mime: 'image/webp', largura: 4, altura: 3 },
  }
}

const BYTES = { imagem: new Uint8Array([1, 2, 3]), miniatura: new Uint8Array([4]) }

function vinculo(anexoId: string, conceitoId: string, score = 0.7, ordem = 0): Vinculo {
  return { id: `${anexoId}::${conceitoId}`, anexoId, conceitoId, score, ordem, updatedAt: T0 }
}

/** Um livro como era gravado antes das pastas de acervo — sem `tipo`. */
function semTipo<T extends { tipo?: unknown }>(l: T): Omit<T, 'tipo'> {
  const copia = { ...l }
  Reflect.deleteProperty(copia, 'tipo')
  return copia
}

describe('acervo no repositório', () => {
  beforeEach(async () => {
    await repo.upsertLivro(livro('l1'))
    await repo.upsertLivro(livro('p1', 5, 'acervo'))
    await repo.upsertNeuronio(neuronio('n1', 'l1'))
    await repo.upsertNeuronio(neuronio('n2', 'l1'))
  })

  it('grava o tipo do livro, e o tipo volta igual', async () => {
    expect((await repo.getLivro('p1'))?.tipo).toBe('acervo')
    expect((await repo.getLivro('l1'))?.tipo).toBe('conceitos')
  })

  it('lista os anexos do mais recente para o mais antigo, e filtra por pasta', async () => {
    await repo.upsertLivro(livro('p2', 6, 'acervo'))
    await repo.upsertAnexo(anexo('a-velho', 'p1', new Date('2026-01-01')))
    await repo.upsertAnexo(anexo('a-novo', 'p1', new Date('2026-03-01')))
    await repo.upsertAnexo(anexo('a-outra', 'p2'))

    expect((await repo.listAnexos('p1')).map((a) => a.id)).toEqual(['a-novo', 'a-velho'])
    expect(await repo.listAnexos()).toHaveLength(3)
  })

  it('a imagem mora à parte: gravar o anexo de novo sem ela não a apaga', async () => {
    await repo.upsertAnexo(imagem('a1', 'p1'), BYTES)
    await repo.upsertAnexo({ ...imagem('a1', 'p1'), legenda: 'outra legenda' })

    const arquivo = await repo.getArquivo('a1')
    expect(arquivo?.imagem).toBeInstanceOf(Uint8Array)
    expect([...(arquivo?.imagem ?? [])]).toEqual([1, 2, 3])
    expect([...(arquivo?.miniatura ?? [])]).toEqual([4])
    expect((await repo.getAnexo('a1'))?.legenda).toBe('outra legenda')
  })

  it('recusa link que não é http nem https', async () => {
    const perigoso: Anexo = {
      ...anexo('a1', 'p1'),
      midia: { tipo: 'link', url: 'javascript:alert(1)' },
    }
    await expect(repo.upsertAnexo(perigoso)).rejects.toThrow()
    expect(await repo.getAnexo('a1')).toBeUndefined()
  })

  it('apagar o anexo leva a imagem e os vínculos dele', async () => {
    await repo.upsertAnexo(imagem('a1', 'p1'), BYTES)
    await repo.upsertAnexo(anexo('a2', 'p1'))
    await repo.replaceTodosVinculos([vinculo('a1', 'n1'), vinculo('a2', 'n1')])

    await repo.deleteAnexo('a1')

    expect(await repo.getAnexo('a1')).toBeUndefined()
    expect(await repo.getArquivo('a1')).toBeUndefined()
    expect((await repo.listVinculos()).map((v) => v.id)).toEqual(['a2::n1'])
  })

  it('apagar a pasta leva anexos, imagens e vínculos — e nenhuma conexão entre conceitos', async () => {
    await repo.upsertAnexo(imagem('a1', 'p1'), BYTES)
    await repo.replaceTodosVinculos([vinculo('a1', 'n1')])
    await repo.replaceTodasConexoes([conexao('n1', 'n2')])

    await repo.deleteLivro('p1')

    expect(await repo.listAnexos()).toEqual([])
    expect(await repo.getArquivo('a1')).toBeUndefined()
    expect(await repo.listVinculos()).toEqual([])
    expect(await repo.listConexoes()).toHaveLength(1)
    // O lugar da pasta vira vaga, como o de qualquer livro.
    expect(await repo.listVagas()).toEqual([{ prateleira: 0, ordem: 5 }])
  })

  it('apagar um conceito solta os anexos presos a ele, e só a ele', async () => {
    await repo.upsertAnexo(anexo('a1', 'p1'))
    await repo.replaceTodosVinculos([vinculo('a1', 'n1'), vinculo('a1', 'n2')])

    await repo.deleteNeuronio('n1')

    expect((await repo.listVinculos()).map((v) => v.id)).toEqual(['a1::n2'])
  })

  it('apagar um livro de conceitos solta os anexos presos aos neurônios dele', async () => {
    await repo.upsertAnexo(anexo('a1', 'p1'))
    await repo.replaceTodosVinculos([vinculo('a1', 'n1')])

    await repo.deleteLivro('l1')

    expect(await repo.listVinculos()).toEqual([])
    expect(await repo.getAnexo('a1')).toBeDefined()
  })

  it('replaceVinculosDe troca só os daquele anexo', async () => {
    await repo.upsertAnexo(anexo('a1', 'p1'))
    await repo.upsertAnexo(anexo('a2', 'p1'))
    await repo.replaceTodosVinculos([vinculo('a1', 'n1'), vinculo('a2', 'n1')])

    await repo.replaceVinculosDe('a1', [vinculo('a1', 'n2')])

    expect((await repo.listVinculos()).map((v) => v.id).sort()).toEqual(['a1::n2', 'a2::n1'])
  })

  it('recusa vínculo de outro anexo, e vínculo com o id fora do formato', async () => {
    await expect(repo.replaceVinculosDe('a1', [vinculo('a2', 'n1')])).rejects.toThrow()
    await expect(
      repo.replaceTodosVinculos([{ ...vinculo('a1', 'n1'), id: 'n1::a1' }]),
    ).rejects.toThrow()
  })

  it('limpar leva o acervo junto', async () => {
    await repo.upsertAnexo(imagem('a1', 'p1'), BYTES)
    await repo.replaceTodosVinculos([vinculo('a1', 'n1')])

    await repo.clear()

    expect(await repo.listAnexos()).toEqual([])
    expect(await repo.getArquivo('a1')).toBeUndefined()
    expect(await repo.listVinculos()).toEqual([])
  })

  it('o backup leva os anexos com a imagem, e não duplica ao importar de novo', async () => {
    await repo.upsertAnexo(imagem('a1', 'p1'), BYTES)
    await repo.upsertAnexo({ ...anexo('a2', 'p1'), embedding: new Float32Array([0.5, -0.25]) })
    await repo.replaceTodosVinculos([vinculo('a1', 'n1')])

    const snapshot = await repo.exportAll()
    // Os vínculos não vão no arquivo: são recalculados na chegada.
    expect(JSON.stringify(snapshot)).not.toContain('a1::n1')

    const destino = createDexieRepo(createDb(`palacio-acervo-destino-${String(nth)}`))
    await destino.importAll(snapshot)
    await destino.importAll(snapshot)

    expect((await destino.listAnexos()).map((a) => a.id).sort()).toEqual(['a1', 'a2'])
    expect([...((await destino.getArquivo('a1'))?.imagem ?? [])]).toEqual([1, 2, 3])
    expect((await destino.getAnexo('a2'))?.embedding).toEqual(new Float32Array([0.5, -0.25]))
    expect((await destino.getLivro('p1'))?.tipo).toBe('acervo')
    expect(await destino.listVinculos()).toEqual([])
  })

  it('backup de antes das pastas entra com todo livro de conceitos e nenhum anexo', async () => {
    const snapshot = await repo.exportAll()
    const antigo = {
      ...snapshot,
      livros: snapshot.livros.map(semTipo),
      anexos: undefined,
    }

    const destino = createDexieRepo(createDb(`palacio-acervo-antigo-${String(nth)}`))
    await destino.importAll(antigo)

    expect((await destino.listLivros()).every((l) => l.tipo === 'conceitos')).toBe(true)
    expect(await destino.listAnexos()).toEqual([])
  })

  it('recusa backup com anexo apontando para livro que não veio', async () => {
    await repo.upsertAnexo(anexo('a1', 'p1'))
    const snapshot = await repo.exportAll()
    const quebrado = { ...snapshot, livros: snapshot.livros.filter((l) => l.id !== 'p1') }

    const destino = createDexieRepo(createDb(`palacio-acervo-quebrado-${String(nth)}`))
    await expect(destino.importAll(quebrado)).rejects.toThrow(/anexo a1/)
  })
})

describe('migração para a v10', () => {
  // Antes das pastas de acervo todo livro era de conceitos.
  it('todo livro que já existia vira livro de conceitos, e nada mais muda', async () => {
    const nome = `palacio-migracao-v10-${String(nth)}`

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
    const antes = semTipo({ ...livro('l1', 3), prateleira: 1 })
    await antigo.table<Omit<Livro, 'tipo'>, string>('livros').bulkPut([antes])
    antigo.close()

    const migrado = createDexieRepo(createDb(nome))
    const [livro1] = await migrado.listLivros()

    expect(livro1).toMatchObject({ tipo: 'conceitos', prateleira: 1, ordem: 3, titulo: 'livro l1' })
    expect(await migrado.listAnexos()).toEqual([])
    expect(await migrado.listVinculos()).toEqual([])
  })
})
