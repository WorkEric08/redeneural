import Dexie, { type EntityTable } from 'dexie'

import type { Conexao, Livro, Neuronio } from '@/core'

export const DB_NAME = 'palacio-mental'

/**
 * O estado derivado do último reprocessamento, gravado em vez de recalculado.
 *
 * Recalcular no boot custaria O(N²) e, pior, mudaria: as arestas guardadas foram
 * pontuadas com o centroide e a escala de quando foram criadas. Perfil novo com
 * arestas antigas dá scores incoerentes no mesmo grafo.
 */
export interface PerfilGravado {
  chave: 'perfil'
  centroide: Float32Array
  escalaEmb: number
  limiares: Map<string, number>
  neuronios: number
  atualizadoEm: Date
}

export type PalacioDB = Dexie & {
  livros: EntityTable<Livro, 'id'>
  neuronios: EntityTable<Neuronio, 'id'>
  conexoes: EntityTable<Conexao, 'id'>
  meta: EntityTable<PerfilGravado, 'chave'>
}

/**
 * `embedding` é gravado como Float32Array puro: o structured clone do IndexedDB
 * guarda o buffer binário, não um array JSON. ~1.5KB por neurônio em vez de ~8KB,
 * e o mesmo BLOB migra direto para SQLite depois.
 *
 * `cross` não é indexado de propósito — booleano não é chave válida em IndexedDB.
 */
export function createDb(name: string = DB_NAME): PalacioDB {
  const db = new Dexie(name) as PalacioDB

  db.version(1).stores({
    livros: 'id, createdAt',
    neuronios: 'id, livroId, updatedAt',
    conexoes: 'id, aId, bId, updatedAt',
  })

  // v2 só acrescenta `meta`; as tabelas antigas seguem intactas.
  db.version(2).stores({
    meta: 'chave',
  })

  return db
}

export const db = createDb()
