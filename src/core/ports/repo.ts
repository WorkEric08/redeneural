import type { Conexao, Id, Livro, Neuronio, PalacioSnapshot } from '../domain/types'
import type { PerfilDoPalacio } from '../motor/grafo'
import type { MarcaPerdida } from '../motor/incremental'

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
  upsertLivro(l: Livro): Promise<void>
  /** Apaga o livro, seus neurônios e toda aresta que os tocava. */
  deleteLivro(id: Id): Promise<void>
  /**
   * Move um livro para `(prateleira, posicao)`, empurrando quem estava naquela
   * posição em diante — só a prateleira de origem e a de destino são tocadas,
   * nunca a estante inteira.
   */
  moverLivro(id: Id, prateleira: number, posicao: number): Promise<void>
  /** Quantas prateleiras a estante tem hoje. Default 4 se nunca foi definida. */
  getQuantidadeDePrateleiras(): Promise<number>
  /**
   * Grava quantas prateleiras a estante tem. Recusa diminuir se sobrar livro
   * numa prateleira que deixaria de existir — nunca perder livro por engano.
   */
  definirQuantidadeDePrateleiras(quantidade: number): Promise<void>

  listNeuronios(livroId?: Id): Promise<Neuronio[]>
  getNeuronio(id: Id): Promise<Neuronio | undefined>
  upsertNeuronio(n: Neuronio): Promise<void>
  /** Apaga o neurônio e toda aresta que o tocava. */
  deleteNeuronio(id: Id): Promise<void>

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

  exportAll(): Promise<PalacioSnapshot>
  /** Idempotente: importar o mesmo snapshot duas vezes não duplica nada. */
  importAll(s: PalacioSnapshot): Promise<void>
  clear(): Promise<void>
}
