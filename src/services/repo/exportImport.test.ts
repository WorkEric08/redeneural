/**
 * @vitest-environment node
 *
 * Em jsdom o fake-indexeddb devolve tipos de outro realm e o `instanceof` falha
 * por motivo de ambiente, não de código — ver `dexieRepo.test.ts`.
 */
import 'fake-indexeddb/auto'

import { describe, expect, it } from 'vitest'

import {
  arestaParaConexao,
  construirGrafo,
  perfilDoPalacio,
  SEM_RERANK,
  type Conexao,
  type Livro,
  type Neuronio,
  type PalacioRepo,
} from '@/core'
import { PALACIO } from '@/core/motor/fixtures'
import { createDb } from '@/services/db'

import { createDexieRepo } from './dexieRepo'

const T0 = new Date('2026-01-01T12:00:00.000Z')

const LIVROS: Livro[] = [
  { id: 'psi', titulo: 'Psicologia', cor: '#6d5bd0', prateleira: 0, ordem: 0, createdAt: T0 },
  { id: 'prog', titulo: 'Programação', cor: '#2f7a6f', prateleira: 0, ordem: 1, createdAt: T0 },
  { id: 'mus', titulo: 'Música', cor: '#b4553a', prateleira: 0, ordem: 2, createdAt: T0 },
]

/** Os nós do motor viram neurônios de verdade, com vetor e tudo. */
const NEURONIOS: Neuronio[] = PALACIO.map((n) => ({
  id: n.id,
  livroId: n.livroId,
  titulo: n.texto,
  conteudo: `conteúdo de ${n.texto}`,
  embedding: n.embedding,
  createdAt: T0,
  updatedAt: T0,
}))

let nth = 0

/** O mesmo que o Worker faz em `reprocessarTudo`, sem Worker. */
async function reprocessar(repo: PalacioRepo): Promise<Conexao[]> {
  const neuronios = await repo.listNeuronios()
  const nos = neuronios
    .filter((n) => n.embedding !== null)
    .map((n) => ({
      id: n.id,
      livroId: n.livroId,
      texto: n.titulo,
      embedding: n.embedding!,
    }))

  const perfil = perfilDoPalacio(nos)
  const arestas = await construirGrafo(nos, SEM_RERANK, undefined, perfil)

  await repo.replaceTodasConexoes(arestas.map((a) => arestaParaConexao(a, T0)))
  await repo.setPerfil(perfil, nos.length)

  return repo.listConexoes()
}

async function palacioPovoado(): Promise<PalacioRepo> {
  nth += 1
  const repo = createDexieRepo(createDb(`palacio-export-${nth}`))

  for (const l of LIVROS) await repo.upsertLivro(l)
  for (const n of NEURONIOS) await repo.upsertNeuronio(n)
  await reprocessar(repo)

  return repo
}

function repoVazio(): PalacioRepo {
  nth += 1
  return createDexieRepo(createDb(`palacio-export-${nth}`))
}

function ordenar<T extends { id: string }>(xs: T[]): T[] {
  return [...xs].sort((a, b) => (a.id < b.id ? -1 : 1))
}

describe('exportar num navegador e importar noutro', () => {
  it('não perde livro, neurônio, vetor nem conexão', async () => {
    const origem = await palacioPovoado()
    const snapshot = await origem.exportAll()

    // A travessia real: o arquivo é texto, não objeto.
    const destino = repoVazio()
    await destino.importAll(JSON.parse(JSON.stringify(snapshot)) as typeof snapshot)

    expect(ordenar(await destino.listLivros())).toEqual(ordenar(await origem.listLivros()))

    const de = ordenar(await origem.listNeuronios())
    const para = ordenar(await destino.listNeuronios())
    expect(para.map((n) => n.titulo)).toEqual(de.map((n) => n.titulo))
    expect(para.map((n) => n.conteudo)).toEqual(de.map((n) => n.conteudo))

    // Bit a bit: o embedding sobreviveu ao base64 sem arredondar.
    for (const [i, n] of para.entries()) {
      expect(Array.from(n.embedding!)).toEqual(Array.from(de[i]!.embedding!))
    }

    expect(ordenar(await destino.listConexoes())).toEqual(ordenar(await origem.listConexoes()))
  })

  it('reprocessar depois de importar dá exatamente o mesmo grafo', async () => {
    // É o que o motor faz no import: os scores do arquivo vieram do perfil de
    // outro palácio, então são recalculados. Com os mesmos vetores, tem que dar
    // no mesmo — o algoritmo é determinístico.
    const origem = await palacioPovoado()
    const destino = repoVazio()
    await destino.importAll(await origem.exportAll())

    const antes = ordenar(await origem.listConexoes())
    const depois = ordenar(await reprocessar(destino))

    expect(depois.map((c) => c.id)).toEqual(antes.map((c) => c.id))
    for (const [i, c] of depois.entries()) {
      expect(c.score).toBeCloseTo(antes[i]!.score, 6)
      expect(c.cross).toBe(antes[i]!.cross)
      expect(c.mantidaPorA).toBe(antes[i]!.mantidaPorA)
      expect(c.mantidaPorB).toBe(antes[i]!.mantidaPorB)
    }
  })

  it('importar o mesmo arquivo duas vezes não duplica nada', async () => {
    const origem = await palacioPovoado()
    const snapshot = await origem.exportAll()
    const destino = repoVazio()

    await destino.importAll(snapshot)
    await destino.importAll(snapshot)

    expect(await destino.listLivros()).toHaveLength(LIVROS.length)
    expect(await destino.listNeuronios()).toHaveLength(NEURONIOS.length)
  })

  it('funde com o que já existe em vez de apagar', async () => {
    const origem = await palacioPovoado()
    const destino = repoVazio()

    await destino.upsertLivro({
      id: 'meu',
      titulo: 'Meu livro',
      cor: '#123456',
      prateleira: 0,
      ordem: 0,
      createdAt: T0,
    })
    await destino.upsertNeuronio({
      id: 'meu-n1',
      livroId: 'meu',
      titulo: 'Algo que eu já tinha',
      conteudo: '',
      embedding: null,
      createdAt: T0,
      updatedAt: T0,
    })

    await destino.importAll(await origem.exportAll())

    expect(await destino.listLivros()).toHaveLength(LIVROS.length + 1)
    expect(await destino.listNeuronios()).toHaveLength(NEURONIOS.length + 1)
    expect(await destino.getNeuronio('meu-n1')).toBeDefined()
  })

  it('o arquivo é JSON e o vetor vai em base64, não em array de números', async () => {
    const origem = await palacioPovoado()
    const texto = JSON.stringify(await origem.exportAll())

    const relido = JSON.parse(texto) as { neuronios: { embedding: string | null }[] }
    const embedding = relido.neuronios[0]!.embedding!

    // O ganho de tamanho contra array JSON está medido em `base64.test.ts`, com
    // um vetor de 384 dimensões — aqui os fixtures são esparsos demais para isso
    // significar alguma coisa.
    expect(typeof embedding).toBe('string')
    expect(embedding).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
    expect(texto).not.toMatch(/"embedding":\[/)
  })

  it('recusa um arquivo corrompido em vez de gravar lixo', async () => {
    const origem = await palacioPovoado()
    const destino = repoVazio()
    const snapshot = await origem.exportAll()

    snapshot.neuronios[0]!.embedding = 'isto não é base64!!'

    await expect(destino.importAll(snapshot)).rejects.toThrow()
    expect(await destino.listNeuronios()).toHaveLength(0)
  })
})

describe('a ordem da estante no backup', () => {
  const ids = async (repo: PalacioRepo): Promise<string[]> =>
    (await repo.listLivros()).map((l) => l.id)

  it('um backup devolve a estante arrumada como estava', async () => {
    const origem = await palacioPovoado()
    // Leva 'mus' para o início: psi(0),prog(1),mus(2) → mus,psi,prog.
    await origem.moverLivro('mus', 0, 0)
    const snapshot = await origem.exportAll()

    const destino = repoVazio()
    await destino.importAll(JSON.parse(JSON.stringify(snapshot)) as typeof snapshot)

    expect(await ids(destino)).toEqual(['mus', 'psi', 'prog'])
  })

  // Backup feito antes de a estante guardar ordem não tem o campo. A estante que
  // se via naquela época ordenava por `createdAt` e desempatava pelo id.
  it('backup sem ordem entra na ordem que se via quando ele foi feito', async () => {
    const origem = await palacioPovoado()
    const snapshot = await origem.exportAll()
    const antigo = {
      ...snapshot,
      livros: snapshot.livros.map((l) => ({
        id: l.id,
        titulo: l.titulo,
        cor: l.cor,
        createdAt: l.createdAt,
      })),
    }

    const destino = repoVazio()
    await destino.importAll(antigo)

    expect(await ids(destino)).toEqual(['mus', 'prog', 'psi'])
  })

  it('funde: os livros do arquivo na ordem dele, e os que só existiam aqui depois', async () => {
    const origem = await palacioPovoado()
    const destino = repoVazio()
    await destino.upsertLivro({
      id: 'meu',
      titulo: 'Meu livro',
      cor: '#123456',
      prateleira: 0,
      ordem: 0,
      createdAt: T0,
    })

    await destino.importAll(await origem.exportAll())
    await destino.importAll(await origem.exportAll())

    expect(await ids(destino)).toEqual(['psi', 'prog', 'mus', 'meu'])
  })
})

describe('etiquetas no backup', () => {
  it('exporta e importa a etiqueta de uma prateleira', async () => {
    const origem = await palacioPovoado()
    await origem.definirEtiqueta(0, 'Trabalho')
    const snapshot = await origem.exportAll()

    const destino = repoVazio()
    await destino.importAll(JSON.parse(JSON.stringify(snapshot)) as typeof snapshot)

    expect(await destino.listEtiquetas()).toEqual([{ prateleira: 0, texto: 'Trabalho' }])
  })

  it('a etiqueta do arquivo vence a que já existia na mesma prateleira', async () => {
    const origem = await palacioPovoado()
    await origem.definirEtiqueta(0, 'Trabalho')

    const destino = repoVazio()
    await destino.definirEtiqueta(0, 'Nome antigo')
    await destino.importAll(await origem.exportAll())

    expect(await destino.listEtiquetas()).toEqual([{ prateleira: 0, texto: 'Trabalho' }])
  })

  it('etiqueta que só existe aqui não é apagada pelo import', async () => {
    const origem = await palacioPovoado()
    const destino = repoVazio()
    await destino.definirEtiqueta(2, 'Só aqui')

    await destino.importAll(await origem.exportAll())

    expect(await destino.listEtiquetas()).toEqual([{ prateleira: 2, texto: 'Só aqui' }])
  })

  // Backup de antes da Fase 15 não tinha o campo — não pode quebrar o import.
  it('backup sem etiquetas importa normalmente, sem etiqueta nenhuma', async () => {
    const origem = await palacioPovoado()
    const snapshot = await origem.exportAll()
    const antigo = {
      version: snapshot.version,
      exportedAt: snapshot.exportedAt,
      livros: snapshot.livros,
      neuronios: snapshot.neuronios,
      conexoes: snapshot.conexoes,
    }

    const destino = repoVazio()
    await destino.importAll(antigo)

    expect(await destino.listEtiquetas()).toEqual([])
    expect(await destino.listLivros()).toHaveLength(LIVROS.length)
  })
})
