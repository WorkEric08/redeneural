/**
 * Porta de reranking — opcional por design.
 *
 * Se `available()` devolver false (aparelho fraco, modelo não baixou, WebView
 * sem memória), o motor roda só com o embedding em vez de falhar.
 */
export interface RerankProvider {
  ready(): Promise<void>
  available(): boolean
  /** Relevância do par, 0..1 — `sigmoid(logit)` lendo os dois textos juntos. */
  score(a: string, b: string): Promise<number>
}
