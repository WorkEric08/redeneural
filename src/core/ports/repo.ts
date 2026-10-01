import type {
  Anexo,
  ArquivoDoAnexo,
  Conexao,
  Id,
  Livro,
  Neuronio,
  PalacioSnapshot,
  Vaga,
  Vinculo,
} from '../domain/types'
import type { ModoDaBusca } from '../domain/modoDaBusca'
import type { ModoDaRede } from '../domain/modoDaRede'
import type { MapaDoPalacio } from '../motor/mapa'
import type { PerfilDoPalacio } from '../motor/grafo'
import type { MarcaPerdida } from '../motor/incremental'
import type { Ponto } from '../motor/redeLayout'

/**
 * Porta de persistência.
 *
 * Hoje: `DexieRepo` (IndexedDB). Depois: `SqliteRepo` (Capacitor SQLite).
 * Nenhum componente React pode importar Dexie — só esta interface.
 */
export interface PalacioRepo {
  /** Na ordem da estante. */
  listLivros(): Promise<Livro[]>
  getLivro(id: Id): Promise<Livro | undefined>
  /** Grava o livro e fecha a vaga que houvesse no lugar dele — livro e buraco não dividem lugar. */
  upsertLivro(l: Livro): Promise<void>
  /**
   * Apaga o livro e tudo o que mora nele — neurônios e as arestas que os
   * tocavam; numa pasta, os anexos, as imagens e os vínculos. O lugar dele
   * vira vaga: nada anda sozinho na estante.
   */
  deleteLivro(id: Id): Promise<void>
  /**
   * Põe o livro no lugar `(prateleira, lugar)` com `moverLivroNaEstante`: livre,
   * só ele se move; ocupado, empurra até o buraco mais perto. O lugar de onde
   * saiu vira vaga. Recusa (erro) numa prateleira cheia de livros.
   */
  moverLivro(id: Id, prateleira: number, lugar: number): Promise<void>
  /** Os lugares deixados abertos, sem livro e sem enfeite. */
  listVagas(): Promise<Vaga[]>
  /** Tira o enfeite do lugar. Recusa um lugar que tem livro. */
  abrirVaga(v: Vaga): Promise<void>
  /** Devolve o enfeite ao lugar. Sem vaga ali, não faz nada. */
  fecharVaga(v: Vaga): Promise<void>
  /** Quantas prateleiras a estante tem hoje. Default 4 se nunca foi definida. */
  getQuantidadeDePrateleiras(): Promise<number>
  /**
   * Grava quantas prateleiras a estante tem. Recusa diminuir se sobrar livro
   * numa prateleira que deixaria de existir — nunca perder livro por engano.
   */
  definirQuantidadeDePrateleiras(quantidade: number): Promise<void>
  /** 0-100. Default `INTENSIDADE_DA_LUZ_PADRAO` se nunca foi definida. */
  getIntensidadeDaLuz(): Promise<number>
  /** Grava a intensidade da luz, sempre recortada para 0-100. */
  definirIntensidadeDaLuz(valor: number): Promise<void>
  /** O último modo da busca que a pessoa escolheu. `MODO_DA_BUSCA_PADRAO` se nunca escolheu. */
  getModoDaBusca(): Promise<ModoDaBusca>
  definirModoDaBusca(modo: ModoDaBusca): Promise<void>
  /** O último modo da tela da Rede (constelação ou Mapa). `MODO_DA_REDE_PADRAO` se nunca escolheu. */
  getModoDaRede(): Promise<ModoDaRede>
  definirModoDaRede(modo: ModoDaRede): Promise<void>

  listNeuronios(livroId?: Id): Promise<Neuronio[]>
  getNeuronio(id: Id): Promise<Neuronio | undefined>
  upsertNeuronio(n: Neuronio): Promise<void>
  /** Apaga o neurônio, toda aresta que o tocava e todo vínculo de anexo preso a ele. */
  deleteNeuronio(id: Id): Promise<void>

  /** O mais recente primeiro, como os neurônios. */
  listAnexos(livroId?: Id): Promise<Anexo[]>
  getAnexo(id: Id): Promise<Anexo | undefined>
  /**
   * Grava o anexo — e, se vier, a imagem dele, na mesma transação. Sem
   * `arquivo`, a imagem que já estava gravada fica como está.
   */
  upsertAnexo(a: Anexo, arquivo?: ArquivoDoAnexo): Promise<void>
  /** Apaga o anexo, a imagem e os vínculos dele. */
  deleteAnexo(id: Id): Promise<void>
  getArquivo(anexoId: Id): Promise<ArquivoDoAnexo | undefined>

  listVinculos(): Promise<Vinculo[]>
  /** Troca, numa transação só, os vínculos daquele anexo pelos novos. */
  replaceVinculosDe(anexoId: Id, novos: readonly Vinculo[]): Promise<void>
  /** Troca todos de uma vez — é o que a reancoragem depois de um conceito mudar grava. */
  replaceTodosVinculos(novos: readonly Vinculo[]): Promise<void>

  listConexoes(): Promise<Conexao[]>
  /** Arestas que tocam o neurônio, de qualquer um dos dois lados. */
  listConexoesDe(neuronioId: Id): Promise<Conexao[]>
  /**
   * Troca, numa transação só, todas as arestas que tocam este neurônio pelas
   * novas. É assim que o recálculo incremental grava seu resultado.
   */
  replaceConexoesDe(neuronioId: Id, novas: Conexao[]): Promise<void>
  /**
   * A outra metade do recálculo incremental: arestas que **não** tocam o alvo e
   * que um dos lados deixou de sustentar quando o alvo entrou na vizinhança
   * dele. A aresta só some quando ninguém mais a mantém.
   */
  soltarMarcas(marcas: readonly MarcaPerdida[]): Promise<void>
  /** Troca o grafo inteiro de uma vez — é o que `reprocessarTudo` grava. */
  replaceTodasConexoes(novas: readonly Conexao[]): Promise<void>

  /**
   * O estado derivado do último reprocessamento. `undefined` num palácio que
   * nunca foi processado.
   */
  getPerfil(): Promise<PerfilDoPalacio | undefined>
  setPerfil(p: PerfilDoPalacio, neuronios: number): Promise<void>

  /**
   * As posições que a Rede gravou da última vez que organizou o grafo por
   * significado. `{}` num palácio que nunca foi organizado.
   */
  getPosicoesDaRede(): Promise<Readonly<Record<Id, Ponto>>>
  /**
   * Grava as posições inteiras — a Rede sempre recalcula o grafo todo (mesmo
   * a atualização incremental parte das posições de antes, mas devolve o
   * conjunto completo), então sempre substitui tudo de uma vez.
   */
  setPosicoesDaRede(posicoes: Readonly<Record<Id, Ponto>>): Promise<void>

  /** O Mapa gravado. `MAPA_VAZIO` num palácio que nunca o desenhou. */
  getMapa(): Promise<MapaDoPalacio>
  setMapa(mapa: MapaDoPalacio): Promise<void>

  exportAll(): Promise<PalacioSnapshot>
  /** Idempotente: importar o mesmo snapshot duas vezes não duplica nada. */
  importAll(s: PalacioSnapshot): Promise<void>
  clear(): Promise<void>
}
