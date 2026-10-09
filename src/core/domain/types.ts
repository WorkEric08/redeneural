/**
 * Tipos de domínio do Palácio Mental.
 *
 * Este arquivo é o coração do núcleo puro: nada aqui pode depender de DOM,
 * Dexie, React ou transformers.js. Ele é o que sobrevive a uma reescrita da UI
 * e o que seria traduzido quase linha a linha para Kotlin num app nativo.
 */

import type { MapaDoPalacio } from '../motor/mapa'

import type { EstiloDaLombada } from './paletaNoite'

export type Id = string

/**
 * `conceitos` guarda neurônios; `acervo` é uma pasta de links e imagens (ver
 * `Anexo`). Escolhido ao criar e nunca trocado: um livro que mudasse de tipo
 * com coisa dentro deixaria tudo o que tem no lugar errado.
 */
export type TipoDeLivro = 'conceitos' | 'acervo'

/**
 * Como o livro está na prateleira (08/10/2026): de pé, com a lombada para fora, ou deitado, com
 * o livro girado e empilhável. Uma pilha só tem livros deitados, e um lugar com livro de pé tem
 * só ele (ver `ordem.ts`).
 */
export type OrientacaoDoLivro = 'em-pe' | 'deitado'

/**
 * O andamento de uma ideia num livro executável (01/10/2026). Só tem sentido
 * ali: fora de um livro executável o estado fica guardado, mas nada o mostra.
 */
export type EstadoDaIdeia = 'para_fazer' | 'fazendo' | 'feita'

/** Uma área de conhecimento. Visualmente, uma lombada na estante. */
export interface Livro {
  id: Id
  tipo: TipoDeLivro
  titulo: string
  /** Cor da lombada, em hex (#rrggbb): um dos 10 tons de `PALETA_NOITE`. */
  cor: string
  /** A forma da lombada na estante (estilo Noite, 06/10/2026). */
  estilo: EstiloDaLombada
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
  /** De pé ou deitado. Um livro deitado troca largura e comprimento de eixo (ver `Lombada.tsx`). */
  orientacao: OrientacaoDoLivro
  /**
   * A posição do livro deitado **dentro da pilha do lugar**: 0 é o de baixo. Só serve para
   * ordenar (lacunas não importam: apagar ou tirar um livro do meio da pilha não renumera ninguém),
   * e num livro de pé fica 0.
   */
  nivel: number
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
  /**
   * Um livro de ideias para executar — textos, estudos, vídeos (01/10/2026).
   * Só livro de conceitos: uma pasta de acervo nunca é executável. É um campo
   * à parte, e não um terceiro `tipo`, porque continua sendo um livro de
   * conceitos em tudo: conexões, pontes, Rede e Mapa.
   *
   * O Porto nunca guarda nada aqui sozinho: a ideia só entra por escolha.
   */
  executavel: boolean
  /** Quantos dias parada uma ideia deste livro leva para adormecer. */
  diasParaAdormecer: number
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
 * Um enfeite que a pessoa definiu ou moveu (07/10/2026). Antes dele o enfeite
 * não existia no banco: todo lugar sem livro e sem vaga mostrava um, sorteado
 * pelo lugar. Um registro aqui vence o sorteio daquele lugar — o enfeite
 * continua sendo só visual (sem título, sem neurônio, fora do grafo), mas tem
 * cor, forma e medidas como um livro.
 *
 * Nunca embaixo de um livro, como a vaga: nasce quando a pessoa edita ou move
 * um enfeite, e some quando um livro chega ao lugar ou ela tira o enfeite.
 */
export interface EnfeiteGravado {
  prateleira: number
  /** O mesmo espaço de `Livro.ordem`: o lugar na prateleira. */
  ordem: number
  /** Um dos 10 tons de `PALETA_NOITE`, como o livro. */
  cor: string
  estilo: EstiloDaLombada
  /** Em px. `null` é "a do sorteio deste lugar". */
  larguraLombada: number | null
  /** Em % da fileira. `null` é "a do sorteio deste lugar". */
  comprimentoLombada: number | null
  /** Os filetes dourados de acabamento. */
  dourado: boolean
  /**
   * Os detalhes da forma (faixa, fio) em azul mais escuro que o fundo, em vez
   * do tom claro de um livro: é o acabamento do enfeite sorteado, que um enfeite
   * movido sem mudança de cor ou forma mantém. Escolher cor ou forma de novo o
   * desliga — aí ele é desenhado como um livro.
   */
  detalheEscuro: boolean
}

/** O que viaja com o enfeite quando ele muda de lugar. */
export type DadosDoEnfeite = Omit<EnfeiteGravado, 'prateleira' | 'ordem'>

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
  /**
   * `null` é o porto: um neurônio novo que o motor não soube onde guardar e
   * que espera a pessoa escolher. Nunca se perde — só não tem livro ainda.
   */
  livroId: Id | null
  titulo: string
  conteudo: string
  /**
   * Vetor normalizado do texto, salvo junto do neurônio e nunca recalculado ao
   * recarregar. `null` enquanto a inferência não terminou — o neurônio é
   * persistido antes do Worker responder para que nada se perca num crash.
   */
  embedding: Float32Array | null
  /**
   * O andamento, num livro executável. `null` em quem nunca entrou num; quem
   * sai de um guarda o que tinha, sem mostrar — e entrar de novo recomeça em
   * "para fazer".
   */
  estado: EstadoDaIdeia | null
  /**
   * A última vez que a ideia foi mexida de verdade — criada, levada a um livro
   * executável, mudada de estado. É o relógio de quem adormece.
   */
  ultimoToque: Date
  /** O link do que saiu dela, quando está feita. Só http e https. */
  resultadoLink: string | null
  /**
   * A imagem do que saiu dela, quando está feita (07/10/2026): só o que a tela precisa
   * saber; os bytes moram à parte, como os do anexo (ver `ArquivoDoAnexo`).
   */
  resultadoImagem: ImagemDoResultado | null
  createdAt: Date
  updatedAt: Date
}

/** A imagem do resultado de uma ideia executável: tipo e medida — os bytes ficam na tabela `resultados`. */
export interface ImagemDoResultado {
  mime: string
  largura: number
  altura: number
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
  /** Livros diferentes — a conexão de ponte, o "achado". */
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

/** O que um anexo guarda. Os bytes de uma imagem moram à parte, fora desta linha. */
export type MidiaDoAnexo =
  { tipo: 'link'; url: string } | { tipo: 'imagem'; mime: string; largura: number; altura: number }

/**
 * Um item de uma pasta de acervo: um link ou uma imagem, com a legenda que diz
 * do que se trata.
 *
 * Não é um neurônio, de propósito: cada conceito mantém no máximo seis
 * vizinhos, e dez vídeos sobre um conceito tomariam todas as vagas dele — os
 * fios entre conceitos, que são o produto, sumiriam. O anexo escolhe conceitos
 * (ver `Vinculo`), e nenhum conceito fica sabendo.
 */
export interface Anexo {
  id: Id
  livroId: Id
  /** O que o motor lê. Vazia, o anexo fica só na pasta, sem fio nenhum. */
  legenda: string
  midia: MidiaDoAnexo
  /** Vetor da legenda. `null` sem legenda ou enquanto a inferência não terminou. */
  embedding: Float32Array | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Um anexo preso a um conceito. Tem direção — é sempre o anexo que escolhe —,
 * então o id é `anexoId::conceitoId`, sem a ordem canônica de `conexaoId`.
 */
export interface Vinculo {
  id: Id
  anexoId: Id
  conceitoId: Id
  /** 0..1, na mesma escala do `emb` das conexões. */
  score: number
  /**
   * A posição no ranking daquele anexo: 0 é o conceito mais parecido — é em
   * volta dele que o satélite orbita na Rede. Gravada, e não deduzida do
   * `score`, porque o score satura em 1 num palácio pequeno e empata; a ordem
   * vem do cosseno antes do teto (ver `ancorarAnexos`).
   */
  ordem: number
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
  /**
   * Ausente em backups de antes de 07/10/2026 (enfeites editáveis) — o import
   * trata como `[]`. Funde como as vagas: o enfeite do arquivo entra, o que só
   * existe aqui fica, e nenhum sobrevive embaixo de um livro.
   */
  enfeites?: EnfeiteGravado[] | undefined
  /**
   * Ausente em backups de antes das pastas de acervo (24/09/2026) — o import
   * trata como `[]`. Os vínculos não vêm: são recalculados na chegada, como o
   * perfil.
   */
  anexos?: AnexoSnapshot[] | undefined
  /**
   * Ausente em backups de antes do Mapa (01/10/2026) — calculado na chegada.
   * Diferente das posições da Rede, o mapa **vai** no backup: a promessa dele é
   * a memória espacial, e recalcular na chegada a desfaria. No import, as ilhas
   * do arquivo vencem (ver `fundirMapas`).
   */
  mapa?: MapaDoPalacio | undefined
}

export interface AnexoSnapshot {
  id: Id
  livroId: Id
  legenda: string
  midia: MidiaDoAnexo
  /** Float32Array em base64, como o do neurônio. */
  embedding: string | null
  /** Os bytes da imagem, em base64 — ausentes num anexo de link. */
  arquivo?: { imagem: string; miniatura: string } | undefined
  createdAt: string
  updatedAt: string
}

/**
 * Os bytes de uma imagem do acervo, fora da linha do anexo para que listar
 * anexos nunca arraste imagem junto. `Uint8Array`, como o `Float32Array` do
 * embedding: vira BLOB no SQLite e `ByteArray` no nativo sem conversão.
 */
export interface ArquivoDoAnexo {
  /** A imagem reduzida (lado maior até 1600 px), no `mime` do anexo. */
  imagem: Uint8Array
  /** Para grade e cartão (lado maior até 320 px), no mesmo `mime`. */
  miniatura: Uint8Array
}

export interface LivroSnapshot {
  id: Id
  /** Ausente em backups de antes das pastas de acervo — o import trata como `'conceitos'`. */
  tipo?: TipoDeLivro | undefined
  titulo: string
  /** Hex livre: backup de antes da paleta Noite — o import leva ao tom mais próximo. */
  cor: string
  /** Ausente em backups de antes da paleta Noite — o import trata como `'solido'`. */
  estilo?: EstiloDaLombada | undefined
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
  /** Ausentes em backups de antes do livro deitado (08/10/2026) — o import trata como de pé. */
  orientacao?: OrientacaoDoLivro | undefined
  nivel?: number | undefined
  /** Ausente em backups anteriores à Fase 16 — o import trata como `null`. */
  emblema?: string | null | undefined
  /** Ausente em backups anteriores à Fase 19 — o import trata como `null`. */
  larguraLombada?: number | null | undefined
  /** Ausente em backups de antes de 14/09/2026 — o import trata como `null`. */
  comprimentoLombada?: number | null | undefined
  /** Ausente em backups de antes dos executáveis (01/10/2026) — o import trata como `false`. */
  executavel?: boolean | undefined
  /** Ausente em backups de antes dos executáveis — o import trata como o padrão (30). */
  diasParaAdormecer?: number | undefined
  createdAt: string
}

export interface NeuronioSnapshot {
  id: Id
  /** `null` é o porto. Ausente não acontece: backups antigos sempre têm livro. */
  livroId: Id | null
  titulo: string
  conteudo: string
  /** Float32Array em base64 (little-endian), não array JSON. */
  embedding: string | null
  /** Ausentes em backups de antes dos executáveis (01/10/2026): sem estado, sem link, e o último toque é a última edição. */
  estado?: EstadoDaIdeia | null | undefined
  ultimoToque?: string | undefined
  resultadoLink?: string | null | undefined
  /** Ausentes em backups de antes da imagem do resultado (07/10/2026). */
  resultadoImagem?: ImagemDoResultado | null | undefined
  resultadoArquivo?: { imagem: string; miniatura: string } | undefined
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
