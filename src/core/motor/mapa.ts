import { semente } from '@/lib/semente'

import type { Id } from '../domain/types'

import type { Ponto } from './redeLayout'
import { centralizar, normalizar, produtoInterno } from './vetores'

/**
 * O Mapa: o palácio como arquipélago. Cada livro de conceitos é uma ilha, e
 * cada neurônio, um ponto dentro dela.
 *
 * A promessa é a da memória espacial: o mapa é **sempre o mesmo** entre uma
 * abertura e outra, e crescer não remexe o que já estava lá. Por isso tudo é
 * gravado, e o que muda depois é encaixe — um neurônio novo entra perto dos
 * parecidos sem mover ninguém, uma ilha nova entra perto da mais parecida, e
 * uma ilha que cresceu e encostou noutra anda o mínimo, sozinha. Refazer o mapa
 * inteiro (`mapaCompleto`) só na primeira vez, ou quando a pessoa pede.
 *
 * Puro: zero DOM, zero Worker. Determinístico: nada de `Math.random`, e toda
 * lista é percorrida em ordem de id — a ordem do IndexedDB não é garantida.
 */

export interface IlhaDoMapa {
  centro: Ponto
  raio: number
  /** Cada neurônio relativo ao centro da ilha: mover a ilha leva os pontos junto. */
  pontos: Record<Id, Ponto>
}

export interface MapaDoPalacio {
  /** Por livro. Livro vazio não tem ilha. */
  ilhas: Record<Id, IlhaDoMapa>
}

export const MAPA_VAZIO: MapaDoPalacio = { ilhas: {} }

/** O que o mapa precisa saber de um neurônio. Só os de livro de conceitos — o porto fica fora. */
export interface NoDoMapa {
  id: Id
  livroId: Id
  embedding: Float32Array | null
}

/** A ilha de um livro de poucos neurônios ainda tem tamanho de ilha. */
export const RAIO_MINIMO_DA_ILHA = 70
/** A área cresce com a quantidade: o raio, com a raiz dela. */
export const RAIO_POR_RAIZ = 34
/** Folga entre o ponto mais de fora e a costa. */
export const MARGEM_DA_COSTA = 16
/** Distância mínima entre dois pontos da mesma ilha. */
export const DISTANCIA_ENTRE_PONTOS = 22
/** O mar entre duas ilhas. */
export const FOLGA_ENTRE_ILHAS = 46

/**
 * Espaço que cada ilha guarda em volta de si para crescer sem encostar: ao
 * dispor ou encaixar ilhas, o raio conta 25% a mais. Sem isto as ilhas
 * nasciam no limite do mar entre elas, e quase todo neurônio novo fazia a sua
 * ilha andar — o contrário da memória espacial. Com a reserva, uma ilha cresce
 * ~56% em neurônios antes de precisar se mexer.
 */
export const RESERVA_DE_CRESCIMENTO = 0.25

function comReserva(raio: number): number {
  return raio * (1 + RESERVA_DE_CRESCIMENTO)
}

/** Abaixo disto a redução para 2D fica instável: disposição simples em espiral. */
export const MINIMO_PARA_REDUZIR = 5

const ANGULO_DOURADO = Math.PI * (3 - Math.sqrt(5))

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function raioDaIlha(quantos: number): number {
  return Math.max(RAIO_MINIMO_DA_ILHA, RAIO_POR_RAIZ * Math.sqrt(quantos))
}

/**
 * O raio que contém os pontos com folga. A ilha é um círculo perfeito (pedido
 * do usuário, 02/10/2026 — antes a costa era orgânica): a costa é o próprio
 * raio, e os pontos moram até `raio − MARGEM_DA_COSTA`.
 */
function raioQueContem(pontos: Iterable<Ponto>, quantos: number): number {
  let maior = 0
  for (const p of pontos) maior = Math.max(maior, Math.hypot(p.x, p.y))
  return Math.max(raioDaIlha(quantos), maior + MARGEM_DA_COSTA)
}

/** Espiral de girassol: n pontos sem amontoar, sempre na mesma ordem. */
function girassol(i: number): Ponto {
  const r = DISTANCIA_ENTRE_PONTOS * 0.95 * Math.sqrt(i + 0.5)
  const a = i * ANGULO_DOURADO
  return { x: Math.cos(a) * r, y: Math.sin(a) * r }
}

// --- redução para 2D ---------------------------------------------------------

/**
 * Os dois eixos principais (PCA) de um conjunto de vetores, por iteração de
 * potência — sem matriz de covariância (384×384) e sem dependência. Partida
 * fixa e sinal decidido pelo primeiro vetor: o mesmo livro dá o mesmo desenho.
 * `null` quando não há variação nenhuma.
 */
function projetarEmDoisEixos(vetores: readonly Float32Array[]): Ponto[] | null {
  const n = vetores.length
  const d = vetores[0]?.length ?? 0
  if (n === 0 || d === 0) return null

  const media = new Float64Array(d)
  for (const v of vetores) for (let j = 0; j < d; j++) media[j] = media[j]! + v[j]! / n
  const linhas = vetores.map((v) => {
    const x = new Float64Array(d)
    for (let j = 0; j < d; j++) x[j] = v[j]! - media[j]!
    return x
  })

  const dot = (a: Float64Array, b: Float64Array): number => {
    let s = 0
    for (let j = 0; j < d; j++) s += a[j]! * b[j]!
    return s
  }
  const normalizarEmLugar = (v: Float64Array): number => {
    const m = Math.sqrt(dot(v, v))
    if (m < 1e-12) return 0
    for (let j = 0; j < d; j++) v[j] = v[j]! / m
    return m
  }

  const eixo = (semente: number, ortogonalA: Float64Array | null): Float64Array | null => {
    let v = new Float64Array(d)
    for (let j = 0; j < d; j++) v[j] = ((((j + 1) * 7919 * semente) % 211) - 105) / 105
    for (let iter = 0; iter < 80; iter++) {
      if (ortogonalA) {
        const p = dot(v, ortogonalA)
        for (let j = 0; j < d; j++) v[j] = v[j]! - p * ortogonalA[j]!
      }
      if (normalizarEmLugar(v) === 0) return null
      const w = new Float64Array(d)
      for (const x of linhas) {
        const p = dot(x, v)
        for (let j = 0; j < d; j++) w[j] = w[j]! + p * x[j]!
      }
      v = w
    }
    if (ortogonalA) {
      const p = dot(v, ortogonalA)
      for (let j = 0; j < d; j++) v[j] = v[j]! - p * ortogonalA[j]!
    }
    return normalizarEmLugar(v) === 0 ? null : v
  }

  const e1 = eixo(1, null)
  if (!e1) return null
  const e2 = eixo(3, e1)

  // O sinal de um autovetor é arbitrário: decide pelo primeiro vetor, para o
  // mesmo livro não sair espelhado de uma vez para outra.
  const primeiro = linhas[0]!
  if (dot(primeiro, e1) < 0) for (let j = 0; j < d; j++) e1[j] = -e1[j]!
  if (e2 && dot(primeiro, e2) < 0) for (let j = 0; j < d; j++) e2[j] = -e2[j]!

  return linhas.map((x) => ({ x: dot(x, e1), y: e2 ? dot(x, e2) : 0 }))
}

/**
 * Afasta pontos colados até a distância mínima — forças acumuladas e aplicadas
 * de uma vez por passo, como na Rede, para não depender da ordem.
 */
function afastarPontos(pontos: Map<Id, Ponto>, fixos: ReadonlySet<Id> = new Set()): void {
  const ids = [...pontos.keys()].sort(comparar)
  for (let passo = 0; passo < 60; passo++) {
    const empurrao = new Map<Id, Ponto>()
    let mexeu = false
    for (let i = 0; i < ids.length; i++) {
      for (let k = i + 1; k < ids.length; k++) {
        const a = pontos.get(ids[i]!)!
        const b = pontos.get(ids[k]!)!
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.hypot(dx, dy)
        if (dist >= DISTANCIA_ENTRE_PONTOS) continue
        if (dist < 1e-6) {
          // Dois no mesmo lugar: a direção sai da semente, não do acaso.
          const ang = semente(`${ids[i]!}|${ids[k]!}`)[0] * 2 * Math.PI
          dx = Math.cos(ang)
          dy = Math.sin(ang)
          dist = 1
        }
        const falta = (DISTANCIA_ENTRE_PONTOS - dist) / 2
        const ux = dx / dist
        const uy = dy / dist
        mexeu = true
        for (const [id, sinal] of [
          [ids[i]!, -1],
          [ids[k]!, 1],
        ] as const) {
          if (fixos.has(id)) continue
          const e = empurrao.get(id) ?? { x: 0, y: 0 }
          empurrao.set(id, { x: e.x + sinal * ux * falta, y: e.y + sinal * uy * falta })
        }
      }
    }
    if (!mexeu) return
    for (const [id, e] of empurrao) {
      const p = pontos.get(id)!
      pontos.set(id, { x: p.x + e.x, y: p.y + e.y })
    }
  }
}

/**
 * Os pontos de uma ilha desenhada do zero: a redução para 2D dos vetores do
 * livro, espalhada para caber na ilha. Com poucos neurônios (ou sem vetor), a
 * espiral de girassol em ordem de id.
 */
export function pontosDaIlha(
  nos: readonly NoDoMapa[],
  centroide: Float32Array | null,
): { pontos: Record<Id, Ponto>; raio: number } {
  const ordenados = [...nos].sort((a, b) => comparar(a.id, b.id))
  const pontos = new Map<Id, Ponto>()

  const comVetor = ordenados.filter(
    (n): n is NoDoMapa & { embedding: Float32Array } => n.embedding !== null,
  )
  const projetados =
    comVetor.length >= MINIMO_PARA_REDUZIR
      ? projetarEmDoisEixos(
          comVetor.map((n) => (centroide ? centralizar(n.embedding, centroide) : n.embedding)),
        )
      : null

  if (projetados) {
    // Espalha até o raio que a quantidade pede, menos a costa.
    const alcance = raioDaIlha(ordenados.length) - MARGEM_DA_COSTA
    const maior = Math.max(...projetados.map((p) => Math.hypot(p.x, p.y)), 1e-9)
    comVetor.forEach((n, i) => {
      const p = projetados[i]!
      pontos.set(n.id, { x: (p.x / maior) * alcance, y: (p.y / maior) * alcance })
    })
    // Quem ainda não tem vetor entra pela espiral, a partir do meio.
    let i = 0
    for (const n of ordenados) if (!pontos.has(n.id)) pontos.set(n.id, girassol(i++))
  } else {
    ordenados.forEach((n, i) => {
      pontos.set(n.id, girassol(i))
    })
  }

  afastarPontos(pontos)
  return {
    pontos: Object.fromEntries(pontos),
    raio: raioQueContem(pontos.values(), ordenados.length),
  }
}

// --- as ilhas entre si -------------------------------------------------------

/** O "assunto" de um livro: a média dos vetores centralizados dele. */
function centroDoLivro(
  nos: readonly NoDoMapa[],
  centroide: Float32Array | null,
): Float32Array | null {
  const vetores = nos
    .map((n) => n.embedding)
    .filter((v): v is Float32Array => v !== null)
    .map((v) => (centroide ? centralizar(v, centroide) : v))
  if (vetores.length === 0) return null
  const soma = new Float32Array(vetores[0]!.length)
  for (const v of vetores) for (let j = 0; j < soma.length; j++) soma[j] = soma[j]! + v[j]!
  return normalizar(soma)
}

function seSobrepoem(
  a: { centro: Ponto; raio: number },
  b: { centro: Ponto; raio: number },
): boolean {
  return (
    Math.hypot(a.centro.x - b.centro.x, a.centro.y - b.centro.y) <
    a.raio + b.raio + FOLGA_ENTRE_ILHAS - 1e-6
  )
}

/**
 * Onde cada ilha fica, do zero: parecidas se puxam, todas se afastam até
 * caberem com o mar entre elas. Partida em espiral por ordem de id, força
 * acumulada por passo, e no fim uma passada que garante que nenhuma encosta.
 */
export function disporIlhas(
  entradas: readonly { id: Id; raio: number; centro: Float32Array | null }[],
): Record<Id, Ponto> {
  // Tudo aqui conta a reserva de crescimento: é o espaço que as ilhas ocupam.
  const ilhas = [...entradas]
    .sort((a, b) => comparar(a.id, b.id))
    .map((e) => ({ ...e, raio: comReserva(e.raio) }))
  if (ilhas.length === 0) return {}

  const raioMedio = ilhas.reduce((s, i) => s + i.raio, 0) / ilhas.length
  const pos = ilhas.map((_, i) => {
    const r = (raioMedio * 2 + FOLGA_ENTRE_ILHAS) * 0.9 * Math.sqrt(i)
    const a = i * ANGULO_DOURADO
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })

  const parecenca = (i: number, k: number): number => {
    const a = ilhas[i]!.centro
    const b = ilhas[k]!.centro
    return a && b ? produtoInterno(a, b) : 0
  }

  for (let passo = 0; passo < 300; passo++) {
    const forca = pos.map(() => ({ x: 0, y: 0 }))
    for (let i = 0; i < ilhas.length; i++) {
      for (let k = i + 1; k < ilhas.length; k++) {
        const dx = pos[k]!.x - pos[i]!.x
        const dy = pos[k]!.y - pos[i]!.y
        const dist = Math.max(Math.hypot(dx, dy), 1e-6)
        const ux = dx / dist
        const uy = dy / dist
        const alvo = ilhas[i]!.raio + ilhas[k]!.raio + FOLGA_ENTRE_ILHAS
        // Perto demais, empurra; longe, só as parecidas se puxam.
        const f =
          dist < alvo ? -(alvo - dist) * 0.5 : Math.max(0, parecenca(i, k)) * (dist - alvo) * 0.05
        forca[i]!.x += ux * f
        forca[i]!.y += uy * f
        forca[k]!.x -= ux * f
        forca[k]!.y -= uy * f
      }
      // Um puxão fraco para o meio: sem ele, quem não se parece com ninguém
      // derivaria para longe.
      forca[i]!.x -= pos[i]!.x * 0.004
      forca[i]!.y -= pos[i]!.y * 0.004
    }
    pos.forEach((p, i) => {
      p.x += forca[i]!.x
      p.y += forca[i]!.y
    })
  }

  separarIlhas(ilhas.map((ilha, i) => ({ id: ilha.id, raio: ilha.raio, centro: pos[i]! })))
  return Object.fromEntries(ilhas.map((ilha, i) => [ilha.id, pos[i]!]))
}

/** Empurra até nenhuma encostar — mexe nos centros em lugar. */
function separarIlhas(ilhas: { id: Id; raio: number; centro: Ponto }[]): void {
  for (let passo = 0; passo < 1000; passo++) {
    let mexeu = false
    for (let i = 0; i < ilhas.length; i++) {
      for (let k = i + 1; k < ilhas.length; k++) {
        const a = ilhas[i]!
        const b = ilhas[k]!
        if (!seSobrepoem(a, b)) continue
        let dx = b.centro.x - a.centro.x
        let dy = b.centro.y - a.centro.y
        let dist = Math.hypot(dx, dy)
        if (dist < 1e-6) {
          const ang = semente(`${a.id}|${b.id}`)[0] * 2 * Math.PI
          dx = Math.cos(ang)
          dy = Math.sin(ang)
          dist = 1
        }
        const falta = (a.raio + b.raio + FOLGA_ENTRE_ILHAS - dist) / 2 + 0.5
        a.centro.x -= (dx / dist) * falta
        a.centro.y -= (dy / dist) * falta
        b.centro.x += (dx / dist) * falta
        b.centro.y += (dy / dist) * falta
        mexeu = true
      }
    }
    if (!mexeu) return
  }
}

function agrupar(nos: readonly NoDoMapa[], livros: ReadonlySet<Id>): Map<Id, NoDoMapa[]> {
  const grupos = new Map<Id, NoDoMapa[]>()
  for (const n of nos) {
    if (!livros.has(n.livroId)) continue
    const lista = grupos.get(n.livroId)
    if (lista) lista.push(n)
    else grupos.set(n.livroId, [n])
  }
  for (const lista of grupos.values()) lista.sort((a, b) => comparar(a.id, b.id))
  return grupos
}

/**
 * O mapa inteiro, do zero — a primeira vez, ou "Reorganizar mapa". `livros` são
 * os livros de conceitos: uma pasta de acervo não vira ilha.
 */
export function mapaCompleto(
  nos: readonly NoDoMapa[],
  livros: ReadonlySet<Id>,
  centroide: Float32Array | null,
): MapaDoPalacio {
  const grupos = agrupar(nos, livros)
  const ilhas: Record<Id, IlhaDoMapa> = {}
  const entradas: { id: Id; raio: number; centro: Float32Array | null }[] = []

  for (const [livroId, membros] of [...grupos].sort((a, b) => comparar(a[0], b[0]))) {
    const { pontos, raio } = pontosDaIlha(membros, centroide)
    ilhas[livroId] = { centro: { x: 0, y: 0 }, raio, pontos }
    entradas.push({ id: livroId, raio, centro: centroDoLivro(membros, centroide) })
  }

  const centros = disporIlhas(entradas)
  for (const [livroId, centro] of Object.entries(centros)) ilhas[livroId]!.centro = centro
  return { ilhas }
}

// --- crescer sem remexer -----------------------------------------------------

/**
 * O lugar de um neurônio novo numa ilha que já existe: a média dos três mais
 * parecidos dali (pesada pela parecença), um passo para o lado decidido pela
 * semente, e — se cair colado em alguém — a espiral para fora até achar vão.
 * Ninguém mais se mexe.
 */
function encaixarPonto(
  novo: NoDoMapa,
  existentes: ReadonlyMap<Id, Ponto>,
  vetores: ReadonlyMap<Id, Float32Array>,
): Ponto {
  let base: Ponto = { x: 0, y: 0 }
  const meu = novo.embedding ? vetores.get(novo.id) : undefined
  if (meu) {
    const parecidos = [...existentes.keys()]
      .map((id) => {
        const v = vetores.get(id)
        return { id, cos: v ? produtoInterno(meu, v) : -Infinity }
      })
      .filter((p) => p.cos > 0)
      .sort((a, b) => b.cos - a.cos || comparar(a.id, b.id))
      .slice(0, 3)
    const peso = parecidos.reduce((s, p) => s + p.cos, 0)
    if (peso > 0) {
      base = parecidos.reduce(
        (acc, p) => {
          const q = existentes.get(p.id)!
          return { x: acc.x + (q.x * p.cos) / peso, y: acc.y + (q.y * p.cos) / peso }
        },
        { x: 0, y: 0 },
      )
    }
  }

  const angulo = semente(novo.id)[0] * 2 * Math.PI
  for (let passo = 0; passo < 400; passo++) {
    // O primeiro passo é curto: só o bastante para não nascer em cima da média.
    const r = DISTANCIA_ENTRE_PONTOS * (passo === 0 ? 0.3 : 0.6 + 0.35 * passo)
    const a = angulo + passo * ANGULO_DOURADO
    const p = { x: base.x + Math.cos(a) * r, y: base.y + Math.sin(a) * r }
    const livre = [...existentes.values()].every(
      (q) => Math.hypot(q.x - p.x, q.y - p.y) >= DISTANCIA_ENTRE_PONTOS,
    )
    if (livre) return p
  }
  return base
}

/**
 * O lugar de uma ilha nova: perto da mais parecida, a um mar de distância,
 * no primeiro ângulo livre — a volta começa pela semente do livro. Sem nenhuma
 * parecida, em volta do meio do que já existe.
 */
function encaixarIlha(
  livroId: Id,
  raio: number,
  centro: Float32Array | null,
  ilhas: Readonly<Record<Id, IlhaDoMapa>>,
  centros: ReadonlyMap<Id, Float32Array>,
): Ponto {
  const outras = Object.entries(ilhas).sort((a, b) => comparar(a[0], b[0]))
  if (outras.length === 0) return { x: 0, y: 0 }

  // Com a reserva dos dois lados: a ilha nova nasce com espaço para crescer, e
  // sem tomar o das outras.
  const reservada = (ilha: IlhaDoMapa): { centro: Ponto; raio: number } => ({
    centro: ilha.centro,
    raio: comReserva(ilha.raio),
  })
  let ancora: { centro: Ponto; raio: number } | null = null
  if (centro) {
    let melhor = 0
    for (const [id, ilha] of outras) {
      const c = centros.get(id)
      const cos = c ? produtoInterno(centro, c) : 0
      if (cos > melhor) {
        melhor = cos
        ancora = reservada(ilha)
      }
    }
  }
  if (!ancora) {
    const meio = outras.reduce(
      (s, [, ilha]) => ({
        x: s.x + ilha.centro.x / outras.length,
        y: s.y + ilha.centro.y / outras.length,
      }),
      { x: 0, y: 0 },
    )
    ancora = { centro: meio, raio: 0 }
  }

  const inicio = semente(livroId)[0] * 2 * Math.PI
  for (let anel = 0; anel < 200; anel++) {
    const distancia = ancora.raio + comReserva(raio) + FOLGA_ENTRE_ILHAS + anel * 24
    for (let k = 0; k < 36; k++) {
      const a = inicio + (k * 2 * Math.PI) / 36
      const candidato = {
        centro: {
          x: ancora.centro.x + Math.cos(a) * distancia,
          y: ancora.centro.y + Math.sin(a) * distancia,
        },
        raio: comReserva(raio),
      }
      if (outras.every(([, ilha]) => !seSobrepoem(candidato, reservada(ilha)))) {
        return candidato.centro
      }
    }
  }
  return ancora.centro
}

/**
 * Uma ilha que cresceu e encostou noutra anda o mínimo para fora — ela só, as
 * outras ficam. E vai para onde volta a ter a reserva: senão encostaria de
 * novo no próximo neurônio, e andaria a cada um.
 */
function afastarIlhaQueCresceu(
  livroId: Id,
  ilha: IlhaDoMapa,
  ilhas: Readonly<Record<Id, IlhaDoMapa>>,
): Ponto {
  return lugarLivreMaisPerto(livroId, ilha, ilhas, comReserva(ilha.raio))
}

/**
 * O lugar livre mais perto de onde a ilha está: ela mesma, se não encosta em
 * nenhuma; senão, anéis cada vez maiores em volta, e o primeiro lugar onde
 * `raioExigido` cabe com o mar inteiro em volta. Só ela anda.
 */
function lugarLivreMaisPerto(
  livroId: Id,
  ilha: IlhaDoMapa,
  ilhas: Readonly<Record<Id, IlhaDoMapa>>,
  raioExigido: number,
): Ponto {
  const outras = Object.entries(ilhas).filter(([id]) => id !== livroId)
  const encostou = outras.some(([, outra]) => seSobrepoem(ilha, outra))
  if (!encostou) return ilha.centro

  const livreEm = (centro: Ponto): boolean =>
    outras.every(([, outra]) => !seSobrepoem({ centro, raio: raioExigido }, outra))

  for (let anel = 1; anel < 400; anel++) {
    const distancia = anel * 8
    for (let k = 0; k < 48; k++) {
      const a = (k * 2 * Math.PI) / 48
      const centro = {
        x: ilha.centro.x + Math.cos(a) * distancia,
        y: ilha.centro.y + Math.sin(a) * distancia,
      }
      if (livreEm(centro)) return centro
    }
  }
  return ilha.centro
}

/**
 * O mapa depois de uma mudança no palácio, mexendo o mínimo:
 *
 * - quem saiu (apagado, ou mudou de livro) some do ponto onde estava — ninguém
 *   mais anda;
 * - quem chegou entra perto dos parecidos da ilha (`encaixarPonto`);
 * - livro que ganhou o primeiro neurônio vira ilha perto da mais parecida;
 * - livro que ficou vazio, ou deixou de existir, perde a ilha;
 * - a ilha que cresceu e encostou noutra anda — só ela.
 *
 * Sem mapa anterior nenhum, é o mapa inteiro do zero.
 */
export function atualizarMapa(
  anterior: MapaDoPalacio,
  nos: readonly NoDoMapa[],
  livros: ReadonlySet<Id>,
  centroide: Float32Array | null,
): MapaDoPalacio {
  if (Object.keys(anterior.ilhas).length === 0) return mapaCompleto(nos, livros, centroide)

  const grupos = agrupar(nos, livros)
  const vetores = new Map<Id, Float32Array>()
  for (const n of nos) {
    if (n.embedding)
      vetores.set(n.id, centroide ? centralizar(n.embedding, centroide) : n.embedding)
  }
  const centros = new Map<Id, Float32Array>()
  for (const [livroId, membros] of grupos) {
    const c = centroDoLivro(membros, centroide)
    if (c) centros.set(livroId, c)
  }

  const ilhas: Record<Id, IlhaDoMapa> = {}
  const cresceram: Id[] = []

  // As que já existiam: ficam onde estão, com quem ficou, mais quem chegou.
  for (const livroId of Object.keys(anterior.ilhas).sort(comparar)) {
    const membros = grupos.get(livroId)
    if (!membros || membros.length === 0) continue
    const antiga = anterior.ilhas[livroId]!
    const ids = new Set(membros.map((m) => m.id))
    const pontos = new Map<Id, Ponto>(Object.entries(antiga.pontos).filter(([id]) => ids.has(id)))
    for (const novo of membros) {
      if (!pontos.has(novo.id)) pontos.set(novo.id, encaixarPonto(novo, pontos, vetores))
    }
    const raio = raioQueContem(pontos.values(), membros.length)
    ilhas[livroId] = { centro: { ...antiga.centro }, raio, pontos: Object.fromEntries(pontos) }
    if (raio > antiga.raio + 1e-6) cresceram.push(livroId)
  }

  // Livros que ganharam o primeiro neurônio: ilha nova, perto da mais parecida.
  for (const [livroId, membros] of [...grupos].sort((a, b) => comparar(a[0], b[0]))) {
    if (ilhas[livroId]) continue
    const { pontos, raio } = pontosDaIlha(membros, centroide)
    const centro = encaixarIlha(livroId, raio, centros.get(livroId) ?? null, ilhas, centros)
    ilhas[livroId] = { centro, raio, pontos }
  }

  for (const livroId of cresceram) {
    const ilha = ilhas[livroId]!
    ilha.centro = afastarIlhaQueCresceu(livroId, ilha, ilhas)
  }

  return { ilhas }
}

// --- a mão da pessoa ---------------------------------------------------------

/**
 * A pessoa arrastou uma ilha (02/10/2026): ela fica onde foi solta, com todos
 * os neurônios dela, e só ela se mexe. Solta em cima de outra, anda o mínimo
 * até ter o mar inteiro em volta — sem a reserva de crescimento: quem decidiu
 * o lugar foi a pessoa, e ele é respeitado o mais perto possível.
 */
export function moverIlha(mapa: MapaDoPalacio, livroId: Id, centro: Ponto): MapaDoPalacio {
  const ilha = mapa.ilhas[livroId]
  if (!ilha || !Number.isFinite(centro.x) || !Number.isFinite(centro.y)) return mapa
  const solta: IlhaDoMapa = { ...ilha, centro: { x: centro.x, y: centro.y } }
  const ilhas = { ...mapa.ilhas, [livroId]: solta }
  ilhas[livroId] = { ...solta, centro: lugarLivreMaisPerto(livroId, solta, ilhas, solta.raio) }
  return { ilhas }
}

/**
 * A pessoa arrastou um neurônio dentro da ilha dele (02/10/2026). Ele não sai
 * dela: solto fora, fica na beira de dentro (`raio − MARGEM_DA_COSTA`). Solto
 * colado noutro, dá um passo para o lado até achar vão, ainda dentro da ilha.
 * Ninguém mais se mexe, e a ilha não muda de tamanho.
 *
 * `ponto` é no mundo do Mapa, como o dedo o vê.
 */
export function moverPontoNoMapa(mapa: MapaDoPalacio, neuronioId: Id, ponto: Ponto): MapaDoPalacio {
  const achada = Object.entries(mapa.ilhas).find(([, ilha]) => neuronioId in ilha.pontos)
  if (!achada || !Number.isFinite(ponto.x) || !Number.isFinite(ponto.y)) return mapa
  const [livroId, ilha] = achada

  const limite = Math.max(0, ilha.raio - MARGEM_DA_COSTA)
  const dentro = (p: Ponto): Ponto => {
    const d = Math.hypot(p.x, p.y)
    return d <= limite ? p : { x: (p.x / d) * limite, y: (p.y / d) * limite }
  }
  const outros = Object.entries(ilha.pontos)
    .filter(([id]) => id !== neuronioId)
    .map(([, p]) => p)
  const livre = (p: Ponto): boolean =>
    outros.every((q) => Math.hypot(q.x - p.x, q.y - p.y) >= DISTANCIA_ENTRE_PONTOS - 1e-6)

  const base = dentro({ x: ponto.x - ilha.centro.x, y: ponto.y - ilha.centro.y })
  let escolhido = base
  if (!livre(base)) {
    const angulo = semente(neuronioId)[0] * 2 * Math.PI
    for (let passo = 1; passo < 400; passo++) {
      const r = DISTANCIA_ENTRE_PONTOS * (0.6 + 0.35 * passo)
      const a = angulo + passo * ANGULO_DOURADO
      const p = { x: base.x + Math.cos(a) * r, y: base.y + Math.sin(a) * r }
      if (Math.hypot(p.x, p.y) <= limite && livre(p)) {
        escolhido = p
        break
      }
    }
  }

  return {
    ilhas: {
      ...mapa.ilhas,
      [livroId]: { ...ilha, pontos: { ...ilha.pontos, [neuronioId]: escolhido } },
    },
  }
}

/** Onde o neurônio está no mundo do Mapa — `undefined` se ele não está em ilha nenhuma. */
export function pontoNoMapa(mapa: MapaDoPalacio, neuronioId: Id): Ponto | undefined {
  for (const ilha of Object.values(mapa.ilhas)) {
    const p = ilha.pontos[neuronioId]
    if (p) return { x: ilha.centro.x + p.x, y: ilha.centro.y + p.y }
  }
  return undefined
}

/**
 * O mapa depois de um backup: as ilhas do arquivo vencem — é a memória
 * espacial que se quer de volta. Uma ilha que só existe aqui fica onde está,
 * se não encostar em nenhuma do arquivo; se encostar, sai, e a próxima
 * atualização a encaixa de novo, perto da mais parecida.
 */
export function fundirMapas(local: MapaDoPalacio, doArquivo: MapaDoPalacio): MapaDoPalacio {
  const ilhas: Record<Id, IlhaDoMapa> = { ...doArquivo.ilhas }
  const vindas = Object.values(doArquivo.ilhas)
  for (const [livroId, ilha] of Object.entries(local.ilhas).sort((a, b) => comparar(a[0], b[0]))) {
    if (ilhas[livroId]) continue
    if (vindas.some((outra) => seSobrepoem(ilha, outra))) continue
    ilhas[livroId] = ilha
  }
  return { ilhas }
}
