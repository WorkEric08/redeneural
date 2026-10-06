import { chaveDoLugar, LUGARES_POR_PRATELEIRA, type EstiloDaLombada, type Vaga } from '@/core'
import { semente, sorteio } from '@/lib/semente'

import type { LivroNaEstante } from './resumo'

/**
 * Como os lugares de cada prateleira se enchem.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). **Determinístico**, pela
 * mesma razão do layout da rede: a estante é mobília, e mobília que se remexe
 * a cada sessão não serve de palácio da memória. Toda variação — forma, altura e
 * largura dos enfeites, e a largura da lombada de verdade quando ninguém a escolheu na
 * mão (Fase 19, `Livro.larguraLombada`) — sai de uma semente.
 *
 * Desde 14/09/2026 cada prateleira é uma fileira de `LUGARES_POR_PRATELEIRA`
 * lugares, e cada lugar tem uma de três coisas:
 *
 * - um **livro** seu, no lugar que `Livro.ordem` diz;
 * - uma **vaga**, se a pessoa deixou o lugar aberto (`Vaga`);
 * - senão, um **enfeite**: a parte da biblioteca que ainda não foi escrita.
 *   Lombada azul sem título, que só existe para o móvel ter a densidade de
 *   uma estante de verdade.
 */

/** Em % da fileira, como a lombada de verdade — ver .movel-fila. */
export const ALTURA_MINIMA_DA_LOMBADA = 63
export const ALTURA_MAXIMA_DA_LOMBADA = 93.5

/**
 * O enfeite é sempre o Azul base da paleta Noite, sem título, sem emblema e
 * sem contagem. O que varia é a forma, a altura e a largura — tudo sorteado
 * pelo lugar (prateleira, ordem), então o mesmo lugar dá sempre o mesmo
 * enfeite (estilo Noite, 06/10/2026; antes todos tinham o mesmo tamanho).
 */
export const COR_DO_ENFEITE = '#1B2A6B'
const ESTILOS_DO_ENFEITE = ['solido', 'faixa', 'duas-cores', 'fio', 'degrade'] as const
const LARGURAS_DO_ENFEITE = [24, 38, 52] as const

/** Os filetes dourados saem num em cada 5 enfeites isolados — e em todo grupo. */
const CHANCE_DO_DOURADO = 0.2

export type Lugar =
  | { tipo: 'livro'; indice: number; item: LivroNaEstante; largura: number }
  | {
      tipo: 'enfeite'
      indice: number
      largura: number
      /** Em % da fileira, como a lombada de verdade — ver .movel-fila. */
      altura: number
      estilo: EstiloDaLombada
      /** Os filetes dourados de acabamento — de grupo ou sorteados. */
      dourado: boolean
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

function chaveDoEnfeite(prateleira: number, indice: number): string {
  return `e${String(prateleira)}-${String(indice)}`
}

/**
 * A largura que o enfeite deste lugar tem — e que a vaga dele também tem: tirar
 * o enfeite abre o buraco exato dele, sem a fileira andar.
 */
function larguraDoLugar(prateleira: number, indice: number): number {
  const sorteado = sorteio(chaveDoEnfeite(prateleira, indice), 13)
  return LARGURAS_DO_ENFEITE[Math.floor(sorteado * LARGURAS_DO_ENFEITE.length)] ?? 38
}

/**
 * Tudo do enfeite sai do lugar, e não da posição dele numa lista: pôr ou tirar
 * um livro ao lado não troca a forma, a altura nem a largura. Só o dourado olha
 * os vizinhos (ver `montarPrateleiras`).
 */
function enfeite(prateleira: number, indice: number): Lugar {
  const chave = chaveDoEnfeite(prateleira, indice)
  return {
    tipo: 'enfeite',
    indice,
    largura: larguraDoLugar(prateleira, indice),
    altura:
      ALTURA_MINIMA_DA_LOMBADA +
      sorteio(chave, 5) * (ALTURA_MAXIMA_DA_LOMBADA - ALTURA_MINIMA_DA_LOMBADA),
    estilo:
      ESTILOS_DO_ENFEITE[Math.floor(sorteio(chave, 11) * ESTILOS_DO_ENFEITE.length)] ?? 'solido',
    dourado: sorteio(chave, 17) < CHANCE_DO_DOURADO,
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
      if (abertas.has(chave))
        return { tipo: 'vazio', indice, largura: larguraDoLugar(prateleira, indice) }
      return enfeite(prateleira, indice)
    })

    // O enfeite que tem outro enfeite ao lado forma um grupo, e o grupo leva os
    // filetes dourados — o que sobra de enfeite isolado só os leva se o sorteio
    // pedir.
    const lugaresComGrupo = lugares.map((l, i): Lugar =>
      l.tipo === 'enfeite'
        ? {
            ...l,
            dourado:
              l.dourado || lugares[i - 1]?.tipo === 'enfeite' || lugares[i + 1]?.tipo === 'enfeite',
          }
        : l,
    )

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

    return { chave: `p${String(prateleira)}`, lugares: [...lugaresComGrupo, ...transbordo] }
  })
}
