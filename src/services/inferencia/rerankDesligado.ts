import type { RerankProvider } from '@/core'

/**
 * O reranker no MVP web: desligado.
 *
 * Decisão da Fase 3, com os números do `spike.html`:
 *
 * - `Xenova/bge-reranker-base` quantizado são 283 MB, e o Chrome **recusa**
 *   guardá-los (`cache.put` falha com `UnknownError` num arquivo de 267 MB, mesmo
 *   com 3 GB de quota livre). Voltariam da rede a cada início a frio, o que quebra
 *   o offline-first.
 * - 270 ms por par num desktop de 12 núcleos: criar um neurônio saía de 45 ms para
 *   1,68 s, e reprocessar 300 neurônios de 13,5 s para 4,4 min.
 * - A qualidade não compensou: acertou `Forma e repetição ↔ Recursão` (0,97) e
 *   descartou `Cache ↔ Memória de trabalho` (0,08 sobre um embedding de 0,53).
 *
 * Isto não é um stub esquecido — é o caminho de degradação que o motor já prevê e
 * que os testes do núcleo cobrem. Volta na Fase 9+ como `OnnxNativeRerank`, onde
 * os 283 MB viram asset do APK e a inferência é nativa.
 */
export function criarRerankDesligado(): RerankProvider {
  return {
    ready: () => Promise.resolve(),
    available: () => false,
    score: () =>
      Promise.reject(
        new Error('reranker desligado no MVP web — cheque available() antes de chamar score()'),
      ),
  }
}
