/**
 * Números estáveis a partir de um id.
 *
 * O palácio não pode se remexer: o livro tem que estar na mesma posição, com a
 * mesma largura e a mesma inclinação, toda vez que você abre o app. Por isso a
 * variação sai daqui e nunca de `Math.random`.
 *
 * Compartilhado entre a estante e o mapa da rede — se cada um tivesse a sua
 * cópia, os dois poderiam divergir sem ninguém notar.
 */

/** FNV-1a. Só precisa ser estável e bem espalhado — não é criptografia. */
export function embaralhar(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Dois números em [0,1) a partir do id. */
export function semente(id: string): [number, number] {
  const a = embaralhar(id)
  const b = embaralhar(`${id}#2`)
  return [a / 0xffffffff, b / 0xffffffff]
}

/** Um número em [0,1) — para quando um id precisa de mais de dois sorteios. */
export function sorteio(id: string, rodada: number): number {
  return embaralhar(`${id}#${String(rodada)}`) / 0xffffffff
}
