/**
 * A paleta Noite: as dez cores que um livro pode ter, e as dez formas da
 * lombada (estante no estilo Noite, 06/10/2026).
 *
 * `Livro.cor` continua sendo um hex gravado, mas só um destes dez. Backup e
 * banco de antes da paleta trazem hex livre: `corMaisProxima` leva cada um ao
 * tom mais perto, em vez de recusar.
 */

export interface TomDaPaleta {
  chave: string
  nome: string
  hex: string
}

export const PALETA_NOITE = [
  { chave: 'azul-base', nome: 'Azul base', hex: '#1B2A6B' },
  { chave: 'azul-profundo', nome: 'Azul profundo', hex: '#12204F' },
  { chave: 'azul-vivo', nome: 'Azul vivo', hex: '#2A3A8A' },
  { chave: 'azul-noite', nome: 'Azul noite', hex: '#0E1744' },
  { chave: 'azul-medio', nome: 'Azul médio', hex: '#243580' },
  { chave: 'petroleo', nome: 'Petróleo', hex: '#17505A' },
  { chave: 'violeta', nome: 'Violeta', hex: '#3A2F6B' },
  { chave: 'vinho', nome: 'Vinho', hex: '#4A2540' },
  { chave: 'grafite', nome: 'Grafite', hex: '#2D3A4F' },
  { chave: 'creme', nome: 'Creme', hex: '#F1EEE6' },
] as const satisfies readonly TomDaPaleta[]

/** O tom de um livro novo, e o de quem tinha um hex que não se lê. */
export const COR_PADRAO = PALETA_NOITE[0].hex

export const ESTILOS_DA_LOMBADA = [
  'solido',
  'faixa',
  'duas-cores',
  'contorno',
  'ponto',
  'fio',
  'degrade',
  'papel',
  'metade',
  'bloco',
] as const

export type EstiloDaLombada = (typeof ESTILOS_DA_LOMBADA)[number]

export const ESTILO_PADRAO: EstiloDaLombada = 'solido'

export function ehEstiloDaLombada(valor: unknown): valor is EstiloDaLombada {
  return ESTILOS_DA_LOMBADA.some((e) => e === valor)
}

const HEX = /^#[0-9a-f]{6}$/i

export function ehCorDaPaleta(hex: string): boolean {
  return PALETA_NOITE.some((t) => t.hex.toLowerCase() === hex.toLowerCase())
}

type Lab = readonly [number, number, number]

function linear(canal: number): number {
  const c = canal / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function lab(hex: string): Lab {
  const r = linear(parseInt(hex.slice(1, 3), 16))
  const g = linear(parseInt(hex.slice(3, 5), 16))
  const b = linear(parseInt(hex.slice(5, 7), 16))

  // sRGB → XYZ (D65), normalizado pelo branco de referência.
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883

  const f = (t: number): number =>
    t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 / 116) * t + 16 / 116
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

const LAB_DA_PALETA = PALETA_NOITE.map((t) => ({ hex: t.hex, lab: lab(t.hex) }))

/**
 * O tom da paleta mais perto de `hex`, pela distância em Lab (ΔE76) — a mais
 * próxima do que o olho enxerga, ao contrário da distância em RGB. O que não
 * é hex `#rrggbb` vira `COR_PADRAO`. Empate: o primeiro da paleta.
 */
export function corMaisProxima(hex: string): string {
  if (!HEX.test(hex)) return COR_PADRAO
  const alvo = lab(hex)

  let melhor: string = COR_PADRAO
  let menor = Infinity
  for (const tom of LAB_DA_PALETA) {
    const d =
      (tom.lab[0] - alvo[0]) ** 2 + (tom.lab[1] - alvo[1]) ** 2 + (tom.lab[2] - alvo[2]) ** 2
    if (d < menor) {
      menor = d
      melhor = tom.hex
    }
  }
  return melhor
}
