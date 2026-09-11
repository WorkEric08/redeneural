/**
 * Codec base64 para embeddings, escrito sem `btoa`, `atob` ou `Buffer`:
 * o núcleo não sabe se está num navegador, num Worker ou numa JVM.
 *
 * 384 floats viram ~2KB de base64 contra ~8KB de array JSON — e o mesmo par de
 * funções vale para o export do PWA e para o import do app nativo.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const LOOKUP = /* @__PURE__ */ (() => {
  const table = new Int8Array(128).fill(-1)
  for (let i = 0; i < ALPHABET.length; i++) table[ALPHABET.charCodeAt(i)] = i
  return table
})()

export function embeddingToBase64(v: Float32Array): string {
  return bytesToBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength))
}

export function base64ToEmbedding(s: string): Float32Array {
  const bytes = base64ToBytes(s)
  if (bytes.byteLength % 4 !== 0) {
    throw new Error(`embedding base64 inválido: ${bytes.byteLength} bytes não são múltiplos de 4`)
  }
  // Cópia via slice: o buffer do Uint8Array pode não estar alinhado a 4 bytes.
  return new Float32Array(bytes.slice().buffer)
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!
    out +=
      ALPHABET[(n >> 18) & 63]! +
      ALPHABET[(n >> 12) & 63]! +
      ALPHABET[(n >> 6) & 63]! +
      ALPHABET[n & 63]!
  }
  const rest = bytes.length - i
  if (rest === 1) {
    const n = bytes[i]! << 16
    out += ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]! + '=='
  } else if (rest === 2) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8)
    out += ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]! + ALPHABET[(n >> 6) & 63]! + '='
  }
  return out
}

export function base64ToBytes(s: string): Uint8Array {
  const clean = s.endsWith('==') ? s.slice(0, -2) : s.endsWith('=') ? s.slice(0, -1) : s
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let acc = 0
  let bits = 0
  let o = 0
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i)
    const value = code < 128 ? LOOKUP[code]! : -1
    if (value < 0) throw new Error(`caractere base64 inválido na posição ${i}`)
    acc = (acc << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes[o++] = (acc >> bits) & 0xff
    }
  }
  return bytes
}
