import type { DadosDoEnfeite, EnfeiteGravado, Id, Vaga } from './types'

/**
 * Os lugares de uma prateleira.
 *
 * Desde 14/09/2026 a prateleira é uma **fileira de lugares fixos**, e não mais
 * uma lista compacta: `ordem` é o lugar (0..`LUGARES_POR_PRATELEIRA`-1) e pode
 * haver buraco entre dois livros. Tirar um livro não faz ninguém andar — a
 * vaga fica aberta, e é a pessoa que decide o que vai nela (ver `Vaga` em
 * `types.ts`).
 *
 * Puras de propósito: a store usa para mostrar o movimento antes de o banco
 * confirmar, e o repositório usa para gravar — os dois precisam chegar
 * exatamente no mesmo resultado, ou a estante pisca para um lado e volta para
 * o outro.
 */

/**
 * Quantos lugares uma prateleira tem.
 *
 * O mesmo 26 que era a quantidade de enfeites decorativos: é o bastante para
 * transbordar a prateleira mais larga que a tela permite (o `max-w-2xl` do
 * `<main>`, 672 px) e ser cortado na pilastra da direita, como numa estante
 * cheia. Um número maior só criaria lugar que ninguém alcança.
 */
export const LUGARES_POR_PRATELEIRA = 26

/** O teto que Ajustes deixa escolher — decisão do usuário (15/09/2026). */
export const MAXIMO_DE_PRATELEIRAS = 6

interface NoLugar {
  id: Id
  prateleira: number
  ordem: number
}

/** Para comparar lugares num `Set` — um par de números não tem igualdade de valor. */
export function chaveDoLugar(l: { prateleira: number; ordem: number }): string {
  return `${String(l.prateleira)}:${String(l.ordem)}`
}

/** Lugar → livro, só da prateleira pedida. Enfeite e vaga não ocupam nada aqui. */
function ocupacao(livros: readonly NoLugar[], prateleira: number, exceto?: Id): Map<number, Id> {
  const mapa = new Map<number, Id>()
  for (const l of livros) {
    if (l.prateleira !== prateleira || l.id === exceto) continue
    mapa.set(l.ordem, l.id)
  }
  return mapa
}

function dentro(lugar: number): number {
  return Math.min(Math.max(0, Math.trunc(lugar)), LUGARES_POR_PRATELEIRA - 1)
}

/**
 * O primeiro lugar sem livro a partir de `apartirDe` e, se não houver nenhum
 * depois dele, o último livre antes. `null` só numa prateleira cheia de livros.
 *
 * É por onde um livro novo entra quando ninguém escolheu o lugar.
 */
export function primeiroLugarLivre(
  livros: readonly NoLugar[],
  prateleira: number,
  apartirDe = 0,
): number | null {
  const ocupados = ocupacao(livros, prateleira)
  const inicio = dentro(apartirDe)

  for (let i = inicio; i < LUGARES_POR_PRATELEIRA; i += 1) if (!ocupados.has(i)) return i
  for (let i = inicio - 1; i >= 0; i -= 1) if (!ocupados.has(i)) return i
  return null
}

/**
 * O primeiro lugar sem livro da estante inteira, da prateleira de cima para
 * baixo. É onde nasce um livro criado sem ninguém ter tocado num lugar — o
 * livro novo que a pergunta do porto oferece. `null` com a estante cheia.
 */
export function primeiroLugarDaEstante(
  livros: readonly NoLugar[],
  quantidadeDePrateleiras: number,
): { prateleira: number; lugar: number } | null {
  for (let prateleira = 0; prateleira < quantidadeDePrateleiras; prateleira += 1) {
    const lugar = primeiroLugarLivre(livros, prateleira)
    if (lugar !== null) return { prateleira, lugar }
  }
  return null
}

/** O buraco mais perto do alvo: primeiro à direita, senão à esquerda. */
function vagaMaisProxima(ocupados: ReadonlyMap<number, Id>, alvo: number): number | null {
  for (let i = alvo + 1; i < LUGARES_POR_PRATELEIRA; i += 1) if (!ocupados.has(i)) return i
  for (let i = alvo - 1; i >= 0; i -= 1) if (!ocupados.has(i)) return i
  return null
}

/**
 * Põe o livro no lugar pedido.
 *
 * - Lugar livre (vazio, ou com enfeite — que é cenário, não objeto que ocupe):
 *   só o livro se move, ninguém mais anda.
 * - Lugar com outro livro: empurra a fila até o primeiro buraco à direita;
 *   sem buraco à direita, empurra para a esquerda. É a "bandeja de apps do
 *   Android", agora dentro de uma grade em vez de uma lista.
 * - Prateleira cheia de livros: `null` — e nada muda.
 *
 * O lugar que o livro deixou **fica aberto**. Quem grava é que decide se ele
 * vira vaga à mostra (ver `DexieRepo.moverLivro`); aqui ninguém volta sozinho.
 */
/**
 * Quem anda para o lugar `alvo` ficar livre: a fila inteira até o buraco mais
 * perto, um lugar para o lado. Mapa vazio se o lugar já estava livre; `null` se
 * a prateleira não tem buraco nenhum.
 */
function empurrarParaAbrir(
  ocupados: ReadonlyMap<number, Id>,
  alvo: number,
): Map<Id, number> | null {
  const novoLugar = new Map<Id, number>()
  if (!ocupados.has(alvo)) return novoLugar

  const livre = vagaMaisProxima(ocupados, alvo)
  if (livre === null) return null

  if (livre > alvo) {
    for (let k = livre - 1; k >= alvo; k -= 1) {
      const empurrado = ocupados.get(k)
      if (empurrado !== undefined) novoLugar.set(empurrado, k + 1)
    }
  } else {
    for (let k = livre + 1; k <= alvo; k += 1) {
      const empurrado = ocupados.get(k)
      if (empurrado !== undefined) novoLugar.set(empurrado, k - 1)
    }
  }
  return novoLugar
}

export function moverLivroNaEstante<T extends NoLugar>(
  livros: readonly T[],
  id: Id,
  prateleiraDestino: number,
  lugar: number,
): T[] | null {
  if (!livros.some((l) => l.id === id)) return [...livros]

  const alvo = dentro(lugar)
  const novoLugar = empurrarParaAbrir(ocupacao(livros, prateleiraDestino, id), alvo)
  if (novoLugar === null) return null

  novoLugar.set(id, alvo)

  return livros.map((l) => {
    const destino = novoLugar.get(l.id)
    if (destino === undefined) return l
    return { ...l, prateleira: prateleiraDestino, ordem: destino }
  })
}

/**
 * As vagas depois de `moverLivroNaEstante`: fecha a de todo lugar onde um
 * livro chegou, e abre a do lugar de onde o livro saiu — a não ser que o
 * empurrão tenha posto alguém nele.
 */
export function vagasDepoisDeMover(
  vagas: readonly Vaga[],
  antes: readonly NoLugar[],
  depois: readonly NoLugar[],
  id: Id,
): Vaga[] {
  const ocupados = new Set(depois.map(chaveDoLugar))
  const resultado = vagas.filter((v) => !ocupados.has(chaveDoLugar(v)))

  const origem = antes.find((l) => l.id === id)
  if (origem && !ocupados.has(chaveDoLugar(origem))) {
    const jaAberta = resultado.some((v) => chaveDoLugar(v) === chaveDoLugar(origem))
    if (!jaAberta) resultado.push({ prateleira: origem.prateleira, ordem: origem.ordem })
  }

  return resultado
}

/** O que a estante grava além dos livros: os lugares abertos e os enfeites definidos. */
export interface LugaresDaEstante<T extends NoLugar> {
  livros: T[]
  vagas: Vaga[]
  enfeites: EnfeiteGravado[]
}

/**
 * Os enfeites gravados depois de livros chegarem a lugares: nenhum sobrevive
 * embaixo de um livro — a mesma regra das vagas (`vagasDepoisDeMover`).
 */
export function enfeitesSemLivroEmCima(
  enfeites: readonly EnfeiteGravado[],
  livros: readonly NoLugar[],
): EnfeiteGravado[] {
  const ocupados = new Set(livros.map(chaveDoLugar))
  return enfeites.filter((e) => !ocupados.has(chaveDoLugar(e)))
}

/**
 * Põe o enfeite do lugar `origem` no lugar `destino`, com as mesmas regras do
 * livro (escolha do usuário, 07/10/2026):
 *
 * - Destino sem livro (outro enfeite, ou vaga): só o enfeite se move, e o que
 *   estava ali — o enfeite de lá, ou a vaga — dá lugar a ele.
 * - Destino com livro: a fila empurra até o buraco mais perto, como entre livros.
 *   Prateleira sem buraco: `null`, e nada muda.
 *
 * O lugar de onde o enfeite saiu **fica aberto** (vaga) — nada anda sozinho —, a
 * não ser que um livro empurrado tenha chegado a ele. `dados` é o que a tela
 * mostrava no enfeite: sorteado ou gravado, ele vai com a mesma cara.
 */
export function moverEnfeiteNaEstante<T extends NoLugar>(
  estado: {
    livros: readonly T[]
    vagas: readonly Vaga[]
    enfeites: readonly EnfeiteGravado[]
  },
  origem: Vaga,
  destino: Vaga,
  dados: DadosDoEnfeite,
): LugaresDaEstante<T> | null {
  const alvo = dentro(destino.ordem)
  if (origem.prateleira === destino.prateleira && origem.ordem === alvo) {
    return {
      livros: [...estado.livros],
      vagas: [...estado.vagas],
      enfeites: [...estado.enfeites],
    }
  }

  const novoLugar = empurrarParaAbrir(ocupacao(estado.livros, destino.prateleira), alvo)
  if (novoLugar === null) return null

  const livros = estado.livros.map((l) => {
    const lugar = novoLugar.get(l.id)
    return lugar === undefined ? l : { ...l, prateleira: destino.prateleira, ordem: lugar }
  })
  const ocupados = new Set(livros.map(chaveDoLugar))
  const chaveDaOrigem = chaveDoLugar(origem)
  const chaveDoAlvo = chaveDoLugar({ prateleira: destino.prateleira, ordem: alvo })

  const enfeites = estado.enfeites.filter((e) => {
    const chave = chaveDoLugar(e)
    return chave !== chaveDaOrigem && chave !== chaveDoAlvo && !ocupados.has(chave)
  })
  enfeites.push({ ...dados, prateleira: destino.prateleira, ordem: alvo })

  const vagas = estado.vagas.filter((v) => {
    const chave = chaveDoLugar(v)
    return chave !== chaveDoAlvo && !ocupados.has(chave)
  })
  if (!ocupados.has(chaveDaOrigem) && !vagas.some((v) => chaveDoLugar(v) === chaveDaOrigem)) {
    vagas.push({ prateleira: origem.prateleira, ordem: origem.ordem })
  }

  return { livros, vagas, enfeites }
}
