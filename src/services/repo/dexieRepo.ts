import type {
  Anexo,
  Conexao,
  DadosDoEnfeite,
  EnfeiteGravado,
  Id,
  Livro,
  Neuronio,
  PalacioRepo,
  PalacioSnapshot,
  Vaga,
} from '@/core'
import {
  anexoFromSnapshot,
  anexoToSnapshot,
  SNAPSHOT_VERSION,
  clampIntensidadeDaLuz,
  conexaoId,
  conexaoFromSnapshot,
  conexaoToSnapshot,
  INTENSIDADE_DA_LUZ_PADRAO,
  livroFromSnapshot,
  livroToSnapshot,
  LUGARES_POR_PRATELEIRA,
  moverLivroNaEstante,
  moverEnfeiteNaEstante,
  enfeitesSemLivroEmCima,
  corMaisProxima,
  MAXIMO_DE_PRATELEIRAS,
  MINIMO_DE_PRATELEIRAS,
  modoDaBuscaOuPadrao,
  modoDaRedeOuPadrao,
  fundirMapas,
  MAPA_VAZIO,
  neuronioFromSnapshot,
  neuronioToSnapshot,
  posicoesAntigas,
  primeiroLugarLivre,
  vagasDepoisDeMover,
  chaveDoLugar,
} from '@/core'
import {
  db as defaultDb,
  type MapaGravado,
  type PalacioDB,
  type PerfilGravado,
  type PosicoesDaRedeGravadas,
  type PreferenciasGravadas,
} from '@/services/db'

import {
  anexoSchema,
  arquivoSchema,
  conexaoSchema,
  enfeiteSchema,
  livroSchema,
  neuronioSchema,
  snapshotSchema,
  vagaSchema,
  vinculoSchema,
} from './schemas'

/**
 * O mais recente primeiro (escolha do usuário, 17/09/2026). Sem isto a lista
 * saía na ordem da chave primária — um uuid v4, ou seja, ordem nenhuma.
 *
 * Por `createdAt`, e não pelo `updatedAt` que é indexado: corrigir um typo não
 * pode fazer o neurônio pular para o topo do livro. O id desempata para dois
 * neurônios criados no mesmo milissegundo não trocarem de lugar entre sessões
 * — a mesma promessa de "a mobília não anda" que a estante e a Rede já fazem.
 * Vale igual para os anexos de uma pasta.
 */
function porMaisRecente(a: Neuronio | Anexo, b: Neuronio | Anexo): number {
  return b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? -1 : 1)
}

/**
 * Junta, lugar a lugar, os livros do arquivo (`primeiro`) com os que só
 * existem aqui (`depois`). Os do arquivo ficam no lugar que tinham — o mesmo
 * "arquivo vence" de título e cor. Os daqui ficam no deles se ainda estiver
 * livre, e senão vão para o buraco mais perto.
 *
 * Nenhum livro se perde: numa prateleira sem buraco nenhum, o que não coube
 * vai para depois do último lugar, onde a estante não mostra mas o dado fica.
 */
function juntarPorLugar(primeiro: readonly Livro[], depois: readonly Livro[]): Livro[] {
  const porLugar = (a: Livro, b: Livro): number => a.prateleira - b.prateleira || a.ordem - b.ordem
  const colocados: Livro[] = []

  for (const l of [...[...primeiro].sort(porLugar), ...[...depois].sort(porLugar)]) {
    const livre = primeiroLugarLivre(colocados, l.prateleira, l.ordem)
    const transbordo =
      LUGARES_POR_PRATELEIRA + colocados.filter((c) => c.prateleira === l.prateleira).length
    colocados.push({ ...l, ordem: livre ?? transbordo })
  }

  return colocados
}

function chaveDaVaga(v: Vaga): [number, number] {
  return [v.prateleira, v.ordem]
}

function chaveDoEnfeite(e: Pick<EnfeiteGravado, 'prateleira' | 'ordem'>): [number, number] {
  return [e.prateleira, e.ordem]
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

  /**
   * As preferências gravadas com `mudancas` por cima. Os campos irmãos vêm do
   * documento atual: as preferências moram num documento só, e regravá-lo sem
   * ler antes apagaria o que a operação não veio mudar.
   */
  async function preferenciasCom(
    mudancas: Partial<Omit<PreferenciasGravadas, 'chave'>>,
  ): Promise<PreferenciasGravadas> {
    const atual = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
    return {
      quantidadeDePrateleiras: MINIMO_DE_PRATELEIRAS,
      ...atual,
      ...mudancas,
      chave: 'preferencias',
    }
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
      const livro = livroSchema.parse(l)
      await db.transaction('rw', db.livros, db.vagas, db.enfeites, async () => {
        await db.livros.put(livro)
        await db.vagas.delete(chaveDaVaga(livro))
        await db.enfeites.delete(chaveDoEnfeite(livro))
      })
    },

    async deleteLivro(id) {
      await db.transaction(
        'rw',
        [db.livros, db.neuronios, db.conexoes, db.vagas, db.anexos, db.arquivos, db.vinculos],
        async () => {
          const livro = await db.livros.get(id)
          const neuronioIds = await db.neuronios.where('livroId').equals(id).primaryKeys()
          if (neuronioIds.length > 0) {
            await db.conexoes.bulkDelete(await idsDeConexoesQueTocam(neuronioIds))
            await db.vinculos.where('conceitoId').anyOf(neuronioIds).delete()
            await db.neuronios.bulkDelete(neuronioIds)
          }
          const anexoIds = await db.anexos.where('livroId').equals(id).primaryKeys()
          if (anexoIds.length > 0) {
            await db.vinculos.where('anexoId').anyOf(anexoIds).delete()
            await db.arquivos.bulkDelete(anexoIds)
            await db.anexos.bulkDelete(anexoIds)
          }
          await db.livros.delete(id)
          if (livro) await db.vagas.put({ prateleira: livro.prateleira, ordem: livro.ordem })
        },
      )
    },

    async moverLivro(id, prateleira, lugar) {
      await db.transaction('rw', db.livros, db.vagas, db.enfeites, async () => {
        const todos = await db.livros.toArray()
        const movido = todos.find((l) => l.id === id)
        if (!movido) throw new Error(`moverLivro: livro ${id} não existe`)

        const depois = moverLivroNaEstante(todos, id, prateleira, lugar)
        if (!depois) {
          throw new Error(`a prateleira ${String(prateleira + 1)} não tem lugar sem livro`)
        }

        const mudou = depois.filter((l, i) => {
          const antes = todos[i]
          return antes && (antes.prateleira !== l.prateleira || antes.ordem !== l.ordem)
        })
        await Promise.all(
          mudou.map((l) => db.livros.update(l.id, { prateleira: l.prateleira, ordem: l.ordem })),
        )

        // A mesma conta que a store faz para mostrar antes de o banco confirmar.
        // Vagas são poucas: regravar a tabela inteira é mais simples que um diff.
        const vagas = vagasDepoisDeMover(await db.vagas.toArray(), todos, depois, id)
        await db.vagas.clear()
        await db.vagas.bulkPut(vagas)

        // Um livro que chega a um lugar tira o enfeite gravado que estava nele.
        const soterrados = (await db.enfeites.toArray()).filter(
          (e) => enfeitesSemLivroEmCima([e], depois).length === 0,
        )
        await db.enfeites.bulkDelete(soterrados.map(chaveDoEnfeite))
      })
    },

    async listVagas() {
      return db.vagas.toArray()
    },

    async listEnfeites() {
      return db.enfeites.toArray()
    },

    async salvarEnfeite(e) {
      const enfeite = enfeiteSchema.parse(e)
      await db.transaction('rw', db.livros, db.vagas, db.enfeites, async () => {
        const temLivro = await db.livros
          .where('prateleira')
          .equals(enfeite.prateleira)
          .filter((l) => l.ordem === enfeite.ordem)
          .count()
        if (temLivro > 0) throw new Error('esse lugar tem um livro — não cabe um enfeite')
        await db.vagas.delete(chaveDaVaga(enfeite))
        await db.enfeites.put(enfeite)
      })
    },

    async moverEnfeite(origem, destino, dados: DadosDoEnfeite) {
      const lugarDeOrigem = vagaSchema.parse(origem)
      const lugarDeDestino = vagaSchema.parse(destino)
      // Valida o que viaja com o enfeite (cor da paleta, medidas) como um enfeite inteiro.
      const validado = enfeiteSchema.parse({ ...dados, ...lugarDeDestino })
      await db.transaction('rw', db.livros, db.vagas, db.enfeites, async () => {
        const todos = await db.livros.toArray()
        const depois = moverEnfeiteNaEstante(
          {
            livros: todos,
            vagas: await db.vagas.toArray(),
            enfeites: await db.enfeites.toArray(),
          },
          lugarDeOrigem,
          lugarDeDestino,
          {
            cor: validado.cor,
            estilo: validado.estilo,
            larguraLombada: validado.larguraLombada,
            comprimentoLombada: validado.comprimentoLombada,
            dourado: validado.dourado,
            detalheEscuro: validado.detalheEscuro,
          },
        )
        if (!depois) {
          throw new Error(`a prateleira ${String(destino.prateleira + 1)} não tem lugar sem livro`)
        }

        const mudou = depois.livros.filter((l, i) => {
          const antes = todos[i]
          return antes && (antes.prateleira !== l.prateleira || antes.ordem !== l.ordem)
        })
        await Promise.all(
          mudou.map((l) => db.livros.update(l.id, { prateleira: l.prateleira, ordem: l.ordem })),
        )

        // Vagas e enfeites são poucos: regravar a tabela inteira é mais simples que um diff.
        await db.vagas.clear()
        await db.vagas.bulkPut(depois.vagas)
        await db.enfeites.clear()
        await db.enfeites.bulkPut(depois.enfeites)
      })
    },

    async abrirVaga(v) {
      const vaga = vagaSchema.parse(v)
      await db.transaction('rw', db.livros, db.vagas, db.enfeites, async () => {
        const temLivro = await db.livros
          .where('prateleira')
          .equals(vaga.prateleira)
          .filter((l) => l.ordem === vaga.ordem)
          .count()
        if (temLivro > 0) throw new Error('esse lugar tem um livro — não há enfeite para tirar')
        await db.vagas.put(vaga)
        await db.enfeites.delete(chaveDoEnfeite(vaga))
      })
    },

    async fecharVaga(v) {
      await db.vagas.delete(chaveDaVaga(v))
    },

    async getQuantidadeDePrateleiras() {
      const gravado = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
      return gravado?.quantidadeDePrateleiras ?? MINIMO_DE_PRATELEIRAS
    },

    async definirQuantidadeDePrateleiras(quantidade) {
      if (quantidade > MAXIMO_DE_PRATELEIRAS) {
        throw new Error(`a estante tem no máximo ${String(MAXIMO_DE_PRATELEIRAS)} prateleiras`)
      }
      await db.transaction('rw', db.livros, db.meta, db.vagas, db.enfeites, async () => {
        const ocupada = await db.livros.where('prateleira').aboveOrEqual(quantidade).count()
        if (ocupada > 0) {
          throw new Error(
            `ainda há livro na prateleira ${String(quantidade)} ou depois — mova antes de diminuir`,
          )
        }
        // Prateleira que deixa de existir não guarda buraco: se voltar a existir,
        // volta cheia de enfeite, como qualquer prateleira nova.
        await db.vagas.where('prateleira').aboveOrEqual(quantidade).delete()
        await db.enfeites.where('prateleira').aboveOrEqual(quantidade).delete()
        await db.meta.put(await preferenciasCom({ quantidadeDePrateleiras: quantidade }))
      })
    },

    async getIntensidadeDaLuz() {
      const gravado = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
      return gravado?.intensidadeDaLuz ?? INTENSIDADE_DA_LUZ_PADRAO
    },

    async definirIntensidadeDaLuz(valor) {
      const recortado = clampIntensidadeDaLuz(valor)
      await db.transaction('rw', db.meta, async () => {
        await db.meta.put(await preferenciasCom({ intensidadeDaLuz: recortado }))
      })
    },

    async getModoDaRede() {
      const gravado = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
      return modoDaRedeOuPadrao(gravado?.modoDaRede)
    },

    async definirModoDaRede(modo) {
      await db.transaction('rw', db.meta, async () => {
        await db.meta.put(await preferenciasCom({ modoDaRede: modoDaRedeOuPadrao(modo) }))
      })
    },

    async getModoDaBusca() {
      const gravado = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
      return modoDaBuscaOuPadrao(gravado?.modoDaBusca)
    },

    async definirModoDaBusca(modo) {
      await db.transaction('rw', db.meta, async () => {
        await db.meta.put(await preferenciasCom({ modoDaBusca: modoDaBuscaOuPadrao(modo) }))
      })
    },

    async listNeuronios(livroId) {
      const todos =
        livroId === undefined
          ? await db.neuronios.toArray()
          : await db.neuronios.where('livroId').equals(livroId).toArray()
      return todos.sort(porMaisRecente)
    },

    async getNeuronio(id) {
      return db.neuronios.get(id)
    },

    async upsertNeuronio(n: Neuronio) {
      await db.neuronios.put(neuronioSchema.parse(n))
    },

    async deleteNeuronio(id) {
      await db.transaction('rw', db.neuronios, db.conexoes, db.vinculos, async () => {
        await db.conexoes.bulkDelete(await idsDeConexoesQueTocam([id]))
        await db.vinculos.where('conceitoId').equals(id).delete()
        await db.neuronios.delete(id)
      })
    },

    async listAnexos(livroId) {
      const todos =
        livroId === undefined
          ? await db.anexos.toArray()
          : await db.anexos.where('livroId').equals(livroId).toArray()
      return todos.sort(porMaisRecente)
    },

    async getAnexo(id) {
      return db.anexos.get(id)
    },

    async upsertAnexo(a, arquivo) {
      const anexo = anexoSchema.parse(a)
      const bytes = arquivo && arquivoSchema.parse({ anexoId: anexo.id, ...arquivo })
      await db.transaction('rw', db.anexos, db.arquivos, async () => {
        await db.anexos.put(anexo)
        if (bytes) await db.arquivos.put(bytes)
      })
    },

    async deleteAnexo(id) {
      await db.transaction('rw', db.anexos, db.arquivos, db.vinculos, async () => {
        await db.vinculos.where('anexoId').equals(id).delete()
        await db.arquivos.delete(id)
        await db.anexos.delete(id)
      })
    },

    async getArquivo(anexoId) {
      const gravado = await db.arquivos.get(anexoId)
      return gravado && { imagem: gravado.imagem, miniatura: gravado.miniatura }
    },

    async listVinculos() {
      return db.vinculos.toArray()
    },

    async replaceVinculosDe(anexoId, novos) {
      const validados = novos.map((v) => vinculoSchema.parse(v))
      const forasteiro = validados.find((v) => v.anexoId !== anexoId)
      if (forasteiro) {
        throw new Error(
          `replaceVinculosDe(${anexoId}) recebeu o vínculo ${forasteiro.id}, que é de outro anexo`,
        )
      }

      await db.transaction('rw', db.vinculos, async () => {
        await db.vinculos.where('anexoId').equals(anexoId).delete()
        await db.vinculos.bulkPut(validados)
      })
    },

    async replaceTodosVinculos(novos) {
      const validados = novos.map((v) => vinculoSchema.parse(v))
      await db.transaction('rw', db.vinculos, async () => {
        await db.vinculos.clear()
        await db.vinculos.bulkPut(validados)
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

    async getPosicoesDaRede() {
      const gravado = (await db.meta.get('posicoesDaRede')) as PosicoesDaRedeGravadas | undefined
      return gravado?.posicoes ?? {}
    },

    async setPosicoesDaRede(posicoes) {
      const gravado: PosicoesDaRedeGravadas = { chave: 'posicoesDaRede', posicoes: { ...posicoes } }
      await db.meta.put(gravado)
    },

    async getMapa() {
      const gravado = (await db.meta.get('mapa')) as MapaGravado | undefined
      return gravado ? { ilhas: gravado.ilhas } : MAPA_VAZIO
    },

    async setMapa(mapa) {
      const gravado: MapaGravado = { chave: 'mapa', ilhas: mapa.ilhas }
      await db.meta.put(gravado)
    },

    async exportAll(): Promise<PalacioSnapshot> {
      const [livros, neuronios, conexoes, etiquetas, vagas, enfeites, anexos, arquivos] =
        await db.transaction(
          'r',
          [
            db.livros,
            db.neuronios,
            db.conexoes,
            db.etiquetas,
            db.vagas,
            db.enfeites,
            db.anexos,
            db.arquivos,
          ],
          async () =>
            Promise.all([
              db.livros.toArray(),
              db.neuronios.toArray(),
              db.conexoes.toArray(),
              db.etiquetas.toArray(),
              db.vagas.toArray(),
              db.enfeites.toArray(),
              db.anexos.toArray(),
              db.arquivos.toArray(),
            ]),
        )
      const arquivoDe = new Map(arquivos.map((a) => [a.anexoId, a]))
      const mapa = (await db.meta.get('mapa')) as MapaGravado | undefined

      return {
        version: SNAPSHOT_VERSION,
        exportedAt: new Date().toISOString(),
        livros: livros.map(livroToSnapshot),
        neuronios: neuronios.map(neuronioToSnapshot),
        conexoes: conexoes.map(conexaoToSnapshot),
        etiquetas,
        vagas,
        enfeites,
        anexos: anexos.map((a) => anexoToSnapshot(a, arquivoDe.get(a.id))),
        ...(mapa ? { mapa: { ilhas: mapa.ilhas } } : {}),
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
      // No porto (sem livro) não é órfão: é um neurônio esperando escolha.
      const orfao = neuronios.find((n) => n.livroId !== null && !livroIds.has(n.livroId))
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

      // A cor do arquivo vai ao tom mais próximo da paleta, como a do livro.
      const enfeites = parsed.enfeites.map((e) =>
        enfeiteSchema.parse({ ...e, cor: corMaisProxima(e.cor) }),
      )

      const acervo = parsed.anexos.map(anexoFromSnapshot)
      const anexos = acervo.map(({ anexo }) => anexoSchema.parse(anexo))
      const arquivos = acervo.flatMap(({ anexo, arquivo }) =>
        arquivo ? [arquivoSchema.parse({ anexoId: anexo.id, ...arquivo })] : [],
      )
      const perdido = anexos.find((a) => !livroIds.has(a.livroId))
      if (perdido) {
        throw new Error(
          `snapshot inválido: anexo ${perdido.id} aponta para o livro inexistente ${perdido.livroId}`,
        )
      }

      // bulkPut por id: reimportar o mesmo snapshot não duplica nada.
      await db.transaction(
        'rw',
        [
          db.livros,
          db.neuronios,
          db.conexoes,
          db.meta,
          db.etiquetas,
          db.vagas,
          db.enfeites,
          db.anexos,
          db.arquivos,
        ],
        async () => {
          // O livro do arquivo fica no lugar dele; o que só existe aqui fica no
          // seu, se ainda estiver livre — o mesmo "arquivo vence" de título e cor.
          const soAqui = (await db.livros.toArray()).filter((l) => !livroIds.has(l.id))
          const unidos = juntarPorLugar(livros, soAqui)

          await db.livros.bulkPut(unidos)
          await db.neuronios.bulkPut(neuronios)
          await db.conexoes.bulkPut(conexoes)
          // Os vínculos não vêm no arquivo: quem importa reprocessa, e a
          // reancoragem refaz todos com o perfil do palácio que ficou.
          await db.anexos.bulkPut(anexos)
          await db.arquivos.bulkPut(arquivos)
          // A etiqueta do arquivo vence a que já existia na mesma prateleira;
          // etiqueta que só existe aqui não é apagada.
          await db.etiquetas.bulkPut(parsed.etiquetas)

          // As vagas fundem do mesmo jeito — e nenhuma, daqui ou do arquivo,
          // sobrevive embaixo de um livro.
          const ocupados = new Set(unidos.map(chaveDoLugar))
          await db.vagas.bulkPut(parsed.vagas)
          const soterradas = (await db.vagas.toArray()).filter((v) => ocupados.has(chaveDoLugar(v)))
          await db.vagas.bulkDelete(soterradas.map(chaveDaVaga))

          // Os enfeites gravados fundem igual: o do arquivo vence o daqui no mesmo
          // lugar, e nenhum sobrevive embaixo de um livro.
          await db.enfeites.bulkPut(enfeites)
          const soterrados = (await db.enfeites.toArray()).filter((e) =>
            ocupados.has(chaveDoLugar(e)),
          )
          await db.enfeites.bulkDelete(soterrados.map(chaveDoEnfeite))

          // Um backup de um palácio com mais prateleiras não pode esconder livro
          // numa prateleira que este aparelho ainda não tem.
          const maiorPrateleira = Math.max(-1, ...unidos.map((l) => l.prateleira)) + 1
          const atual = (await db.meta.get('preferencias')) as PreferenciasGravadas | undefined
          if (maiorPrateleira > (atual?.quantidadeDePrateleiras ?? MINIMO_DE_PRATELEIRAS)) {
            await db.meta.put(await preferenciasCom({ quantidadeDePrateleiras: maiorPrateleira }))
          }

          // O mapa do arquivo volta como estava; o daqui encaixa em volta.
          if (parsed.mapa) {
            const local = (await db.meta.get('mapa')) as MapaGravado | undefined
            const fundido = fundirMapas(local ? { ilhas: local.ilhas } : MAPA_VAZIO, parsed.mapa)
            const gravado: MapaGravado = { chave: 'mapa', ilhas: fundido.ilhas }
            await db.meta.put(gravado)
          }
        },
      )
    },

    async clear() {
      const tabelas = [
        db.livros,
        db.neuronios,
        db.conexoes,
        db.meta,
        db.etiquetas,
        db.vagas,
        db.enfeites,
        db.anexos,
        db.arquivos,
        db.vinculos,
      ]
      await db.transaction('rw', tabelas, async () => {
        await Promise.all(tabelas.map((t) => t.clear()))
      })
    },
  }
}

export const palacioRepo = createDexieRepo()
