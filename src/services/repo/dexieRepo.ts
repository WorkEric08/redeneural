import type { Conexao, Id, Livro, Neuronio, PalacioRepo, PalacioSnapshot } from '@/core'
import {
  SNAPSHOT_VERSION,
  conexaoId,
  conexaoFromSnapshot,
  conexaoToSnapshot,
  livroFromSnapshot,
  livroToSnapshot,
  neuronioFromSnapshot,
  neuronioToSnapshot,
} from '@/core'
import { db as defaultDb, type PalacioDB } from '@/services/db'

import { conexaoSchema, livroSchema, neuronioSchema, snapshotSchema } from './schemas'

/**
 * Implementação IndexedDB da porta `PalacioRepo`.
 *
 * É deliberadamente burra: não decide quais arestas existem, só grava o que o
 * núcleo mandou. A inteligência mora em `src/core`.
 */
export function createDexieRepo(db: PalacioDB = defaultDb): PalacioRepo {
  async function idsDeConexoesQueTocam(neuronioIds: Id[]): Promise<Id[]> {
    const [porA, porB] = await Promise.all([
      db.conexoes.where('aId').anyOf(neuronioIds).primaryKeys(),
      db.conexoes.where('bId').anyOf(neuronioIds).primaryKeys(),
    ])
    return [...new Set([...porA, ...porB])]
  }

  return {
    async listLivros() {
      return db.livros.orderBy('createdAt').toArray()
    },

    async getLivro(id) {
      return db.livros.get(id)
    },

    async upsertLivro(l: Livro) {
      await db.livros.put(livroSchema.parse(l))
    },

    async deleteLivro(id) {
      await db.transaction('rw', db.livros, db.neuronios, db.conexoes, async () => {
        const neuronioIds = await db.neuronios.where('livroId').equals(id).primaryKeys()
        if (neuronioIds.length > 0) {
          await db.conexoes.bulkDelete(await idsDeConexoesQueTocam(neuronioIds))
          await db.neuronios.bulkDelete(neuronioIds)
        }
        await db.livros.delete(id)
      })
    },

    async listNeuronios(livroId) {
      if (livroId === undefined) return db.neuronios.toArray()
      return db.neuronios.where('livroId').equals(livroId).toArray()
    },

    async getNeuronio(id) {
      return db.neuronios.get(id)
    },

    async upsertNeuronio(n: Neuronio) {
      await db.neuronios.put(neuronioSchema.parse(n))
    },

    async deleteNeuronio(id) {
      await db.transaction('rw', db.neuronios, db.conexoes, async () => {
        await db.conexoes.bulkDelete(await idsDeConexoesQueTocam([id]))
        await db.neuronios.delete(id)
      })
    },

    async listConexoes() {
      return db.conexoes.toArray()
    },

    async listConexoesDe(neuronioId) {
      return db.conexoes.where('aId').equals(neuronioId).or('bId').equals(neuronioId).toArray()
    },

    async replaceConexoesDe(neuronioId, novas: Conexao[]) {
      const validadas = novas.map((c) => conexaoSchema.parse(c))
      const forasteira = validadas.find((c) => c.aId !== neuronioId && c.bId !== neuronioId)
      if (forasteira) {
        throw new Error(
          `replaceConexoesDe(${neuronioId}) recebeu a aresta ${forasteira.id}, que não toca esse neurônio`,
        )
      }

      await db.transaction('rw', db.conexoes, async () => {
        const antigas = await idsDeConexoesQueTocam([neuronioId])
        const mantidas = new Set(validadas.map((c) => c.id))
        await db.conexoes.bulkDelete(antigas.filter((id) => !mantidas.has(id)))
        await db.conexoes.bulkPut(validadas)
      })
    },

    async soltarMarcas(marcas) {
      if (marcas.length === 0) return

      await db.transaction('rw', db.conexoes, async () => {
        const ids = [...new Set(marcas.map((m) => conexaoId(m.noId, m.outroId)))]
        const existentes = await db.conexoes.bulkGet(ids)

        const perdidas = new Set(marcas.map((m) => `${m.noId}::${m.outroId}`))
        const aRegravar: Conexao[] = []
        const aApagar: Id[] = []

        for (const c of existentes) {
          if (!c) continue
          const atualizada: Conexao = {
            ...c,
            mantidaPorA: c.mantidaPorA && !perdidas.has(`${c.aId}::${c.bId}`),
            mantidaPorB: c.mantidaPorB && !perdidas.has(`${c.bId}::${c.aId}`),
          }
          if (atualizada.mantidaPorA || atualizada.mantidaPorB) aRegravar.push(atualizada)
          else aApagar.push(c.id)
        }

        await db.conexoes.bulkPut(aRegravar)
        await db.conexoes.bulkDelete(aApagar)
      })
    },

    async replaceTodasConexoes(novas) {
      const validadas = novas.map((c) => conexaoSchema.parse(c))

      await db.transaction('rw', db.conexoes, async () => {
        await db.conexoes.clear()
        await db.conexoes.bulkPut(validadas)
      })
    },

    async getPerfil() {
      const gravado = await db.meta.get('perfil')
      if (!gravado) return undefined

      return {
        centroide: gravado.centroide,
        limiarPorNo: gravado.limiares,
        escalaEmb: gravado.escalaEmb,
      }
    },

    async setPerfil(p, neuronios) {
      await db.meta.put({
        chave: 'perfil',
        centroide: p.centroide,
        escalaEmb: p.escalaEmb,
        limiares: new Map(p.limiarPorNo),
        neuronios,
        atualizadoEm: new Date(),
      })
    },

    async exportAll(): Promise<PalacioSnapshot> {
      const [livros, neuronios, conexoes] = await db.transaction(
        'r',
        db.livros,
        db.neuronios,
        db.conexoes,
        async () =>
          Promise.all([db.livros.toArray(), db.neuronios.toArray(), db.conexoes.toArray()]),
      )

      return {
        version: SNAPSHOT_VERSION,
        exportedAt: new Date().toISOString(),
        livros: livros.map(livroToSnapshot),
        neuronios: neuronios.map(neuronioToSnapshot),
        conexoes: conexoes.map(conexaoToSnapshot),
      }
    },

    async importAll(s: PalacioSnapshot) {
      const parsed = snapshotSchema.parse(s)

      const livros = parsed.livros.map(livroFromSnapshot)
      const neuronios = parsed.neuronios.map(neuronioFromSnapshot)
      const conexoes = parsed.conexoes.map(conexaoFromSnapshot)

      const livroIds = new Set(livros.map((l) => l.id))
      const orfao = neuronios.find((n) => !livroIds.has(n.livroId))
      if (orfao) {
        throw new Error(
          `snapshot inválido: neurônio ${orfao.id} aponta para o livro inexistente ${orfao.livroId}`,
        )
      }

      const neuronioIds = new Set(neuronios.map((n) => n.id))
      const solta = conexoes.find((c) => !neuronioIds.has(c.aId) || !neuronioIds.has(c.bId))
      if (solta) {
        throw new Error(
          `snapshot inválido: conexão ${solta.id} aponta para um neurônio inexistente`,
        )
      }

      // bulkPut por id: reimportar o mesmo snapshot não duplica nada.
      await db.transaction('rw', db.livros, db.neuronios, db.conexoes, async () => {
        await db.livros.bulkPut(livros)
        await db.neuronios.bulkPut(neuronios)
        await db.conexoes.bulkPut(conexoes)
      })
    },

    async clear() {
      await db.transaction('rw', db.livros, db.neuronios, db.conexoes, db.meta, async () => {
        await Promise.all([
          db.livros.clear(),
          db.neuronios.clear(),
          db.conexoes.clear(),
          db.meta.clear(),
        ])
      })
    },
  }
}

export const palacioRepo = createDexieRepo()
