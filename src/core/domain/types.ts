/**
 * Tipos de domínio do Palácio Mental.
 *
 * Este arquivo é o coração do núcleo puro: nada aqui pode depender de DOM,
 * Dexie, React ou transformers.js. Ele é o que sobrevive a uma reescrita da UI
 * e o que seria traduzido quase linha a linha para Kotlin num app nativo.
 */

export type Id = string

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
   * O lugar DENTRO da prateleira: 0 é o primeiro da esquerda, e vai até
   * `LUGARES_POR_PRATELEIRA` - 1 (ver `ordem.ts`).
   *
   * Gravado, e não derivado de nada, porque quem decide é a pessoa arrastando
   * o livro — e um palácio da memória precisa devolver cada coisa no canto em
   * que foi deixada.
   *
   * **Esparso** desde 14/09/2026: pode haver lugar vazio entre dois livros. Até
   * então era denso (0..N-1 da prateleira), e todo valor denso continua sendo
   * um lugar válido — por isso não houve migração de dado.
   */
  ordem: number
  /**
   * Ícone opcional na lombada, além da cor — para diferenciar livros parecidos
   * sem depender só do nome. `null` é "nenhum". As chaves reconhecidas vivem
   * em `features/estante/EmblemaDaLombada.tsx`; uma chave que esse switch não
   * reconhece mais simplesmente não desenha nada, em vez de quebrar.
   */
  emblema: string | null
  /**
   * Largura da lombada em px, escolhida na mão. `null` é "automática": varia
   * com a semente do id, como sempre (ver `features/estante/prateleiras.ts`).
   */
  larguraLombada: number | null
  /**
   * Altura da lombada em % da fileira, escolhida na mão. `null` é
   * "automática": a quantidade de neurônios do livro, como sempre (ver
   * `features/estante/resumo.ts` e `Lombada.tsx`).
   *
   * Pedido explícito do usuário (14/09/2026), sabendo do custo: por padrão a
   * altura é a única métrica que a estante mostra sem abrir nada (ver
   * CLAUDE.md, "A estante"), e um livro com altura escolhida na mão deixa de
   * comunicar isso — fica visualmente idêntico a um livro cheio de conteúdo.
   */
  comprimentoLombada: number | null
  createdAt: Date
}

/**
 * Um lugar da prateleira deixado **aberto** — madeira nua, sem livro e sem
 * enfeite.
 *
 * Os enfeites (as lombadas escuras sem título) são cenário: todo lugar sem
 * livro mostra um, a não ser que haja uma vaga gravada ali. Por isso a tabela
 * guarda os buracos, e não os enfeites — são poucos, e a estante continua
 * cheia por padrão, inclusive numa prateleira que acabou de ser criada.
 *
 * Nasce quando um livro sai do lugar (mover ou apagar: "nada anda sozinho") e
 * quando a pessoa tira o enfeite; some quando um livro ou um enfeite volta a
 * ocupar o lugar.
 */
export interface Vaga {
  prateleira: number
  /** O mesmo espaço de `Livro.ordem`: o lugar na prateleira. */
  ordem: number
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
  /**
   * Ausente em backups de antes de 14/09/2026 (lugares fixos) — o import trata
   * como `[]`. Funde como as etiquetas: a vaga do arquivo entra, a que só existe
   * aqui fica, e nenhuma sobrevive embaixo de um livro.
   */
  vagas?: Vaga[] | undefined
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
  /** Ausente em backups anteriores à Fase 19 — o import trata como `null`. */
  larguraLombada?: number | null | undefined
  /** Ausente em backups de antes de 14/09/2026 — o import trata como `null`. */
  comprimentoLombada?: number | null | undefined
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
