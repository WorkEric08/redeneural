import type { Conexao, Id, Livro, Neuronio, PalacioRepo, PalacioSnapshot } from '@/core'
import {
  SNAPSHOT_VERSION,
  conexaoId,
  conexaoFromSnapshot,
  conexaoToSnapshot,
  livroFromSnapshot,
  livroToSnapshot,
  moverLivroNaEstante,
  MINIMO_DE_PRATELEIRAS,
  neuronioFromSnapshot,
  neuronioToSnapshot,
  posicoesAntigas,
} from '@/core'
import {
  db as defaultDb,
  type PalacioDB,
  type PerfilGravado,
  type PreferenciasGravadas,
} from '@/services/db'

import {
  conexaoSchema,
  etiquetaSchema,
  livroSchema,
  neuronioSchema,
  snapshotSchema,
} from './schemas'

/**
 * Reagrupa por prateleira depois de uma fusão de import: os livros de
 * `primeiro` (o arquivo) entram primeiro em cada prateleira deles, na ordem
 * que já tinham; os de `depois` (quem só existia aqui) vão para o fim da
 * própria prateleira, também na ordem que já tinham. `ordem` sai densa,
 * 0..N-1, por prateleira.
 */
function juntarPorPrateleira(primeiro: readonly Livro[], depois: readonly Livro[]): Livro[] {
  const porPrateleira = new Map<number, Livro[]>()
  const empilhar = (l: Livro): void => {
    const lista = porPrateleira.get(l.prateleira) ?? []
    lista.push(l)
    porPrateleira.set(l.prateleira, lista)
  }

  const porOrdem = (a: Livro, b: Livro): number => a.prateleira - b.prateleira || a.ordem - b.ordem

  for (const l of [...primeiro].sort(porOrdem)) empilhar(l)
  for (const l of [...depois].sort(porOrdem)) empilhar(l)

  return [...porPrateleira.entries()].flatMap(([prateleira, lista]) =>
    lista.map((l, ordem) => ({ ...l, prateleira, ordem })),
  )
}

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
      // `ordem` é denso só dentro de cada prateleira agora — a ordem de leitura
      // da estante inteira é prateleira, e dentro dela, ordem.
      const todos = await db.livros.toArray()
      return todos.sort((a, b) => a.prateleira - b.prateleira || a.ordem - b.ordem)
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

    async moverLivro(id, prateleira, posicao) {
      await db.transaction('rw', db.livros, async () => {
        const todos = await db.livros.toArray()
        if (!todos.some((l) => l.id === id)) {
          throw new Error(`moverLivro: livro ${id} não existe`)
        }

        const depois = moverLivroNaEstante(todos, id, prateleira, posicao)
        const mudou = depois.filter((l, i) => {
          const antes = todos[i]
          return antes && (antes.prateleira !== l.prateleira || antes.ordem !== l.ordem)
        })

        await Promise.all(
          mudou.map((l) => db.livros.update(l.id, { prateleira: l.prateleira, ordem: l.ordem })),
        )
      })
    },

    async definirOrdens(mudancas) {
      if (mudancas.length === 0) return
      await db.transaction('rw', db.livros, async () => {
        await Promise.all(mudancas.map((m) => db.livros.update(m.id, { ordem: m.ordem })))
      })
    },

    async getQuantidadeDePrateleiras() {
      const gravado = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
      return gravado?.quantidadeDePrateleiras ?? MINIMO_DE_PRATELEIRAS
    },

    async definirQuantidadeDePrateleiras(quantidade) {
      await db.transaction('rw', db.livros, db.meta, async () => {
        const ocupada = await db.livros.where('prateleira').aboveOrEqual(quantidade).count()
        if (ocupada > 0) {
          throw new Error(
            `ainda há livro na prateleira ${String(quantidade)} ou depois — mova antes de diminuir`,
          )
        }
        const preferencias: PreferenciasGravadas = {
          chave: 'preferencias',
          quantidadeDePrateleiras: quantidade,
        }
        await db.meta.put(preferencias)
      })
    },

    async listEtiquetas() {
      return db.etiquetas.toArray()
    },

    async definirEtiqueta(prateleira, texto) {
      const limpo = texto.trim()
      if (limpo === '') {
        await db.etiquetas.delete(prateleira)
        return
      }
      await db.etiquetas.put(etiquetaSchema.parse({ prateleira, texto: limpo }))
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
      const gravado = (await db.meta.get('perfil')) as PerfilGravado | undefined
      if (!gravado) return undefined

      return {
        centroide: gravado.centroide,
        limiarPorNo: gravado.limiares,
        escalaEmb: gravado.escalaEmb,
      }
    },

    async setPerfil(p, neuronios) {
      const perfil: PerfilGravado = {
        chave: 'perfil',
        centroide: p.centroide,
        escalaEmb: p.escalaEmb,
        limiares: new Map(p.limiarPorNo),
        neuronios,
        atualizadoEm: new Date(),
      }
      await db.meta.put(perfil)
    },

    async exportAll(): Promise<PalacioSnapshot> {
      const [livros, neuronios, conexoes, etiquetas] = await db.transaction(
        'r',
        db.livros,
        db.neuronios,
        db.conexoes,
        db.etiquetas,
        async () =>
          Promise.all([
            db.livros.toArray(),
            db.neuronios.toArray(),
            db.conexoes.toArray(),
            db.etiquetas.toArray(),
          ]),
      )

      return {
        version: SNAPSHOT_VERSION,
        exportedAt: new Date().toISOString(),
        livros: livros.map(livroToSnapshot),
        neuronios: neuronios.map(neuronioToSnapshot),
        conexoes: conexoes.map(conexaoToSnapshot),
        etiquetas,
      }
    },

    async importAll(s: PalacioSnapshot) {
      const parsed = snapshotSchema.parse(s)

      // Backup de antes da Fase 10 não tinha prateleira gravada: reconstrói com
      // a mesma distribuição automática que valia então — a ordem do arquivo
      // vence, na mesma sequência (`ordem`, `createdAt`, desempate pelo id) que
      // já reconstruía a ordem de backups de antes de a estante guardá-la.
      const temPosicaoPropria = parsed.livros.every((l) => l.prateleira !== undefined)
      const posicoes = temPosicaoPropria
        ? null
        : posicoesAntigas(
            [...parsed.livros]
              .sort(
                (a, b) =>
                  (a.ordem ?? 0) - (b.ordem ?? 0) ||
                  a.createdAt.localeCompare(b.createdAt) ||
                  (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
              )
              .map((l) => l.id),
          )

      const livros = parsed.livros.map((l) => {
        const posicao = posicoes?.get(l.id)
        return livroFromSnapshot(
          l,
          posicao?.prateleira ?? l.prateleira ?? 0,
          posicao?.ordem ?? l.ordem ?? 0,
        )
      })
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
      await db.transaction(
        'rw',
        db.livros,
        db.neuronios,
        db.conexoes,
        db.meta,
        db.etiquetas,
        async () => {
          // Quem só existe aqui vai para o fim da própria prateleira, na ordem em
          // que já estava — o mesmo "arquivo vence" de título e cor, agora por
          // prateleira em vez da estante inteira.
          const soAqui = (await db.livros.toArray()).filter((l) => !livroIds.has(l.id))
          const unidos = juntarPorPrateleira(livros, soAqui)

          await db.livros.bulkPut(unidos)
          await db.neuronios.bulkPut(neuronios)
          await db.conexoes.bulkPut(conexoes)
          // A etiqueta do arquivo vence a que já existia na mesma prateleira;
          // etiqueta que só existe aqui não é apagada.
          await db.etiquetas.bulkPut(parsed.etiquetas)

          // Um backup de um palácio com mais prateleiras não pode esconder livro
          // numa prateleira que este aparelho ainda não tem.
          const maiorPrateleira = Math.max(-1, ...unidos.map((l) => l.prateleira)) + 1
          const atual = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
          if (maiorPrateleira > (atual?.quantidadeDePrateleiras ?? MINIMO_DE_PRATELEIRAS)) {
            const preferencias: PreferenciasGravadas = {
              chave: 'preferencias',
              quantidadeDePrateleiras: maiorPrateleira,
            }
            await db.meta.put(preferencias)
          }
        },
      )
    },

    async clear() {
      await db.transaction(
        'rw',
        db.livros,
        db.neuronios,
        db.conexoes,
        db.meta,
        db.etiquetas,
        async () => {
          await Promise.all([
            db.livros.clear(),
            db.neuronios.clear(),
            db.conexoes.clear(),
            db.meta.clear(),
            db.etiquetas.clear(),
          ])
        },
      )
    },
  }
}

export const palacioRepo = createDexieRepo()
