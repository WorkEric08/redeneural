import type {
  CriarLivroInput,
  CriarNeuronioInput,
  EditarLivroInput,
  EditarNeuronioInput,
  EstadoDoPalacio,
  Id,
  Livro,
  ProgressoDoMotor,
  ResultadoDeEscrita,
} from '@/core'

/**
 * O que atravessa a fronteira do Worker.
 *
 * Nenhuma mensagem carrega `embedding`: o vetor fica do lado de lá, junto do
 * banco e do modelo. É o mesmo contrato que uma thread nativa cumpriria.
 */
export interface RespostasDoMotor {
  carregar: EstadoDoPalacio
  criarNeuronio: ResultadoDeEscrita
  editarNeuronio: ResultadoDeEscrita
  apagarNeuronio: EstadoDoPalacio
  reprocessarTudo: EstadoDoPalacio
  criarLivro: Livro[]
  editarLivro: Livro[]
  apagarLivro: EstadoDoPalacio
  reordenarLivros: Livro[]
  exportar: string
  importar: EstadoDoPalacio
}

export type TipoDePedido = keyof RespostasDoMotor

export type ParaMotor =
  | { req: number; tipo: 'carregar' }
  | { req: number; tipo: 'criarNeuronio'; input: CriarNeuronioInput }
  | { req: number; tipo: 'editarNeuronio'; input: EditarNeuronioInput }
  | { req: number; tipo: 'apagarNeuronio'; neuronioId: Id }
  | { req: number; tipo: 'reprocessarTudo' }
  | { req: number; tipo: 'criarLivro'; input: CriarLivroInput }
  | { req: number; tipo: 'editarLivro'; input: EditarLivroInput }
  | { req: number; tipo: 'apagarLivro'; livroId: Id }
  | { req: number; tipo: 'reordenarLivros'; ids: Id[] }
  | { req: number; tipo: 'exportar' }
  | { req: number; tipo: 'importar'; json: string }

export type DoMotor =
  | { req: number; ok: true; dados: RespostasDoMotor[TipoDePedido] }
  | { req: number; ok: false; erro: string }
  | { progresso: ProgressoDoMotor }
