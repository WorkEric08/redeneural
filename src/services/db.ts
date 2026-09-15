import Dexie, { type EntityTable, type Table } from 'dexie'

import {
  distribuicaoAntiga,
  posicoesAntigas,
  type Conexao,
  type EtiquetaDePrateleira,
  type Livro,
  type Neuronio,
  type Ponto,
  type Vaga,
} from '@/core'

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

/** Preferências simples do palácio: quantidade de prateleiras (Fase 10) e intensidade da luz (Fase 17). */
export interface PreferenciasGravadas {
  chave: 'preferencias'
  quantidadeDePrateleiras: number
  /** 0-100. Ausente em preferências gravadas antes da Fase 17 — o repo trata como `INTENSIDADE_DA_LUZ_PADRAO`. */
  intensidadeDaLuz?: number
}

/**
 * As posições que a Rede gravou da última vez que organizou o grafo por
 * significado (Fase 23-2). O mesmo espírito do `PerfilGravado`: derivado do
 * grafo, congelado entre recálculos para a mobília não andar sozinha —
 * **não entra no backup**, pela mesma razão que o perfil não entra ("é
 * recalculado na chegada", ver CLAUDE.md).
 */
export interface PosicoesDaRedeGravadas {
  chave: 'posicoesDaRede'
  posicoes: Record<string, Ponto>
}

export type MetaGravada = PerfilGravado | PreferenciasGravadas | PosicoesDaRedeGravadas

export type PalacioDB = Dexie & {
  livros: EntityTable<Livro, 'id'>
  neuronios: EntityTable<Neuronio, 'id'>
  conexoes: EntityTable<Conexao, 'id'>
  meta: EntityTable<MetaGravada, 'chave'>
  etiquetas: EntityTable<EtiquetaDePrateleira, 'prateleira'>
  /** Chave composta `[prateleira+ordem]`: um lugar só tem uma vaga. */
  vagas: Table<Vaga, [number, number]>
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

  // v3: a estante passa a guardar a ordem que a pessoa arrumou. Quem já tinha
  // livros recebe a ordem que via até aqui — `listLivros` ordenava por
  // `createdAt`, e o IndexedDB desempata pela chave, que é o que este cursor
  // também faz. Nenhum livro muda de lugar na primeira abertura depois disso.
  db.version(3)
    .stores({
      livros: 'id, createdAt, ordem',
    })
    .upgrade(async (tx) => {
      const livros = tx.table<Omit<Livro, 'ordem'> & { ordem?: number }, string>('livros')
      const antigos = await livros.orderBy('createdAt').toArray()
      await livros.bulkPut(antigos.map((l, ordem) => ({ ...l, ordem })))
    })

  // v4 (Fase 10): a prateleira passa a ser gravada, não mais calculada a cada
  // render. Quem já tinha livros recebe a prateleira/ordem que a distribuição
  // automática de então calculava — `posicoesAntigas`, congelada em
  // `estanteAntiga.ts` só para isto — e nenhum livro muda de lugar. A
  // quantidade de prateleiras vira preferência gravada, igual ao que a
  // distribuição de então calculava para este tanto de livro.
  db.version(4)
    .stores({
      livros: 'id, createdAt, ordem, prateleira',
    })
    .upgrade(async (tx) => {
      const livros = tx.table<Livro & { prateleira?: number }, string>('livros')
      const antigos = await livros.orderBy('ordem').toArray()
      const posicoes = posicoesAntigas(antigos.map((l) => l.id))

      await livros.bulkPut(
        antigos.map((l) => ({ ...l, ...(posicoes.get(l.id) ?? { prateleira: 0, ordem: 0 }) })),
      )

      if (antigos.length > 0) {
        // O mesmo `quantas` que a distribuição automática mostrava para este
        // tanto de livro — inclui prateleiras vazias de sobra (mínimo 4), não
        // só as que já tinham livro, senão o móvel encolheria na migração.
        const meta = tx.table<MetaGravada, string>('meta')
        await meta.put({
          chave: 'preferencias',
          quantidadeDePrateleiras: distribuicaoAntiga(antigos.length).quantas,
        })
      }
    })

  // v5 (Fase 15): nome de prateleira, puramente visual — tabela nova, sem
  // migração de dado nenhum (mesmo padrão de `meta` na v2).
  db.version(5).stores({
    etiquetas: 'prateleira',
  })

  // v6 (Fase 16): emblema opcional na lombada. `emblema` não é indexado — não
  // se filtra nem se busca por ele —, então o schema de `livros` não muda,
  // só o dado precisa de um valor pra quem já existia.
  db.version(6)
    .stores({})
    .upgrade(async (tx) => {
      const livros = tx.table<Livro & { emblema?: string | null }, string>('livros')
      const antigos = await livros.toArray()
      await livros.bulkPut(antigos.map((l) => ({ ...l, emblema: l.emblema ?? null })))
    })

  // v7 (Fase 19): largura da lombada, opcional. Mesmo padrão da v6 — não é
  // indexada, então só o dado precisa de um valor (`null` = automática, a
  // semente do id continua decidindo) pra quem já existia.
  db.version(7)
    .stores({})
    .upgrade(async (tx) => {
      const livros = tx.table<Livro & { larguraLombada?: number | null }, string>('livros')
      const antigos = await livros.toArray()
      await livros.bulkPut(antigos.map((l) => ({ ...l, larguraLombada: l.larguraLombada ?? null })))
    })

  // v8 (14/09/2026): comprimento da lombada, opcional. Mesmo padrão da v6/v7
  // — não é indexado, então só o dado precisa de um valor (`null` =
  // automático, a quantidade de neurônios continua decidindo) pra quem já
  // existia.
  db.version(8)
    .stores({})
    .upgrade(async (tx) => {
      const livros = tx.table<Livro & { comprimentoLombada?: number | null }, string>('livros')
      const antigos = await livros.toArray()
      await livros.bulkPut(
        antigos.map((l) => ({ ...l, comprimentoLombada: l.comprimentoLombada ?? null })),
      )
    })

  // v9 (14/09/2026): a prateleira vira fileira de lugares fixos. Tabela nova,
  // sem migração de dado nenhum: `ordem` denso é um lugar válido, e sem vaga
  // gravada todo lugar sem livro continua mostrando um enfeite — ninguém muda
  // de lugar na primeira abertura (mesmo padrão da v2 e da v5).
  db.version(9).stores({
    vagas: '[prateleira+ordem], prateleira',
  })

  return db
}

export const db = createDb()
