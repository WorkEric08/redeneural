import type { Id, Vaga } from './types'

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
export function moverLivroNaEstante<T extends NoLugar>(
  livros: readonly T[],
  id: Id,
  prateleiraDestino: number,
  lugar: number,
): T[] | null {
  if (!livros.some((l) => l.id === id)) return [...livros]

  const alvo = dentro(lugar)
  const ocupados = ocupacao(livros, prateleiraDestino, id)
  const novoLugar = new Map<Id, number>()

  if (ocupados.has(alvo)) {
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
  }

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
