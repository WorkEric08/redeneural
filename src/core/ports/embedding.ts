/**
 * Porta de inferência de embeddings.
 *
 * Hoje: `TransformersEmbedding` (transformers.js num Web Worker).
 * Depois: `OnnxNativeEmbedding` (ONNX Runtime Android).
 * O núcleo nunca sabe qual dos dois está do outro lado.
 */
export interface EmbeddingProvider {
  /** Carrega o modelo. Idempotente — chamar duas vezes não baixa duas vezes. */
  ready(): Promise<void>
  /** Vetor normalizado (norma 1) do texto. */
  embed(text: string): Promise<Float32Array>
  /** Dimensão do vetor. 384 no multilingual-e5-small. */
  readonly dim: number
}
