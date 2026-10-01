import { ehPonte, type Conexao, type Id, type MapaDoPalacio, type Ponto } from '@/core'

import { ESCALA_DE_PERTO } from './ilha'

/**
 * As pontes do Mapa: em vez de um fio por conexão entre livros — que de longe
 * vira novelo —, **uma ponte por par de ilhas**, tanto mais grossa quanto mais
 * conexões os dois livros têm entre si. Puro: a tela só desenha e toca.
 */

/** Uma conexão da ponte, com `aId` sempre do `livroA` e `bId` do `livroB`. */
export interface ParDaPonte {
  aId: Id
  bId: Id
  score: number
}

export interface PonteAgrupada {
  /** `livroA::livroB`, com `livroA` o menor id: o mesmo par nunca vira duas. */
  chave: string
  livroA: Id
  livroB: Id
  quantidade: number
  /** A soma dos scores — desempata duas pontes com a mesma quantidade. */
  soma: number
  /** Do par mais parecido para o menos. */
  pares: ParDaPonte[]
}

export function chaveDaPonte(livroA: Id, livroB: Id): string {
  return livroA < livroB ? `${livroA}::${livroB}` : `${livroB}::${livroA}`
}

const comparar = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/**
 * As pontes agrupadas, da mais forte para a mais fraca: mais conexões, depois
 * maior soma de scores, depois a chave — sempre a mesma ordem, em qualquer
 * ordem de entrada. Neurônio no porto não tem ilha, e não entra em ponte.
 */
export function agruparPontes(
  conexoes: readonly Conexao[],
  livroDe: ReadonlyMap<Id, Id | null>,
): PonteAgrupada[] {
  const grupos = new Map<string, PonteAgrupada>()
  for (const c of conexoes) {
    const la = livroDe.get(c.aId) ?? null
    const lb = livroDe.get(c.bId) ?? null
    if (la === null || lb === null || !ehPonte(la, lb)) continue

    const par: ParDaPonte =
      la < lb
        ? { aId: c.aId, bId: c.bId, score: c.score }
        : { aId: c.bId, bId: c.aId, score: c.score }
    const chave = chaveDaPonte(la, lb)
    const grupo = grupos.get(chave)
    if (grupo) {
      grupo.quantidade++
      grupo.soma += c.score
      grupo.pares.push(par)
    } else {
      const [livroA, livroB] = la < lb ? [la, lb] : [lb, la]
      grupos.set(chave, { chave, livroA, livroB, quantidade: 1, soma: c.score, pares: [par] })
    }
  }

  const pontes = [...grupos.values()]
  for (const p of pontes) {
    p.pares.sort((x, y) => y.score - x.score || comparar(x.aId, y.aId) || comparar(x.bId, y.bId))
  }
  return pontes.sort(
    (x, y) => y.quantidade - x.quantidade || y.soma - x.soma || comparar(x.chave, y.chave),
  )
}

/** De longe, cada ilha mostra só as suas pontes mais fortes. */
export const PONTES_POR_ILHA = 3

/**
 * As pontes que aparecem de longe: as `porIlha` mais fortes **de cada ilha**.
 * Uma ponte aparece se é das mais fortes de qualquer um dos dois lados — senão
 * uma ilha pequena, cuja única ponte vai para um livro cheio de pontes,
 * ficaria sem nenhuma. Recebe as pontes já em ordem de força
 * (`agruparPontes`) e devolve na mesma ordem.
 */
export function pontesAMostra(
  pontes: readonly PonteAgrupada[],
  porIlha: number = PONTES_POR_ILHA,
): PonteAgrupada[] {
  const vistas = new Map<Id, number>()
  const escolhidas: PonteAgrupada[] = []
  for (const p of pontes) {
    const a = vistas.get(p.livroA) ?? 0
    const b = vistas.get(p.livroB) ?? 0
    if (a < porIlha || b < porIlha) escolhidas.push(p)
    vistas.set(p.livroA, a + 1)
    vistas.set(p.livroB, b + 1)
  }
  return escolhidas
}

/**
 * As pontes desenhadas agora: de perto, ou com "Ver todas as pontes", todas;
 * de longe, só as mais fortes de cada ilha. O desenho e o toque usam a mesma
 * conta — uma ponte escondida não pode ser tocada.
 */
export function pontesVisiveis(
  pontes: readonly PonteAgrupada[],
  escala: number,
  todas: boolean,
): readonly PonteAgrupada[] {
  return todas || escala >= ESCALA_DE_PERTO ? pontes : pontesAMostra(pontes)
}

/** O teto da espessura, em px de tela: um par muito ligado não vira faixa. */
export const ESPESSURA_MAXIMA_DA_PONTE = 7

/**
 * A espessura da ponte em px de tela: cresce com a quantidade de conexões e
 * para no teto. A de uma conexão só (1,5 px) já é mais grossa que a trilha
 * (menos de 1 px) — trilha e ponte se distinguem pela espessura e pelo
 * tracejado, não só pela cor.
 */
export function espessuraDaPonte(quantidade: number): number {
  return Math.min(ESPESSURA_MAXIMA_DA_PONTE, 1.5 + Math.max(0, quantidade - 1) * 0.9)
}

/** A distância de um ponto até um segmento. */
export function distanciaAoSegmento(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const comprimento2 = dx * dx + dy * dy
  const t =
    comprimento2 === 0
      ? 0
      : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / comprimento2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/**
 * A ponte debaixo do dedo, a mais perto dentro da tolerância. A ponte vai de
 * centro a centro e é desenhada por baixo das ilhas — a terra cobre o que está
 * dentro delas. Por isso quem chama confere a terra antes (`ilhaEm`): um toque
 * no mar perto da linha só pode estar na parte que se vê.
 */
export function ponteEm(
  ponto: Ponto,
  pontes: readonly PonteAgrupada[],
  mapa: MapaDoPalacio,
  tolerancia: number,
): PonteAgrupada | null {
  let melhor: { ponte: PonteAgrupada; d: number } | null = null
  for (const ponte of pontes) {
    const a = mapa.ilhas[ponte.livroA]
    const b = mapa.ilhas[ponte.livroB]
    if (!a || !b) continue
    const d = distanciaAoSegmento(ponto, a.centro, b.centro)
    if (d > tolerancia) continue
    if (melhor === null || d < melhor.d) melhor = { ponte, d }
  }
  return melhor?.ponte ?? null
}
