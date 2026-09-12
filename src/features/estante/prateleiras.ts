import { semente, sorteio } from '@/lib/semente'

import type { LivroNaEstante } from './resumo'

/**
 * Como os livros se distribuem pelas prateleiras do móvel.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). **Determinístico**, pela
 * mesma razão do layout da rede: a estante é mobília, e mobília que se remexe
 * a cada sessão não serve de palácio da memória. Toda variação — largura da
 * lombada, inclinação, altura dos enfeites — sai da semente do id.
 *
 * Os **enfeites** são a parte da biblioteca que ainda não foi escrita: lombadas
 * escuras, sem título, sem toque, que só existem para o móvel ter a densidade
 * de uma estante de verdade. A luz não as alcança — quem ela alcança são os
 * seus livros, e é isso que os faz saltar no meio delas.
 */

const LIVROS_POR_PRATELEIRA = 6
const MINIMO_DE_PRATELEIRAS = 4
const MAXIMO_DE_PRATELEIRAS = 14

/** Enfeites por prateleira: o bastante para transbordar a mais larga e ser cortado. */
const ENFEITES_POR_PRATELEIRA = 26

/**
 * Os panos que a estante usa nos enfeites, com peso.
 *
 * Quase tudo azul, um pouco de verde-azulado e violeta, e um livro quente de
 * vez em quando. É a referência virando regra: sob luz de lua a biblioteca
 * inteira tende ao azul, e é a raridade do couro claro que dá o ponto de calor.
 * Magenta e verde ficaram de fora — sob esta luz eles não desbotam, gritam.
 */
const PANOS = [4, 4, 4, 4, 4, 2, 2, 1, 1, 3]

export interface LombadaNaPrateleira {
  item: LivroNaEstante
  largura: number
}

export interface Enfeite {
  chave: string
  largura: number
  /** Em % da fileira, como a lombada de verdade — ver .movel-fila. */
  altura: number
  /** 0..1 — quanto da luz da sala chega neste livro. */
  luz: number
  /** Filete dourado gravado na lombada. */
  filete: boolean
  /** Etiqueta de papel colada na lombada, como nas encadernações antigas. */
  etiqueta: boolean
  /** Qual pano de encadernação, 1..6 — o luar desbota todos para o mesmo azul. */
  pano: number
  /** Deitado sobre os outros, como acontece em estante cheia. */
  deitado: boolean
  /** Graus de inclinação: livro encostado no vizinho. */
  inclinacao: number
}

export interface Prateleira {
  chave: string
  livros: LombadaNaPrateleira[]
  enfeites: Enfeite[]
}

export function montarPrateleiras(estante: readonly LivroNaEstante[]): Prateleira[] {
  const quantas = Math.min(
    MAXIMO_DE_PRATELEIRAS,
    Math.max(MINIMO_DE_PRATELEIRAS, Math.ceil(estante.length / LIVROS_POR_PRATELEIRA)),
  )

  // Os livros se espalham pelo móvel em vez de se amontoarem nas primeiras
  // prateleiras: uma estante com tudo numa fila e o resto vazio não é estante.
  // Com muitos livros, cada prateleira acomoda mais, em vez de o excesso cair
  // fora do móvel.
  const porPrateleira = Math.max(1, Math.ceil(estante.length / quantas))

  return Array.from({ length: quantas }, (_, i) => ({
    chave: `p${String(i)}`,
    livros: estante.slice(i * porPrateleira, (i + 1) * porPrateleira).map((item) => {
      const [a] = semente(item.livro.id)
      return { item, largura: Math.round(30 + a * 16) }
    }),
    enfeites: montarEnfeites(i),
  }))
}

function arredondar(valor: number): number {
  return Math.round(valor * 10) / 10
}

function montarEnfeites(prateleira: number): Enfeite[] {
  return Array.from({ length: ENFEITES_POR_PRATELEIRA }, (_, i) => {
    const chave = `e${String(prateleira)}-${String(i)}`
    const [a, b] = semente(chave)
    const deitado = sorteio(chave, 5) > 0.93

    return {
      chave,
      largura: deitado ? Math.round(32 + a * 24) : Math.round(15 + a * 26),
      // Altura puxada para cima: numa estante cheia quase todo livro chega
      // perto da tábua de cima, e vão vazio demais lê como buraco, não como ar.
      // Mesmo teto dos livros de verdade (ver Lombada.tsx) — um enfeite maior
      // que o maior livro possível ia parecer erro, não decoração. Em % da
      // fileira, que agora se mede pela tela: são os mesmos 7..13 e 60..84 px
      // sobre a fileira de 92 px de antes.
      altura: deitado ? arredondar(7.6 + b * 6.5) : arredondar(65 + b * 26),
      luz: sorteio(chave, 3),
      filete: sorteio(chave, 4) > 0.72,
      etiqueta: !deitado && sorteio(chave, 8) > 0.8,
      pano: PANOS[Math.floor(sorteio(chave, 7) * PANOS.length)] ?? 4,
      deitado,
      inclinacao: sorteio(chave, 6) > 0.94 ? (a > 0.5 ? 3 : -3) : 0,
    }
  })
}
