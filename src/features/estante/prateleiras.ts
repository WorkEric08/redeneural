import { semente, sorteio } from '@/lib/semente'

import type { LivroNaEstante } from './resumo'

/**
 * Como os livros se distribuem pelas prateleiras do móvel.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). **Determinístico**, pela
 * mesma razão do layout da rede: a estante é mobília, e mobília que se remexe
 * a cada sessão não serve de palácio da memória. Toda variação — cor, filete,
 * etiqueta e inclinação dos enfeites, e a largura da lombada de verdade
 * quando ninguém a escolheu na mão (Fase 19, `Livro.larguraLombada`) — sai da
 * semente do id.
 *
 * Desde a Fase 10, a prateleira de um livro é **gravada** (`Livro.prateleira`),
 * não mais calculada aqui — isto só agrupa quem já sabe onde mora. A
 * distribuição automática de antes fica congelada em `estanteAntiga.ts`, só
 * para migração e import de backups antigos.
 *
 * Os **enfeites** são a parte da biblioteca que ainda não foi escrita: lombadas
 * escuras, sem título, sem toque, que só existem para o móvel ter a densidade
 * de uma estante de verdade. A luz não as alcança — quem ela alcança são os
 * seus livros, e é isso que os faz saltar no meio delas.
 */

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
  /** Graus de inclinação: livro encostado no vizinho. */
  inclinacao: number
}

export interface Prateleira {
  chave: string
  livros: LombadaNaPrateleira[]
  enfeites: Enfeite[]
}

/** Livros já existentes naquela prateleira — um livro novo nasce depois deles. */
export function posicaoParaNovoLivro(
  livros: readonly { prateleira: number }[],
  prateleira: number,
): number {
  return livros.filter((l) => l.prateleira === prateleira).length
}

export function montarPrateleiras(
  estante: readonly LivroNaEstante[],
  quantidadeDePrateleiras: number,
): Prateleira[] {
  const porPrateleira = new Map<number, LivroNaEstante[]>()
  for (const item of estante) {
    const lista = porPrateleira.get(item.livro.prateleira)
    if (lista) lista.push(item)
    else porPrateleira.set(item.livro.prateleira, [item])
  }

  return Array.from({ length: quantidadeDePrateleiras }, (_, i) => ({
    chave: `p${String(i)}`,
    livros: (porPrateleira.get(i) ?? [])
      .slice()
      .sort((a, b) => a.livro.ordem - b.livro.ordem)
      .map((item) => {
        const [a] = semente(item.livro.id)
        const automatica = Math.round(30 + a * 16)
        return { item, largura: item.livro.larguraLombada ?? automatica }
      }),
    enfeites: montarEnfeites(i),
  }))
}

/**
 * Todo enfeite tem o mesmo tamanho — só a cor varia (pedido do usuário,
 * 14/09/2026). Mesmo teto dos livros de verdade (ver Lombada.tsx): um enfeite
 * maior que o maior livro possível ia parecer erro, não decoração.
 */
const LARGURA_DO_ENFEITE = 30
const ALTURA_DO_ENFEITE = 80

function montarEnfeites(prateleira: number): Enfeite[] {
  return Array.from({ length: ENFEITES_POR_PRATELEIRA }, (_, i) => {
    const chave = `e${String(prateleira)}-${String(i)}`

    return {
      chave,
      largura: LARGURA_DO_ENFEITE,
      altura: ALTURA_DO_ENFEITE,
      luz: sorteio(chave, 3),
      filete: sorteio(chave, 4) > 0.72,
      etiqueta: sorteio(chave, 8) > 0.8,
      pano: PANOS[Math.floor(sorteio(chave, 7) * PANOS.length)] ?? 4,
      inclinacao: sorteio(chave, 6) > 0.94 ? (sorteio(chave, 1) > 0.5 ? 3 : -3) : 0,
    }
  })
}
