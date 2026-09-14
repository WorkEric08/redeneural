import { chaveDoLugar, LUGARES_POR_PRATELEIRA, type Vaga } from '@/core'
import { semente, sorteio } from '@/lib/semente'

import type { LivroNaEstante } from './resumo'

/**
 * Como os lugares de cada prateleira se enchem.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). **Determinístico**, pela
 * mesma razão do layout da rede: a estante é mobília, e mobília que se remexe
 * a cada sessão não serve de palácio da memória. Toda variação — cor dos
 * enfeites, e a largura da lombada de verdade quando ninguém a escolheu na
 * mão (Fase 19, `Livro.larguraLombada`) — sai de uma semente.
 *
 * Desde 14/09/2026 cada prateleira é uma fileira de `LUGARES_POR_PRATELEIRA`
 * lugares, e cada lugar tem uma de três coisas:
 *
 * - um **livro** seu, no lugar que `Livro.ordem` diz;
 * - uma **vaga**, se a pessoa deixou o lugar aberto (`Vaga`);
 * - senão, um **enfeite**: a parte da biblioteca que ainda não foi escrita.
 *   Lombada escura, sem título, que só existe para o móvel ter a densidade de
 *   uma estante de verdade. A luz não a alcança — quem ela alcança são os seus
 *   livros, e é isso que os faz saltar no meio delas.
 */

/**
 * Os panos que a estante usa nos enfeites, com peso.
 *
 * Quase tudo azul, um pouco de verde-azulado e violeta, e um livro quente de
 * vez em quando. É a referência virando regra: sob luz de lua a biblioteca
 * inteira tende ao azul, e é a raridade do couro claro que dá o ponto de calor.
 * Magenta e verde ficaram de fora — sob esta luz eles não desbotam, gritam.
 */
const PANOS = [4, 4, 4, 4, 4, 2, 2, 1, 1, 3]

/**
 * Todo enfeite tem o mesmo tamanho — só a cor varia (pedido do usuário,
 * 14/09/2026). Mesmo teto dos livros de verdade (ver Lombada.tsx): um enfeite
 * maior que o maior livro possível ia parecer erro, não decoração.
 *
 * A vaga tem a mesma largura de propósito: tirar um enfeite abre o buraco
 * exato dele, sem a fileira andar.
 */
export const LARGURA_DO_ENFEITE = 30
const ALTURA_DO_ENFEITE = 80

export type Lugar =
  | { tipo: 'livro'; indice: number; item: LivroNaEstante; largura: number }
  | {
      tipo: 'enfeite'
      indice: number
      largura: number
      /** Em % da fileira, como a lombada de verdade — ver .movel-fila. */
      altura: number
      /** 0..1 — quanto da luz da sala chega neste livro. */
      luz: number
      /** Qual pano de encadernação, 1..6 — o luar desbota todos para o mesmo azul. */
      pano: number
    }
  | { tipo: 'vazio'; indice: number; largura: number }

export interface Prateleira {
  chave: string
  lugares: Lugar[]
}

function larguraDoLivro(item: LivroNaEstante): number {
  const [a] = semente(item.livro.id)
  return item.livro.larguraLombada ?? Math.round(30 + a * 16)
}

/**
 * A cor de um enfeite sai do lugar, e não da posição dele numa lista: tirar
 * ou pôr um livro ao lado não troca a cor do enfeite vizinho.
 */
function enfeite(prateleira: number, indice: number): Lugar {
  const chave = `e${String(prateleira)}-${String(indice)}`
  return {
    tipo: 'enfeite',
    indice,
    largura: LARGURA_DO_ENFEITE,
    altura: ALTURA_DO_ENFEITE,
    luz: sorteio(chave, 3),
    pano: PANOS[Math.floor(sorteio(chave, 7) * PANOS.length)] ?? 4,
  }
}

export function montarPrateleiras(
  estante: readonly LivroNaEstante[],
  vagas: readonly Vaga[],
  quantidadeDePrateleiras: number,
): Prateleira[] {
  const livroNoLugar = new Map(estante.map((item) => [chaveDoLugar(item.livro), item]))
  const abertas = new Set(vagas.map(chaveDoLugar))

  return Array.from({ length: quantidadeDePrateleiras }, (_, prateleira) => {
    const lugares = Array.from({ length: LUGARES_POR_PRATELEIRA }, (_, indice): Lugar => {
      const chave = chaveDoLugar({ prateleira, ordem: indice })
      const item = livroNoLugar.get(chave)
      if (item) return { tipo: 'livro', indice, item, largura: larguraDoLivro(item) }
      if (abertas.has(chave)) return { tipo: 'vazio', indice, largura: LARGURA_DO_ENFEITE }
      return enfeite(prateleira, indice)
    })

    // Livro fora da grade (de antes dos lugares, numa prateleira com mais de
    // 26 livros): continua existindo, depois do último lugar, onde a pilastra
    // da direita já o esconderia de qualquer jeito.
    const transbordo = estante
      .filter((e) => e.livro.prateleira === prateleira && e.livro.ordem >= LUGARES_POR_PRATELEIRA)
      .sort((a, b) => a.livro.ordem - b.livro.ordem)
      .map((item): Lugar => ({
        tipo: 'livro',
        indice: item.livro.ordem,
        item,
        largura: larguraDoLivro(item),
      }))

    return { chave: `p${String(prateleira)}`, lugares: [...lugares, ...transbordo] }
  })
}
