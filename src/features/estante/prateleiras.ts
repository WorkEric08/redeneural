import {
  chaveDoLugar,
  LUGARES_POR_PRATELEIRA,
  type EstiloDaLombada,
  type Livro,
  type Vaga,
} from '@/core'
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
/**
 * O tom dos detalhes da forma do enfeite (a faixa, o fio, o bloco de cima da
 * "duas cores"). Os livros da pessoa misturam o detalhe com o texto claro; no
 * enfeite isso dava luz branca no alto, então aqui o detalhe é um azul mais
 * escuro que o fundo — sulco, nunca brilho.
 */
export const TOM_DO_DETALHE_DO_ENFEITE = '#070d2e'
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

/** A largura de um livro na fileira: a escolhida na mão, ou a da semente do id. */
export function larguraDoLivroGravado(livro: Pick<Livro, 'id' | 'larguraLombada'>): number {
  const [a] = semente(livro.id)
  return livro.larguraLombada ?? Math.round(30 + a * 16)
}

function larguraDoLivro(item: LivroNaEstante): number {
  return larguraDoLivroGravado(item.livro)
}

/**
 * As laterais do móvel são sólidas: nenhum livro passa delas nem fica cortado
 * ao meio. Quem cede é o enfeite — e a vaga, que tem a largura dele —: ele
 * encolhe até esta largura, a versão mais fina possível, para os livros
 * caberem inteiros. (06/10/2026; antes os livros somiam atrás da pilastra da
 * direita.)
 */
export const LARGURA_MINIMA_DO_ENFEITE = 10

/** O espaço entre dois lugares da fileira — o `gap` de `.movel-fila`. */
const FOLGA_ENTRE_LUGARES = 1

/** A menor lombada que um livro pode ter (a "Fina" do formulário). */
export const LARGURA_MINIMA_DO_LIVRO = 24

/** Quanto os livros, sozinhos, ocupam da fileira — com a folga entre eles. */
export function larguraDosLivros(larguras: readonly number[]): number {
  if (larguras.length === 0) return 0
  return larguras.reduce((total, w) => total + w, 0) + (larguras.length - 1) * FOLGA_ENTRE_LUGARES
}

/** O que os livros de uma prateleira ocupam, dado o estado da estante. */
export function larguraDosLivrosDaPrateleira(
  livros: readonly Pick<Livro, 'id' | 'larguraLombada' | 'prateleira'>[],
  prateleira: number,
): number {
  return larguraDosLivros(
    livros.filter((l) => l.prateleira === prateleira).map(larguraDoLivroGravado),
  )
}

/**
 * Uma mudança deixa a prateleira pior se os livros dela passam a ocupar mais
 * do que a fileira tem. Quem já estava além do limite (uma tela mais estreita
 * que a de quando o livro foi guardado) pode ser mexido, desde que não piore.
 */
export function cabeNaPrateleira(antes: number, depois: number, larguraUtil: number): boolean {
  return depois <= larguraUtil || depois <= antes
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

function larguraComEscala(natural: number, escala: number): number {
  return Math.max(LARGURA_MINIMA_DO_ENFEITE, Math.round(natural * escala))
}

/** A fileira de `lugares`, na escala dada (1 = enfeites e vagas do tamanho de sempre). */
function larguraDaFileira(lugares: readonly Lugar[], escala: number): number {
  const larguras = lugares.map((l) =>
    l.tipo === 'livro' ? l.largura : larguraComEscala(l.largura, escala),
  )
  return larguras.reduce((total, w) => total + w, 0) + (larguras.length - 1) * FOLGA_ENTRE_LUGARES
}

/**
 * Faz a fileira caber entre as laterais sem cortar nenhum livro.
 *
 * Só o que vem até o último livro é protegido — depois dele é enfeite, e
 * enfeite pode ficar atrás da lateral. Em ordem:
 *
 * 1. cabe do tamanho de sempre: não muda nada;
 * 2. senão, enfeites e vagas encolhem na mesma escala, até a largura mínima;
 * 3. senão, enfeites e vagas somem, do mais perto da lateral para o mais
 *    longe, até os livros caberem (só aparência: nada é gravado). Se os livros
 *    sozinhos passam da fileira, não há o que fazer — o resto da conta avisa.
 *
 * A escala vale também para o que vem depois do último livro, para o enfeite não
 * mudar de espessura no meio da prateleira.
 */
export function ajustarALargura(lugares: readonly Lugar[], larguraUtil: number): Lugar[] {
  let ultimo = -1
  lugares.forEach((l, i) => {
    if (l.tipo === 'livro') ultimo = i
  })
  if (ultimo < 0 || larguraDaFileira(lugares.slice(0, ultimo + 1), 1) <= larguraUtil) {
    return [...lugares]
  }

  let protegidos = lugares.slice(0, ultimo + 1)
  const tail = lugares.slice(ultimo + 1)
  let semEnfeites = [...protegidos]

  // Passo 3: tira os que não são livro, do fim para o começo, até caber na escala mínima.
  const removidos = new Set<number>()
  for (
    let i = protegidos.length - 1;
    i >= 0 && larguraDaFileira(semEnfeites, 0) > larguraUtil;
    i -= 1
  ) {
    if (protegidos[i]?.tipo === 'livro') continue
    removidos.add(i)
    semEnfeites = protegidos.filter((_, j) => !removidos.has(j))
  }
  protegidos = semEnfeites

  // Passo 2: a maior escala em que o que sobrou cabe (a conta só cresce com a escala).
  let baixo = 0
  let alto = 1
  for (let k = 0; k < 24; k += 1) {
    const meio = (baixo + alto) / 2
    if (larguraDaFileira(protegidos, meio) <= larguraUtil) baixo = meio
    else alto = meio
  }
  const escala = baixo

  return [...protegidos, ...tail].map((l): Lugar =>
    l.tipo === 'livro' ? l : { ...l, largura: larguraComEscala(l.largura, escala) },
  )
}

export function montarPrateleiras(
  estante: readonly LivroNaEstante[],
  vagas: readonly Vaga[],
  quantidadeDePrateleiras: number,
  /**
   * Quanto a fileira tem entre as laterais, em px — medido na tela. Sem ele (ainda
   * não medido, ou nos testes), a fileira fica do tamanho de sempre.
   */
  larguraUtil?: number,
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

    const todos = [...lugaresComGrupo, ...transbordo]

    return {
      chave: `p${String(prateleira)}`,
      lugares: larguraUtil === undefined ? todos : ajustarALargura(todos, larguraUtil),
    }
  })
}
