/**
 * Tipos de domínio do Palácio Mental.
 *
 * Este arquivo é o coração do núcleo puro: nada aqui pode depender de DOM,
 * Dexie, React ou transformers.js. Ele é o que sobrevive a uma reescrita da UI
 * e o que seria traduzido quase linha a linha para Kotlin num app nativo.
 */

export type Id = string

/**
 * Critério da ordenação automática da estante — um atalho de um toque, não o
 * padrão. O manual (`Livro.ordem`, `moverLivro`) continua sendo como a
 * estante se organiza; isto só reordena de uma vez o que já está aí.
 */
export type CriterioDeOrdenacao = 'nome' | 'criacao' | 'neuronios'

/** Uma área de conhecimento. Visualmente, uma lombada na estante. */
export interface Livro {
  id: Id
  titulo: string
  /** Cor da lombada, em hex (#rrggbb). */
  cor: string
  /**
   * Em qual prateleira o livro mora — gravado, e não calculado (desde a Fase
   * 10). Antes disso a prateleira era 100% derivada da posição na estante
   * inteira; virou campo próprio para permitir prateleira manual e soltar um
   * livro numa prateleira vazia sem redistribuir as outras.
   */
  prateleira: number
  /**
   * Lugar DENTRO da prateleira: 0 é o primeiro livro daquela prateleira.
   *
   * Gravado, e não derivado de nada, porque quem decide é a pessoa arrastando
   * o livro — e um palácio da memória precisa devolver cada coisa no canto em
   * que foi deixada. Denso por prateleira (0..N-1 daquela prateleira, não da
   * estante inteira).
   */
  ordem: number
  /**
   * Ícone opcional na lombada, além da cor — para diferenciar livros parecidos
   * sem depender só do nome. `null` é "nenhum". A chave vem de
   * `features/estante/emblemas.ts`; uma chave que essa lista não reconhece
   * mais simplesmente não desenha nada, em vez de quebrar.
   */
  emblema: string | null
  createdAt: Date
}

/**
 * O nome de uma prateleira — puramente visual. Não é um livro: não tem
 * neurônio, não entra no grafo, não participa da ordem dos livros. Uma
 * prateleira sem etiqueta simplesmente não tem registro aqui.
 */
export interface EtiquetaDePrateleira {
  prateleira: number
  texto: string
}

/** Um conceito dentro de um livro. */
export interface Neuronio {
  id: Id
  livroId: Id
  titulo: string
  conteudo: string
  /**
   * Vetor normalizado do texto, salvo junto do neurônio e nunca recalculado ao
   * recarregar. `null` enquanto a inferência não terminou — o neurônio é
   * persistido antes do Worker responder para que nada se perca num crash.
   */
  embedding: Float32Array | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Uma aresta entre dois neurônios, sempre com `aId < bId` para que o mesmo par
 * nunca gere duas linhas.
 */
export interface Conexao {
  id: Id
  aId: Id
  bId: Id
  /** Score fundido usado para ordenar e desenhar: `0.5 * emb + 0.5 * rr`. */
  score: number
  /** Componente de embedding, já na escala fixa 0..1. */
  emb: number
  /** Componente do reranker, 0..1. `null` quando o reranker não estava disponível. */
  rr: number | null
  /** Livros diferentes — a conexão dourada, o "achado". */
  cross: boolean
  /**
   * Qual dos dois lados mantém esta aresta na própria vizinhança.
   *
   * A aresta existe enquanto **qualquer** um dos dois a mantiver, então saber de
   * quem é a intenção é o que permite recalcular um neurônio sozinho sem
   * derrubar o que o vizinho ainda quer.
   */
  mantidaPorA: boolean
  mantidaPorB: boolean
  updatedAt: Date
}

/** O palácio inteiro num objeto serializável. Formato de export/import e de backup. */
export interface PalacioSnapshot {
  version: 1
  exportedAt: string
  livros: LivroSnapshot[]
  neuronios: NeuronioSnapshot[]
  conexoes: ConexaoSnapshot[]
  /**
   * Ausente em backups de antes da Fase 15 — o import trata como `[]`. Uma
   * etiqueta do arquivo vence a que já existia na mesma prateleira; etiqueta
   * que só existe aqui não é apagada.
   */
  etiquetas?: EtiquetaDePrateleira[] | undefined
}

export interface LivroSnapshot {
  id: Id
  titulo: string
  cor: string
  /**
   * Ausente em backups anteriores a 12/09/2026, quando a estante ainda não
   * guardava ordem. O import reconstrói a ordem daquela época a partir de
   * `createdAt` — ver `importAll`.
   */
  ordem?: number | undefined
  /**
   * Ausente em backups anteriores à Fase 10 (13-14/09/2026), quando a
   * prateleira ainda não era gravada. O import reconstrói prateleira e ordem
   * daquela época com a mesma distribuição automática que valia então — ver
   * `estanteAntiga.ts` e `importAll`.
   */
  prateleira?: number | undefined
  /** Ausente em backups anteriores à Fase 16 — o import trata como `null`. */
  emblema?: string | null | undefined
  createdAt: string
}

export interface NeuronioSnapshot {
  id: Id
  livroId: Id
  titulo: string
  conteudo: string
  /** Float32Array em base64 (little-endian), não array JSON. */
  embedding: string | null
  createdAt: string
  updatedAt: string
}

export interface ConexaoSnapshot {
  id: Id
  aId: Id
  bId: Id
  score: number
  emb: number
  rr: number | null
  cross: boolean
  mantidaPorA: boolean
  mantidaPorB: boolean
  updatedAt: string
}
