import type {
  CriarAnexoInput,
  CriarLivroInput,
  CriarNeuronioInput,
  EditarAnexoInput,
  EditarLivroInput,
  EditarNeuronioInput,
  EstadoDoPalacio,
  EstanteGravada,
  Id,
  Livro,
  MapaDoPalacio,
  ModoDaBusca,
  ModoDaRede,
  NeuronioGuardado,
  Ponto,
  ProgressoDoMotor,
  ResultadoDeEscrita,
  Vaga,
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
  guardarNeuronio: NeuronioGuardado
  criarLivro: EstanteGravada
  editarLivro: Livro[]
  apagarLivro: EstadoDoPalacio
  moverLivro: EstanteGravada
  tirarEnfeite: Vaga[]
  porEnfeite: Vaga[]
  definirQuantidadeDePrateleiras: number
  definirIntensidadeDaLuz: number
  definirModoDaBusca: ModoDaBusca
  definirModoDaRede: ModoDaRede
  reorganizarMapa: MapaDoPalacio
  moverNeuronioNaRede: Readonly<Record<Id, Ponto>>
  criarAnexo: EstadoDoPalacio
  editarAnexo: EstadoDoPalacio
  apagarAnexo: EstadoDoPalacio
  /** Os bytes vêm só aqui, a pedido — nunca junto do estado. */
  lerImagem: Uint8Array | null
  buscarPorSentido: Id[]
}

export type TipoDePedido = keyof RespostasDoMotor

export type ParaMotor =
  | { req: number; tipo: 'carregar' }
  | { req: number; tipo: 'criarNeuronio'; input: CriarNeuronioInput }
  | { req: number; tipo: 'editarNeuronio'; input: EditarNeuronioInput }
  | { req: number; tipo: 'apagarNeuronio'; neuronioId: Id }
  | { req: number; tipo: 'guardarNeuronio'; id: Id; livroId: Id }
  | { req: number; tipo: 'criarLivro'; input: CriarLivroInput }
  | { req: number; tipo: 'editarLivro'; input: EditarLivroInput }
  | { req: number; tipo: 'apagarLivro'; livroId: Id }
  | { req: number; tipo: 'moverLivro'; id: Id; prateleira: number; lugar: number }
  | { req: number; tipo: 'tirarEnfeite'; prateleira: number; lugar: number }
  | { req: number; tipo: 'porEnfeite'; prateleira: number; lugar: number }
  | { req: number; tipo: 'definirQuantidadeDePrateleiras'; quantidade: number }
  | { req: number; tipo: 'definirIntensidadeDaLuz'; valor: number }
  | { req: number; tipo: 'definirModoDaBusca'; modo: ModoDaBusca }
  | { req: number; tipo: 'definirModoDaRede'; modo: ModoDaRede }
  | { req: number; tipo: 'reorganizarMapa' }
  | { req: number; tipo: 'moverNeuronioNaRede'; id: Id; ponto: Ponto }
  | { req: number; tipo: 'criarAnexo'; input: CriarAnexoInput }
  | { req: number; tipo: 'editarAnexo'; input: EditarAnexoInput }
  | { req: number; tipo: 'apagarAnexo'; anexoId: Id }
  | { req: number; tipo: 'lerImagem'; anexoId: Id; tamanho: 'miniatura' | 'inteira' }
  | { req: number; tipo: 'buscarPorSentido'; consulta: string }

export type DoMotor =
  | { req: number; ok: true; dados: RespostasDoMotor[TipoDePedido] }
  | { req: number; ok: false; erro: string }
  | { progresso: ProgressoDoMotor }
