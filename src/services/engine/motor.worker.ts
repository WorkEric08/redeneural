/// <reference lib="webworker" />
import {
  arestaParaConexao,
  construirGrafo,
  estadoDosVizinhos,
  nosDeNeuronios,
  novoLivro,
  novoNeuronio,
  OPCOES_PADRAO,
  paraTela,
  perfilDoPalacio,
  primeiroLugarLivre,
  recalcularVizinhanca,
  SEM_RERANK,
  textoDoNeuronio,
  type CriarLivroInput,
  type CriarNeuronioInput,
  type EditarLivroInput,
  type EstadoDoPalacio,
  type EstanteGravada,
  type Id,
  type Livro,
  type Neuronio,
  type NoDoGrafo,
  type PalacioRepo,
  type PerfilDoPalacio,
  type PontuarPar,
  type ProgressoDoMotor,
  type ResultadoDeEscrita,
} from '@/core'
import { seedPalacio } from '@/features/palacio/seed'
import { criarTransformersEmbedding } from '@/services/inferencia/transformersEmbedding'
import { palacioRepo } from '@/services/repo/dexieRepo'

import type { DoMotor, ParaMotor } from './protocolo'

const escopo = self as unknown as DedicatedWorkerGlobalScope

function avisar(progresso: ProgressoDoMotor): void {
  const msg: DoMotor = { progresso }
  escopo.postMessage(msg)
}

const repo: PalacioRepo = palacioRepo

const embedding = criarTransformersEmbedding({
  aoBaixar: (arquivo, pct) => {
    avisar({ tipo: 'modelo', arquivo, pct })
  },
})

/**
 * v1 roda só com embedding — decisão do "Ajuste de escopo" (11/09/2026): com
 * neurônios de texto longo o embedding já carrega sinal suficiente, e o
 * reranker (`RerankProvider`, `rerankDesligado.ts`) fica reservado para
 * reativar depois se aparecer falso positivo real no uso. `construirGrafo` e
 * `recalcularVizinhanca` continuam aceitando `PontuarPar` de propósito — é o
 * que torna a reativação uma troca desta constante, não uma refatoração.
 */
const pontuar: PontuarPar = SEM_RERANK

/**
 * Quando vale a pena refazer o palácio inteiro em vez de só a vizinhança.
 *
 * O perfil (centroide, limiares, escala) fica congelado entre reprocessamentos —
 * é o que garante que um neurônio novo não reembaralhe os outros. Mas um perfil
 * tirado de 2 neurônios não descreve um palácio de 40, e ficaria congelado para
 * sempre se ninguém mandasse refazer.
 *
 * Reprocessar é barato porque **não recalcula embedding**: os vetores já estão
 * gravados, sobra a matemática. Com esta regra isso acontece muito no começo, e
 * cada vez mais raramente conforme o palácio cresce.
 */
const CRESCIMENTO_ATE_REPROCESSAR = 1.5

async function estadoAtual(): Promise<EstadoDoPalacio> {
  const [livros, vagas, neuronios, conexoes, quantidadeDePrateleiras, intensidadeDaLuz] =
    await Promise.all([
      repo.listLivros(),
      repo.listVagas(),
      repo.listNeuronios(),
      repo.listConexoes(),
      repo.getQuantidadeDePrateleiras(),
      repo.getIntensidadeDaLuz(),
    ])

  return {
    livros,
    vagas,
    neuronios: neuronios.map(paraTela),
    conexoes,
    quantidadeDePrateleiras,
    intensidadeDaLuz,
  }
}

/** Calcula e grava o embedding que faltava. Devolve o neurônio já com vetor. */
async function embutir(n: Neuronio): Promise<Neuronio> {
  const vetor = await embedding.embed(textoDoNeuronio(n))
  const completo: Neuronio = { ...n, embedding: vetor, updatedAt: new Date() }
  await repo.upsertNeuronio(completo)
  return completo
}

async function perfilVigente(nos: readonly NoDoGrafo[]): Promise<PerfilDoPalacio | null> {
  const gravado = await repo.getPerfil()
  if (!gravado) return null

  const cresceuDemais = nos.length > gravado.limiarPorNo.size * CRESCIMENTO_ATE_REPROCESSAR
  return cresceuDemais ? null : gravado
}

async function reprocessarTudo(): Promise<EstadoDoPalacio> {
  const neuronios = await repo.listNeuronios()
  const semVetor = neuronios.filter((n) => n.embedding === null)

  // Só quem nunca foi processado passa pelo modelo. O vetor é salvo junto do
  // neurônio e nunca recalculado ao recarregar.
  if (semVetor.length > 0) {
    await embedding.ready()
    avisar({ tipo: 'modeloPronto' })

    for (const [i, n] of semVetor.entries()) {
      await embutir(n)
      avisar({ tipo: 'reprocessando', feitos: i + 1, total: semVetor.length })
    }
  }

  const nos = nosDeNeuronios(await repo.listNeuronios())
  const perfil = perfilDoPalacio(nos, OPCOES_PADRAO)
  const arestas = await construirGrafo(nos, pontuar, OPCOES_PADRAO, perfil)
  const agora = new Date()

  await repo.replaceTodasConexoes(arestas.map((a) => arestaParaConexao(a, agora)))
  await repo.setPerfil(perfil, nos.length)

  return estadoAtual()
}

/** Cria ou edita: os dois caminhos terminam no mesmo recálculo. */
async function escrever(
  input: CriarNeuronioInput,
  existente: Neuronio | undefined,
): Promise<ResultadoDeEscrita> {
  const agora = new Date()
  const base: Neuronio = existente
    ? {
        ...existente,
        titulo: input.titulo.trim(),
        conteudo: input.conteudo.trim(),
        livroId: input.livroId,
        embedding: null,
        updatedAt: agora,
      }
    : novoNeuronio(input, agora)

  // Persiste o texto antes de a inferência começar: se o Worker morrer agora,
  // o que se perde é o cálculo, nunca o que a pessoa escreveu.
  await repo.upsertNeuronio(base)

  await embedding.ready()
  avisar({ tipo: 'modeloPronto' })
  const completo = await embutir(base)

  const nos = nosDeNeuronios(await repo.listNeuronios())
  const perfil = await perfilVigente(nos)

  if (!perfil) {
    const estado = await reprocessarTudo()
    const naTela = estado.neuronios.find((n) => n.id === completo.id)
    if (!naTela) throw new Error(`neurônio ${completo.id} sumiu no reprocessamento`)
    return { neuronio: naTela, neuronios: estado.neuronios, conexoes: estado.conexoes }
  }

  const vizinhancas = estadoDosVizinhos(await repo.listConexoes())
  const resultado = await recalcularVizinhanca(
    completo.id,
    nos,
    vizinhancas,
    perfil,
    pontuar,
    OPCOES_PADRAO,
  )

  await repo.soltarMarcas(resultado.marcasPerdidas)
  await repo.replaceConexoesDe(
    completo.id,
    resultado.arestas.map((a) => arestaParaConexao(a, new Date())),
  )

  const depois = await estadoAtual()
  return { neuronio: paraTela(completo), neuronios: depois.neuronios, conexoes: depois.conexoes }
}

/**
 * Apagar mexe na vizinhança de quem ficou — alguém pode ter perdido o único
 * vizinho que tinha. Reprocessar é a resposta simples e sempre correta, e apagar
 * é raro o bastante para não valer nada mais esperto.
 */
async function apagarNeuronio(id: Id): Promise<EstadoDoPalacio> {
  await repo.deleteNeuronio(id)
  return reprocessarTudo()
}

async function estante(): Promise<EstanteGravada> {
  const [livros, vagas] = await Promise.all([repo.listLivros(), repo.listVagas()])
  return { livros, vagas }
}

async function criarLivro(input: CriarLivroInput): Promise<EstanteGravada> {
  // Nasce no lugar tocado, que a estante só oferece quando não tem livro. Se
  // outro livro chegou ali antes, fica no buraco mais perto — nascer nunca
  // empurra ninguém.
  const livros = await repo.listLivros()
  const lugar = primeiroLugarLivre(livros, input.prateleira, input.lugar ?? 0)
  if (lugar === null) {
    throw new Error(`a prateleira ${String(input.prateleira + 1)} não tem lugar sem livro`)
  }

  await repo.upsertLivro(novoLivro(input, new Date(), lugar))
  return estante()
}

async function editarLivro(input: EditarLivroInput): Promise<Livro[]> {
  const existente = await repo.getLivro(input.id)
  if (!existente) throw new Error(`livro ${input.id} não existe`)

  await repo.upsertLivro({
    ...existente,
    titulo: input.titulo.trim(),
    cor: input.cor,
    emblema: input.emblema,
    larguraLombada: input.larguraLombada,
    comprimentoLombada: input.comprimentoLombada,
  })
  return repo.listLivros()
}

/**
 * Livro vazio sai sem reprocessar: ninguém perdeu vizinho. Com neurônios dentro
 * é o mesmo caso de apagar um neurônio — e reprocessar à toa, num palácio que
 * ainda tem neurônio sem vetor, baixaria o modelo por nada.
 */
async function apagarLivro(id: Id): Promise<EstadoDoPalacio> {
  const tinhaNeuronios = (await repo.listNeuronios(id)).length > 0
  await repo.deleteLivro(id)
  return tinhaNeuronios ? reprocessarTudo() : estadoAtual()
}

async function moverLivro(id: Id, prateleira: number, lugar: number): Promise<EstanteGravada> {
  await repo.moverLivro(id, prateleira, lugar)
  return estante()
}

async function responder(msg: ParaMotor): Promise<DoMotor> {
  try {
    switch (msg.tipo) {
      case 'carregar':
        await seedPalacio(repo)
        return { req: msg.req, ok: true, dados: await estadoAtual() }

      case 'criarNeuronio':
        return { req: msg.req, ok: true, dados: await escrever(msg.input, undefined) }

      case 'editarNeuronio': {
        const existente = await repo.getNeuronio(msg.input.id)
        if (!existente) throw new Error(`neurônio ${msg.input.id} não existe`)
        return { req: msg.req, ok: true, dados: await escrever(msg.input, existente) }
      }

      case 'apagarNeuronio':
        return { req: msg.req, ok: true, dados: await apagarNeuronio(msg.neuronioId) }

      case 'criarLivro':
        return { req: msg.req, ok: true, dados: await criarLivro(msg.input) }

      case 'editarLivro':
        return { req: msg.req, ok: true, dados: await editarLivro(msg.input) }

      case 'apagarLivro':
        return { req: msg.req, ok: true, dados: await apagarLivro(msg.livroId) }

      case 'moverLivro':
        return {
          req: msg.req,
          ok: true,
          dados: await moverLivro(msg.id, msg.prateleira, msg.lugar),
        }

      case 'tirarEnfeite':
        await repo.abrirVaga({ prateleira: msg.prateleira, ordem: msg.lugar })
        return { req: msg.req, ok: true, dados: await repo.listVagas() }

      case 'porEnfeite':
        await repo.fecharVaga({ prateleira: msg.prateleira, ordem: msg.lugar })
        return { req: msg.req, ok: true, dados: await repo.listVagas() }

      case 'definirQuantidadeDePrateleiras':
        await repo.definirQuantidadeDePrateleiras(msg.quantidade)
        return { req: msg.req, ok: true, dados: msg.quantidade }

      case 'definirIntensidadeDaLuz':
        await repo.definirIntensidadeDaLuz(msg.valor)
        return { req: msg.req, ok: true, dados: await repo.getIntensidadeDaLuz() }
    }
  } catch (e) {
    return { req: msg.req, ok: false, erro: e instanceof Error ? e.message : String(e) }
  }
}

escopo.addEventListener('message', (evento: MessageEvent<ParaMotor>) => {
  void responder(evento.data).then((r) => {
    escopo.postMessage(r)
  })
})
