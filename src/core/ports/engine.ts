import type { ModoDaBusca } from '../domain/modoDaBusca'
import type { ModoDaRede } from '../domain/modoDaRede'
import type { EstiloDaLombada } from '../domain/paletaNoite'
import type { MapaDoPalacio } from '../motor/mapa'
import type { AnexoNaTela, NeuronioNaTela } from '../domain/tela'
import type {
  Conexao,
  DadosDoEnfeite,
  EnfeiteGravado,
  EstadoDaIdeia,
  Id,
  Livro,
  TipoDeLivro,
  Vaga,
  Vinculo,
} from '../domain/types'
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
   * guarda no livro que os mais parecidos apontam (ver `livroAutomatico`) — sempre
   * num livro. Só sem nenhum livro que possa recebê-lo (de conceitos e não
   * executável) o neurônio fica no porto, sem livro, esperando a pessoa.
   *
   * Ao editar, `null` só mantém no porto quem já estava lá: editar nunca
   * escolhe livro sozinho.
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
  /** Ausente é `'solido'`. */
  estilo?: EstiloDaLombada
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
  /** Ausente é `false`. Pasta de acervo nunca é. */
  executavel?: boolean
  /** Ausente é `DIAS_PARA_ADORMECER_PADRAO`. */
  diasParaAdormecer?: number
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

/**
 * O que se troca num item da pasta: a legenda, o endereço de um link e — desde
 * 07/10/2026 — a imagem. O tipo nunca muda: uma imagem só vira outra imagem, e um
 * link, outro link.
 */
export interface EditarAnexoInput {
  id: Id
  legenda: string
  /** Só vale para anexo de link. */
  url?: string | undefined
  /** Só vale para anexo de imagem: os bytes da nova, que ficam no lugar da antiga. */
  imagem?: { bytes: Uint8Array; mime: string } | undefined
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
  estilo: EstiloDaLombada
  emblema: string | null
  larguraLombada: number | null
  comprimentoLombada: number | null
  /** Livro de conceitos vira executável e deixa de ser quando a pessoa quiser; pasta, nunca. */
  executavel: boolean
  diasParaAdormecer: number
}

/**
 * O que a estante grava além do grafo: onde cada livro está, os lugares deixados
 * abertos e os enfeites que a pessoa definiu ou moveu.
 */
export interface EstanteGravada {
  livros: Livro[]
  vagas: Vaga[]
  enfeites: EnfeiteGravado[]
}

/** Uma imagem escolhida na galeria ou na câmera, ainda sem redução: os bytes e o tipo. */
export interface ImagemParaGuardar {
  bytes: Uint8Array
  mime: string
}

export interface EstadoDoPalacio {
  livros: Livro[]
  vagas: Vaga[]
  enfeites: EnfeiteGravado[]
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  /** Quantas prateleiras a estante tem — gravado, ajustável em Ajustes. */
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /** 0-100: a mesma luz, sobre os enfeites. */
  intensidadeDaLuzDoEnfeite: number
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
  /**
   * As ideias adormecidas que a nova acordou — ligadas a ela por uma conexão
   * forte (`quemDesperta`), da mais forte para a mais fraca. Vazio ao editar:
   * só uma ideia nova desperta alguém.
   */
  acordadas: { id: Id; titulo: string }[]
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
   *
   * `livroId` `null` é "Automático": o motor escolhe pelo texto, entre os livros de
   * conceitos que não são executáveis (`livroAutomatico`) — é como se deixa de ser
   * executável sem dizer para onde ir. Sem livro que possa recebê-lo, recusa.
   */
  guardarNeuronio(id: Id, livroId: Id | null): Promise<NeuronioGuardado>
  /**
   * Muda o andamento de uma ideia num livro executável — e é um toque. O link
   * do resultado vale quando ela está feita; mudar de estado depois não o
   * apaga. Não mexe em texto, vetor nem conexão.
   *
   * `resultadoImagem` (07/10/2026), junto de "feita", como o link: `undefined` mantém a
   * que já estava, uma imagem nova a reduz e grava no lugar, e `null` a tira.
   */
  definirEstado(
    id: Id,
    estado: EstadoDaIdeia,
    resultadoLink: string | null,
    resultadoImagem?: ImagemParaGuardar | null,
  ): Promise<NeuronioNaTela[]>
  /**
   * Um toque numa ideia de livro executável — abrir a tela dela, ou o
   * "Acordar". Só o `ultimoToque` muda. Fora de livro executável não grava
   * nada e devolve `null`: o relógio do adormecer só existe lá.
   */
  tocar(id: Id): Promise<NeuronioNaTela | null>

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
  tirarEnfeite(prateleira: number, lugar: number): Promise<EstanteGravada>
  /** Põe um enfeite de volta num lugar aberto. */
  porEnfeite(prateleira: number, lugar: number): Promise<EstanteGravada>
  /** Grava o enfeite que a pessoa definiu — cor, forma e medidas, como as de um livro. */
  salvarEnfeite(enfeite: EnfeiteGravado): Promise<EstanteGravada>
  /**
   * Põe o enfeite de `origem` em `destino` com as regras do livro: lugar sem livro,
   * só ele se move; com livro, a fila empurra até o buraco mais perto. O lugar
   * de onde saiu fica aberto. `dados` é a cara que a tela mostrava nele.
   */
  moverEnfeite(origem: Vaga, destino: Vaga, dados: DadosDoEnfeite): Promise<EstanteGravada>
  /**
   * Quantas prateleiras a estante tem. Recusa diminuir se sobrar livro numa
   * prateleira que deixaria de existir — mova os livros antes.
   */
  definirQuantidadeDePrateleiras(quantidade: number): Promise<number>
  /** Grava a intensidade da luz (0-100), sempre recortada para essa faixa. */
  definirIntensidadeDaLuz(valor: number): Promise<number>
  /** Grava a intensidade da luz dos enfeites (0-100), sempre recortada para essa faixa. */
  definirIntensidadeDaLuzDoEnfeite(valor: number): Promise<number>
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
   * A pessoa arrastou uma ilha do Mapa: ela fica onde foi solta, com os
   * neurônios dela, e só ela anda — se caiu em cima de outra, o mínimo até o mar
   * inteiro em volta (`moverIlha`).
   */
  moverIlhaNoMapa(livroId: Id, centro: Ponto): Promise<MapaDoPalacio>
  /** A pessoa arrastou um neurônio no Mapa: dentro da ilha dele, sempre (`moverPontoNoMapa`). */
  moverNeuronioNoMapa(id: Id, ponto: Ponto): Promise<MapaDoPalacio>
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
  /** O mesmo para a imagem do resultado de uma ideia — `null` se ela não tem. */
  lerImagemDoResultado(neuronioId: Id, tamanho: 'miniatura' | 'inteira'): Promise<Uint8Array | null>
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
