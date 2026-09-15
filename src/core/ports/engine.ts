import type { NeuronioNaTela } from '../domain/tela'
import type { Conexao, Id, Livro, Vaga } from '../domain/types'
import type { Ponto } from '../motor/redeLayout'

export interface CriarNeuronioInput {
  /**
   * Gerado por quem chama, não pelo motor.
   *
   * É o que torna o otimismo possível sem inventar correlação: a tela insere o
   * neurônio com este id antes de a inferência começar, e depois só substitui.
   */
  id: Id
  livroId: Id
  titulo: string
  conteudo: string
}

export type EditarNeuronioInput = CriarNeuronioInput

export interface CriarLivroInput {
  /** Gerado por quem chama, pelo mesmo motivo do neurônio: é o que deixa a tela ser otimista. */
  id: Id
  titulo: string
  cor: string
  /** Em qual prateleira a pessoa tocou "criar". */
  prateleira: number
  /**
   * Em qual lugar dela. Ausente, o livro nasce no primeiro lugar sem livro; se
   * o lugar tiver outro livro, empurra como mover (ver `moverLivroNaEstante`).
   */
  lugar?: number | undefined
  emblema?: string | null
  larguraLombada?: number | null
  comprimentoLombada?: number | null
}

export interface EditarLivroInput {
  id: Id
  titulo: string
  cor: string
  emblema: string | null
  larguraLombada: number | null
  comprimentoLombada: number | null
}

/** O que a estante grava além do grafo: onde cada livro está e os lugares deixados abertos. */
export interface EstanteGravada {
  livros: Livro[]
  vagas: Vaga[]
}

export interface EstadoDoPalacio {
  livros: Livro[]
  vagas: Vaga[]
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  /** Quantas prateleiras a estante tem — gravado, ajustável em Ajustes. */
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /**
   * Onde a Rede organizou cada neurônio da última vez — por significado, não
   * por livro (Fase 23-2). `{}` num palácio que nunca foi organizado.
   */
  posicoesDaRede: Readonly<Record<Id, Ponto>>
}

export interface ResultadoDeEscrita {
  /** O neurônio escrito, para quem quiser destacá-lo. */
  neuronio: NeuronioNaTela
  /**
   * O palácio inteiro depois da escrita — a tela troca o que tem pelo que veio.
   *
   * Inclui `neuronios` porque uma escrita pode disparar um reprocessamento, e aí
   * os *outros* neurônios também mudam (deixam de estar processando). Devolver só
   * o que foi escrito deixaria o resto da tela mentindo.
   */
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  /** A Rede se reacomoda junto — o novo neurônio nasce perto de quem ele conversa. */
  posicoesDaRede: Readonly<Record<Id, Ponto>>
}

/** Só o que a tela precisa mostrar enquanto espera. */
export type ProgressoDoMotor =
  | { tipo: 'modelo'; arquivo: string; pct: number }
  | { tipo: 'modeloPronto' }
  | { tipo: 'reprocessando'; feitos: number; total: number }

/**
 * A fachada que a UI enxerga. Hoje despacha para um Web Worker; no nativo, para
 * uma thread nativa. A UI não muda — e nunca chama `worker.postMessage`.
 *
 * Nenhum método devolve `embedding`: o vetor não atravessa a fronteira, porque a
 * tela não tem o que fazer com ele e são ~1,5 KB por neurônio.
 */
export interface ConnectionEngine {
  /** Semeia na primeira vez e devolve o palácio inteiro. */
  carregar(): Promise<EstadoDoPalacio>
  criarNeuronio(input: CriarNeuronioInput): Promise<ResultadoDeEscrita>
  editarNeuronio(input: EditarNeuronioInput): Promise<ResultadoDeEscrita>
  apagarNeuronio(id: Id): Promise<EstadoDoPalacio>

  /** Livro não mexe no grafo: devolve só a estante, já com o livro no lugar. */
  criarLivro(input: CriarLivroInput): Promise<EstanteGravada>
  /** Trocar nome ou pano não muda nenhuma conexão — `cross` depende do id, não da cor. */
  editarLivro(input: EditarLivroInput): Promise<Livro[]>
  /**
   * Apaga o livro, os neurônios dele e os fios que os tocavam, e reprocessa:
   * pelo mesmo motivo de apagar um neurônio, alguém pode ter perdido o único
   * vizinho que tinha.
   */
  apagarLivro(id: Id): Promise<EstadoDoPalacio>
  /**
   * Põe um livro no lugar `(prateleira, lugar)`. Lugar sem livro: só ele se
   * move. Com livro: empurra até o buraco mais perto — a "bandeja de apps do
   * Android". O lugar de onde saiu fica aberto.
   */
  moverLivro(id: Id, prateleira: number, lugar: number): Promise<EstanteGravada>
  /** Tira o enfeite de um lugar sem livro, deixando a madeira à mostra. */
  tirarEnfeite(prateleira: number, lugar: number): Promise<Vaga[]>
  /** Põe um enfeite de volta num lugar aberto. */
  porEnfeite(prateleira: number, lugar: number): Promise<Vaga[]>
  /**
   * Quantas prateleiras a estante tem. Recusa diminuir se sobrar livro numa
   * prateleira que deixaria de existir — mova os livros antes.
   */
  definirQuantidadeDePrateleiras(quantidade: number): Promise<number>
  /** Grava a intensidade da luz (0-100), sempre recortada para essa faixa. */
  definirIntensidadeDaLuz(valor: number): Promise<number>
  /**
   * Arrastar um neurônio: onde o dedo soltou vira a âncora dele, e a mesma
   * física de sempre (partida quente, poucas iterações) deixa a vizinhança
   * reagir a partir daí — sem tocar em conexões, só no layout.
   */
  moverNeuronioNaRede(id: Id, ponto: Ponto): Promise<Readonly<Record<Id, Ponto>>>
  /** Devolve a função que cancela a inscrição. */
  aoProgredir(ouvinte: (p: ProgressoDoMotor) => void): () => void
}
