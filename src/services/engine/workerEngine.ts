import type {
  ConnectionEngine,
  CriarLivroInput,
  CriarNeuronioInput,
  CriterioDeOrdenacao,
  EditarLivroInput,
  EditarNeuronioInput,
  EstadoDoPalacio,
  Id,
  Livro,
  ProgressoDoMotor,
  ResultadoDeEscrita,
} from '@/core'

import type { DoMotor, ParaMotor, RespostasDoMotor, TipoDePedido } from './protocolo'

interface Pendente {
  resolver: (dados: unknown) => void
  rejeitar: (erro: Error) => void
}

/**
 * A fachada. É o único lugar do app que sabe que existe um Worker.
 *
 * Trocar isto por uma ponte para thread nativa é trocar este arquivo — a store e
 * as telas continuam falando com `ConnectionEngine`.
 */
export function criarWorkerEngine(): ConnectionEngine {
  const worker = new Worker(new URL('./motor.worker.ts', import.meta.url), { type: 'module' })

  const pendentes = new Map<number, Pendente>()
  const ouvintes = new Set<(p: ProgressoDoMotor) => void>()
  let proximoId = 0

  worker.addEventListener('message', (evento: MessageEvent<DoMotor>) => {
    const msg = evento.data

    if ('progresso' in msg) {
      for (const o of ouvintes) o(msg.progresso)
      return
    }

    const pendente = pendentes.get(msg.req)
    if (!pendente) return
    pendentes.delete(msg.req)

    if (msg.ok) pendente.resolver(msg.dados)
    else pendente.rejeitar(new Error(msg.erro))
  })

  worker.addEventListener('error', (e) => {
    const erro = new Error(`motor caiu: ${e.message}`)
    for (const p of pendentes.values()) p.rejeitar(erro)
    pendentes.clear()
  })

  function pedir<T extends TipoDePedido>(
    msg: Omit<Extract<ParaMotor, { tipo: T }>, 'req'>,
  ): Promise<RespostasDoMotor[T]> {
    const req = proximoId++

    return new Promise<RespostasDoMotor[T]>((resolve, reject) => {
      pendentes.set(req, {
        resolver: (dados) => {
          resolve(dados as RespostasDoMotor[T])
        },
        rejeitar: reject,
      })
      worker.postMessage({ ...msg, req })
    })
  }

  return {
    carregar: (): Promise<EstadoDoPalacio> => pedir<'carregar'>({ tipo: 'carregar' }),

    criarNeuronio: (input: CriarNeuronioInput): Promise<ResultadoDeEscrita> =>
      pedir<'criarNeuronio'>({ tipo: 'criarNeuronio', input }),

    editarNeuronio: (input: EditarNeuronioInput): Promise<ResultadoDeEscrita> =>
      pedir<'editarNeuronio'>({ tipo: 'editarNeuronio', input }),

    apagarNeuronio: (neuronioId: Id): Promise<EstadoDoPalacio> =>
      pedir<'apagarNeuronio'>({ tipo: 'apagarNeuronio', neuronioId }),

    reprocessarTudo: (): Promise<EstadoDoPalacio> =>
      pedir<'reprocessarTudo'>({ tipo: 'reprocessarTudo' }),

    criarLivro: (input: CriarLivroInput): Promise<Livro[]> =>
      pedir<'criarLivro'>({ tipo: 'criarLivro', input }),

    editarLivro: (input: EditarLivroInput): Promise<Livro[]> =>
      pedir<'editarLivro'>({ tipo: 'editarLivro', input }),

    apagarLivro: (livroId: Id): Promise<EstadoDoPalacio> =>
      pedir<'apagarLivro'>({ tipo: 'apagarLivro', livroId }),

    moverLivro: (id: Id, prateleira: number, posicao: number): Promise<Livro[]> =>
      pedir<'moverLivro'>({ tipo: 'moverLivro', id, prateleira, posicao }),

    definirQuantidadeDePrateleiras: (quantidade: number): Promise<number> =>
      pedir<'definirQuantidadeDePrateleiras'>({
        tipo: 'definirQuantidadeDePrateleiras',
        quantidade,
      }),

    ordenarEstante: (criterio: CriterioDeOrdenacao): Promise<Livro[]> =>
      pedir<'ordenarEstante'>({ tipo: 'ordenarEstante', criterio }),

    exportar: (): Promise<string> => pedir<'exportar'>({ tipo: 'exportar' }),

    importar: (json: string): Promise<EstadoDoPalacio> =>
      pedir<'importar'>({ tipo: 'importar', json }),

    aoProgredir(ouvinte) {
      ouvintes.add(ouvinte)
      return () => ouvintes.delete(ouvinte)
    },
  }
}

export const engine: ConnectionEngine = criarWorkerEngine()
