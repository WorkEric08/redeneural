import type { ModoDaBusca } from '../domain/modoDaBusca'
import type { ModoDaRede } from '../domain/modoDaRede'
import type { MapaDoPalacio } from '../motor/mapa'
import type { AnexoNaTela, NeuronioNaTela } from '../domain/tela'
import type { Conexao, Id, Livro, TipoDeLivro, Vaga, Vinculo } from '../domain/types'
import type { Ponto } from '../motor/redeLayout'

export interface CriarNeuronioInput {
  /**
   * Gerado por quem chama, não pelo motor.
   *
   * É o que torna o otimismo possível sem inventar correlação: a tela insere o
   * neurônio com este id antes de a inferência começar, e depois só substitui.
   */
  id: Id
  /**
   * Ao criar, `null` é "Automático": o motor lê o texto, calcula as conexões e
   * guarda no livro que os mais parecidos apontam (ver `livroDoPorto`) — ou
   * deixa no porto, sem livro, quando a resposta não é clara.
   *
   * Ao editar, `null` só mantém no porto quem já estava lá: editar nunca
   * passa pelo Porto.
   */
  livroId: Id | null
  titulo: string
  conteudo: string
}

export type EditarNeuronioInput = CriarNeuronioInput

/** O que muda quando um neurônio troca de livro: ele, e a cor das conexões dele. */
export interface NeuronioGuardado {
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  /** Mudou de livro, mudou de ilha. */
  mapa: MapaDoPalacio
}

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
  /** Ausente é `'conceitos'`. Não muda depois — `EditarLivroInput` não tem este campo. */
  tipo?: TipoDeLivro
}

/**
 * O que a pessoa entrega ao criar um anexo. A imagem chega como veio da
 * galeria; quem reduz, e decide o formato gravado, é o motor.
 */
export interface CriarAnexoInput {
  /** Gerado por quem chama, pelo mesmo motivo do neurônio. */
  id: Id
  livroId: Id
  legenda: string
  conteudo: { tipo: 'link'; url: string } | { tipo: 'imagem'; bytes: Uint8Array; mime: string }
}

/** A imagem não se troca — apaga-se e cria-se outro. O endereço de um link, sim. */
export interface EditarAnexoInput {
  id: Id
  legenda: string
  /** Só vale para anexo de link. */
  url?: string | undefined
}

/** A parte do estado que é das pastas de acervo. */
export interface AcervoGravado {
  anexos: AnexoNaTela[]
  vinculos: Vinculo[]
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
  /** O último modo da busca que a pessoa escolheu — a tela abre nele. */
  modoDaBusca: ModoDaBusca
  /** O último modo da tela da Rede — constelação ou Mapa. */
  modoDaRede: ModoDaRede
  /** O Mapa: ilhas por livro, gravadas (ver `core/motor/mapa.ts`). */
  mapa: MapaDoPalacio
  /**
   * Onde a Rede organizou cada neurônio da última vez — por significado, não
   * por livro (Fase 23-2). `{}` num palácio que nunca foi organizado.
   */
  posicoesDaRede: Readonly<Record<Id, Ponto>>
  /** Os itens das pastas de acervo, sem vetor e sem bytes. */
  anexos: AnexoNaTela[]
  /** Que conceitos cada anexo escolheu. */
  vinculos: Vinculo[]
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
  /** E o Mapa encaixa o neurônio na ilha do livro dele, sem mover ninguém. */
  mapa: MapaDoPalacio
  /** Um conceito novo ou mudado pode virar a melhor âncora de algum anexo. */
  vinculos: Vinculo[]
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
  /**
   * Põe o neurônio num livro de conceitos — é a resposta à pergunta do porto,
   * e o "Mudar" depois de o Porto escolher. Não relê o texto: o vetor e as
   * conexões continuam os mesmos, só a ponte é refeita, porque ela depende do
   * livro dos dois lados.
   */
  guardarNeuronio(id: Id, livroId: Id): Promise<NeuronioGuardado>

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
  /** Grava o modo da busca que a pessoa acabou de escolher. */
  definirModoDaBusca(modo: ModoDaBusca): Promise<ModoDaBusca>
  /** Grava o modo da tela da Rede que a pessoa acabou de escolher. */
  definirModoDaRede(modo: ModoDaRede): Promise<ModoDaRede>
  /**
   * Desenha o Mapa inteiro de novo, do zero. É a única coisa que reorganiza o
   * mapa todo — só quando a pessoa pede (Ajustes, com confirmação).
   */
  reorganizarMapa(): Promise<MapaDoPalacio>
  /**
   * Arrastar um neurônio: onde o dedo soltou vira a âncora dele, e a mesma
   * física de sempre (partida quente, poucas iterações) deixa a vizinhança
   * reagir a partir daí — sem tocar em conexões, só no layout.
   */
  moverNeuronioNaRede(id: Id, ponto: Ponto): Promise<Readonly<Record<Id, Ponto>>>
  /**
   * Grava o anexo antes da inferência (como o neurônio) e devolve o palácio
   * inteiro, já com os conceitos que ele escolheu. Só aceita livro do tipo
   * `acervo`.
   *
   * O palácio inteiro, e não só o acervo: num palácio que nunca foi lido, o
   * primeiro anexo com legenda dispara o reprocessamento — e aí os neurônios,
   * as conexões e a Rede também mudam.
   */
  criarAnexo(input: CriarAnexoInput): Promise<EstadoDoPalacio>
  editarAnexo(input: EditarAnexoInput): Promise<EstadoDoPalacio>
  /** Nenhum conceito perde vizinho por causa de um anexo — apagar não reprocessa nada. */
  apagarAnexo(id: Id): Promise<EstadoDoPalacio>
  /**
   * Os bytes de uma imagem do acervo, pedidos só por quem vai desenhá-la —
   * nunca viajam junto do estado. `null` se o anexo não tem imagem.
   */
  lerImagem(anexoId: Id, tamanho: 'miniatura' | 'inteira'): Promise<Uint8Array | null>
  /**
   * Os neurônios mais parecidos com a consulta, do mais para o menos parecido
   * (ver `buscarPorSentido`). Só ids: a tela já tem o resto.
   *
   * Num palácio que nunca foi lido devolve vazio sem carregar o modelo — sem
   * perfil não há régua, e uma busca não pode baixar 129 MB. Neurônio ainda
   * sem vetor fica de fora.
   */
  buscarPorSentido(consulta: string): Promise<Id[]>
  /** Devolve a função que cancela a inscrição. */
  aoProgredir(ouvinte: (p: ProgressoDoMotor) => void): () => void
}
