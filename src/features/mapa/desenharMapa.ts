import type { Conexao, Id, IlhaDoMapa, Livro, MapaDoPalacio, NeuronioNaTela, Ponto } from '@/core'
import { spriteDeNevoa } from '@/features/rede/canvas'
import type { Camera } from '@/features/rede/desenhar'
import { vizinhancaDe } from '@/features/rede/layout'
import { contar } from '@/lib/plural'

import { ESCALA_DE_PERTO, presencaDePerto } from './ilha'
import { controleDoArco, espessuraDaPonte, pontesVisiveis, type PonteAgrupada } from './pontes'

/**
 * O desenho do Mapa, em canvas: o palácio como arquipélago, numa carta náutica
 * (02/10/2026) — a sala é o mar, com a grade de latitude e longitude e a borda
 * escurecida; cada livro é uma ilha redonda, com sombra, os anéis de
 * profundidade em volta e a costa dupla hachurada, tingida da cor dele; as
 * pontes são rotas em arco, e uma rosa dos ventos fica no canto.
 *
 * Três distâncias, para o mapa nunca virar novelo:
 *
 * 1. **De longe** — só as ilhas e as pontes mais fortes de cada uma (ou todas,
 *    com "Ver todas as pontes"). Uma ponte por par de livros, mais grossa
 *    quanto mais conexões, passando por baixo das ilhas: a terra cobre o que
 *    está dentro delas, e a ponte sai pela praia.
 * 2. **Perto de uma ilha** — aparecem os pontos, as trilhas (as conexões de
 *    dentro do livro, finas e tracejadas) e os nomes que cabem sem se encostar.
 * 3. **Com um neurônio tocado** — o resto do mapa esmaece debaixo de um véu, e
 *    por cima ficam as conexões dele, uma por uma, até nos outros livros.
 *
 * Nos livros executáveis, as ideias adormecidas ficam debaixo de uma névoa na
 * ilha — de qualquer distância —, e as feitas, de perto, são pontos acesos com
 * um anel de ouro gravado.
 *
 * Aqui não há estado nem `useEffect` — é uma função que recebe a cena e pinta.
 */

export interface CoresDoMapa {
  sala: string
  parede: string
  papel: string
  poeira: string
  no: string
  ponte: string
  fio: string
  /** O anel das ideias feitas — o ouro gravado das lombadas, nunca o da ponte. */
  ouro: string
  /** A névoa das adormecidas. */
  nevoa: string
  /** A grade de latitude e longitude. */
  grade: string
  /** A borda do mar, escurecida. */
  vinheta: string
  /** A sombra das ilhas. */
  sombra: string
}

export interface CenaDoMapa {
  mapa: MapaDoPalacio
  /** Onde cada neurônio está no mundo — o centro da ilha mais o lugar nela. */
  absolutos: ReadonlyMap<Id, Ponto>
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  conexoes: readonly Conexao[]
  graus: ReadonlyMap<Id, number>
  /** Da mais forte para a mais fraca (`agruparPontes`). */
  pontes: readonly PonteAgrupada[]
  /** "Ver todas as pontes": de longe também, sem o limite por ilha. */
  todasAsPontes: boolean
  selecionado: Id | null
  /** Ideias adormecidas dos livros executáveis: debaixo da névoa, e mais apagadas. */
  adormecidas: ReadonlySet<Id>
  /** Ideias feitas dos livros executáveis: acesas, com o anel. */
  feitas: ReadonlySet<Id>
  /** A ilha que a pessoa está segurando: desenhada erguida, por cima das outras. */
  erguida: Id | null
  /**
   * O que a página põe por cima do canvas, em px: a barra, o seletor e a
   * contagem no alto, os botões no pé. Nome nenhum é escrito ali — por baixo
   * de outro texto ele só vira borrão.
   */
  cobertas: { topo: number; base: number }
  cores: CoresDoMapa
}

/** O ponto do neurônio, em pixels de tela — continua ponto em qualquer zoom. */
const RAIO_DO_PONTO_PX = 2.2
/** O quanto o véu do neurônio tocado apaga o resto do mapa. */
const VEU = 0.62
/** O quanto uma ideia adormecida, e as trilhas dela, perdem de luz — sem sumir. */
const DORMENTE = 0.35
/** O raio de névoa em volta de cada adormecida, no mundo: vira uma área na ilha. */
const RAIO_DA_NEVOA = 24
/** O anel da ideia feita, a esta distância do ponto, em px de tela. */
const FOLGA_DO_ANEL_PX = 3.5
/** Nomes de neurônio de perto: o bastante para orientar sem cobrir a ilha. */
const MAX_NOMES_DE_NEURONIO = 40

/** O nome da ilha em versalete, espaçado, como os nomes de terra nas cartas. */
const FONTE_DA_ILHA = 'small-caps 600 14px ui-serif, Georgia, serif'
const ESPACO_DO_NOME = '0.06em'
const FONTE_DA_CONTAGEM = 'italic 11px ui-serif, Georgia, serif'
const FONTE_DO_NEURONIO = '11px ui-sans-serif, system-ui, sans-serif'

interface Caixa {
  x0: number
  y0: number
  x1: number
  y1: number
}

const bate = (c: Caixa, ocupadas: readonly Caixa[]): boolean =>
  ocupadas.some((o) => c.x0 < o.x1 && c.x1 > o.x0 && c.y0 < o.y1 && c.y1 > o.y0)

/** As faixas cobertas pela página e as laterais fora da tela: nome cortado não se lê. */
function areasProibidas(
  cobertas: CenaDoMapa['cobertas'],
  largura: number,
  altura: number,
): Caixa[] {
  const longe = 1e6
  return [
    { x0: -longe, y0: -longe, x1: longe, y1: cobertas.topo },
    { x0: -longe, y0: altura - cobertas.base, x1: longe, y1: longe },
    { x0: -longe, y0: -longe, x1: 0, y1: longe },
    { x0: largura, y0: -longe, x1: longe, y1: longe },
  ]
}

function finito(p: Ponto | undefined): p is Ponto {
  return p !== undefined && Number.isFinite(p.x) && Number.isFinite(p.y)
}

function aplicarCamera(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  largura: number,
  altura: number,
): void {
  ctx.translate(largura / 2 + camera.x, altura / 2 + camera.y)
  ctx.scale(camera.escala, camera.escala)
}

export function desenharMapa(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  camera: Camera,
  largura: number,
  altura: number,
): void {
  const { cores } = cena
  const px = 1 / camera.escala
  const perto = presencaDePerto(camera.escala)
  const corDoLivro = new Map(cena.livros.map((l) => [l.id, l.cor]))
  const ilhas = Object.entries(cena.mapa.ilhas).sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const naTela = (p: Ponto): Ponto => ({
    x: largura / 2 + camera.x + p.x * camera.escala,
    y: altura / 2 + camera.y + p.y * camera.escala,
  })
  // Um neurônio no porto não tem lugar no mapa: tocado, ele não acende nada aqui.
  const selecionado =
    cena.selecionado !== null && cena.absolutos.has(cena.selecionado) ? cena.selecionado : null
  const vizinhanca = vizinhancaDe(selecionado, cena.conexoes)

  ctx.save()
  desenharMar(ctx, cores, largura, altura)

  ctx.save()
  aplicarCamera(ctx, camera, largura, altura)
  ctx.lineCap = 'round'
  desenharGrade(ctx, cores, camera, largura, altura)
  for (const [livroId, ilha] of ilhas) {
    desenharProfundidade(ctx, ilha, corDoLivro.get(livroId), camera.escala, px)
  }
  desenharPontesAgrupadas(
    ctx,
    cena,
    pontesVisiveis(cena.pontes, camera.escala, cena.todasAsPontes),
    px,
  )
  // A erguida por último: ela passa por cima das outras enquanto anda.
  const emOrdem = [
    ...ilhas.filter(([id]) => id !== cena.erguida),
    ...ilhas.filter(([id]) => id === cena.erguida),
  ]
  for (const [livroId, ilha] of emOrdem) {
    desenharIlha(
      ctx,
      ilha,
      corDoLivro.get(livroId),
      cores,
      camera.escala,
      px,
      livroId === cena.erguida,
    )
  }
  desenharNevoa(ctx, cena)
  if (perto > 0) {
    desenharTrilhas(ctx, cena, perto, px)
    for (const [livroId, ilha] of ilhas) {
      const acordadas: Ponto[] = []
      const dormentes: Ponto[] = []
      const feitas: Ponto[] = []
      for (const [id, p] of Object.entries(ilha.pontos)) {
        const ponto = { x: ilha.centro.x + p.x, y: ilha.centro.y + p.y }
        if (cena.adormecidas.has(id)) dormentes.push(ponto)
        else if (cena.feitas.has(id)) feitas.push(ponto)
        else acordadas.push(ponto)
      }
      const cor = corDoLivro.get(livroId)
      desenharPontos(ctx, acordadas, cor, cores, perto, px)
      desenharPontos(ctx, dormentes, cor, cores, perto * DORMENTE, px)
      desenharFeitas(ctx, feitas, cores, perto, px)
    }
  }
  ctx.restore()

  // Em pixels de tela, fora da câmera: nome de ilha e de neurônio não encolhem.
  const ocupadas = areasProibidas(cena.cobertas, largura, altura)
  desenharNomesDasIlhas(ctx, cena, ilhas, naTela, camera.escala, largura, altura, ocupadas)
  if (camera.escala >= ESCALA_DE_PERTO) {
    desenharNomesDeNeuronios(ctx, cena, naTela, largura, altura, ocupadas, vizinhanca)
  }
  desenharRosaDosVentos(ctx, cores, largura, cena.cobertas.topo)

  if (selecionado !== null && vizinhanca !== null) {
    ctx.globalAlpha = VEU
    ctx.fillStyle = cores.sala
    ctx.fillRect(0, 0, largura, altura)
    ctx.globalAlpha = 1
    desenharVizinhanca(ctx, cena, selecionado, vizinhanca, camera, largura, altura, naTela)
  }
  ctx.restore()
}

/** `#rrggbb` com transparência — a cor do livro é sempre hex (ver `livroSchema`). */
function comAlfa(hex: string, alfa: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  if (hex.length !== 7 || Number.isNaN(n)) return `rgba(128, 128, 128, ${String(alfa)})`
  return `rgba(${String((n >> 16) & 255)}, ${String((n >> 8) & 255)}, ${String(n & 255)}, ${String(alfa)})`
}

const TRANSPARENTE = 'rgba(0, 0, 0, 0)'

/** O mar: a sala, e a borda escurecida — o papel da carta envelhece pelas margens. */
function desenharMar(
  ctx: CanvasRenderingContext2D,
  cores: CoresDoMapa,
  largura: number,
  altura: number,
): void {
  ctx.fillStyle = cores.sala
  ctx.fillRect(0, 0, largura, altura)
  const meio = { x: largura / 2, y: altura / 2 }
  const vinheta = ctx.createRadialGradient(
    meio.x,
    meio.y,
    Math.min(largura, altura) * 0.32,
    meio.x,
    meio.y,
    Math.hypot(largura, altura) * 0.55,
  )
  vinheta.addColorStop(0, TRANSPARENTE)
  vinheta.addColorStop(1, cores.vinheta)
  ctx.fillStyle = vinheta
  ctx.fillRect(0, 0, largura, altura)
}

/**
 * A grade de latitude e longitude, presa ao mundo — anda com o mapa. O passo
 * dobra e divide com o zoom para as linhas ficarem sempre a uma distância
 * confortável na tela, nunca virando trama.
 */
function desenharGrade(
  ctx: CanvasRenderingContext2D,
  cores: CoresDoMapa,
  camera: Camera,
  largura: number,
  altura: number,
): void {
  let passo = 50
  while (passo * camera.escala < 80) passo *= 2
  while (passo * camera.escala > 180 && passo > 25) passo /= 2
  const x0 = (-largura / 2 - camera.x) / camera.escala
  const x1 = (largura / 2 - camera.x) / camera.escala
  const y0 = (-altura / 2 - camera.y) / camera.escala
  const y1 = (altura / 2 - camera.y) / camera.escala

  ctx.beginPath()
  for (let x = Math.ceil(x0 / passo) * passo; x <= x1; x += passo) {
    ctx.moveTo(x, y0)
    ctx.lineTo(x, y1)
  }
  for (let y = Math.ceil(y0 / passo) * passo; y <= y1; y += passo) {
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
  }
  ctx.strokeStyle = cores.grade
  ctx.lineWidth = 1 / camera.escala
  ctx.stroke()
}

/** Até onde a água rasa vai, e onde caem os anéis de profundidade, em volta da costa. */
const AGUA_RASA = 34
const ISOBATAS = [
  { distancia: 9, alfa: 0.32 },
  { distancia: 20, alfa: 0.2 },
  { distancia: 32, alfa: 0.11 },
] as const

/**
 * A água em volta da ilha: um raso da cor do livro que se apaga no mar, e os
 * anéis de profundidade (isóbatas) — o de fora tracejado, como nas cartas. Com
 * a ilha muito pequena na tela, só o raso: os anéis virariam borrão.
 */
function desenharProfundidade(
  ctx: CanvasRenderingContext2D,
  ilha: IlhaDoMapa,
  cor: string | undefined,
  escala: number,
  px: number,
): void {
  if (!cor) return
  const { centro, raio } = ilha
  const raso = ctx.createRadialGradient(
    centro.x,
    centro.y,
    raio,
    centro.x,
    centro.y,
    raio + AGUA_RASA,
  )
  raso.addColorStop(0, comAlfa(cor, 0.16))
  raso.addColorStop(1, comAlfa(cor, 0))
  ctx.fillStyle = raso
  ctx.beginPath()
  ctx.arc(centro.x, centro.y, raio + AGUA_RASA, 0, 2 * Math.PI)
  ctx.fill()

  if (raio * escala < 22) return
  ctx.strokeStyle = cor
  ctx.lineWidth = 0.9 * px
  ISOBATAS.forEach(({ distancia, alfa }, i) => {
    ctx.globalAlpha = alfa
    ctx.setLineDash(i === ISOBATAS.length - 1 ? [3 * px, 4 * px] : [])
    ctx.beginPath()
    ctx.arc(centro.x, centro.y, raio + distancia, 0, 2 * Math.PI)
    ctx.stroke()
  })
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/**
 * Uma ponte por par de ilhas: uma rota em arco, de centro a centro e **por
 * baixo** delas — a terra cobre o pedaço de dentro, e o que se vê sai pela
 * praia. Um halo largo e fraco por baixo, e o traço por cima.
 */
function desenharPontesAgrupadas(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  pontes: readonly PonteAgrupada[],
  px: number,
): void {
  ctx.strokeStyle = cena.cores.ponte
  for (const ponte of pontes) {
    const a = cena.mapa.ilhas[ponte.livroA]
    const b = cena.mapa.ilhas[ponte.livroB]
    if (!a || !b) continue
    const controle = controleDoArco(a.centro, b.centro)
    const espessura = espessuraDaPonte(ponte.quantidade)
    ctx.beginPath()
    ctx.moveTo(a.centro.x, a.centro.y)
    ctx.quadraticCurveTo(controle.x, controle.y, b.centro.x, b.centro.y)
    ctx.globalAlpha = 0.12
    ctx.lineWidth = (espessura + 6) * px
    ctx.stroke()
    ctx.globalAlpha = 0.85
    ctx.lineWidth = espessura * px
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/**
 * A ilha: sombra no mar, a terra com uma luz vinda de cima à esquerda (um
 * domo, não um disco chapado), o toque da cor do livro, e a costa dupla — o
 * traço firme e um fio por dentro — hachurada por fora quando a ilha está
 * grande na tela. Erguida (a pessoa está segurando), a sombra desce e abre,
 * e a ilha cresce um pouco.
 */
function desenharIlha(
  ctx: CanvasRenderingContext2D,
  ilha: IlhaDoMapa,
  cor: string | undefined,
  cores: CoresDoMapa,
  escala: number,
  px: number,
  erguida: boolean,
): void {
  const { centro } = ilha
  const raio = ilha.raio * (erguida ? 1.03 : 1)
  const tinta = cor ?? cores.poeira

  const desce = raio * (erguida ? 0.16 : 0.07)
  const sombra = ctx.createRadialGradient(
    centro.x + desce * 0.5,
    centro.y + desce,
    raio * 0.7,
    centro.x + desce * 0.5,
    centro.y + desce,
    raio * (erguida ? 1.28 : 1.14),
  )
  sombra.addColorStop(0, cores.sombra)
  sombra.addColorStop(1, TRANSPARENTE)
  ctx.fillStyle = sombra
  ctx.beginPath()
  ctx.arc(centro.x + desce * 0.5, centro.y + desce, raio * (erguida ? 1.28 : 1.14), 0, 2 * Math.PI)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(centro.x, centro.y, raio, 0, 2 * Math.PI)
  ctx.fillStyle = cores.parede
  ctx.fill()
  if (cor) {
    ctx.fillStyle = cor
    ctx.globalAlpha = 0.13
    ctx.fill()
    ctx.globalAlpha = 1
  }
  const luz = ctx.createRadialGradient(
    centro.x - raio * 0.38,
    centro.y - raio * 0.42,
    0,
    centro.x - raio * 0.38,
    centro.y - raio * 0.42,
    raio * 1.25,
  )
  luz.addColorStop(0, 'rgba(255, 255, 255, 0.13)')
  luz.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = luz
  ctx.fill()

  ctx.strokeStyle = tinta
  ctx.globalAlpha = erguida ? 1 : 0.8
  ctx.lineWidth = (erguida ? 2 : 1.4) * px
  ctx.stroke()
  ctx.globalAlpha = 0.32
  ctx.lineWidth = 0.8 * px
  ctx.beginPath()
  ctx.arc(centro.x, centro.y, Math.max(0, raio - 4 * px), 0, 2 * Math.PI)
  ctx.stroke()

  // A hachura da costa: traços curtos para fora, como as cartas antigas
  // marcavam a praia. Só com a ilha grande na tela — pequena, vira serrilha.
  if (raio * escala > 70) {
    const passos = 72
    const dentro = raio + 1.5 * px
    const fora = raio + 4.5 * px
    ctx.beginPath()
    for (let i = 0; i < passos; i++) {
      const a = (i / passos) * 2 * Math.PI
      ctx.moveTo(centro.x + Math.cos(a) * dentro, centro.y + Math.sin(a) * dentro)
      ctx.lineTo(centro.x + Math.cos(a) * fora, centro.y + Math.sin(a) * fora)
    }
    ctx.globalAlpha = 0.28
    ctx.lineWidth = 0.8 * px
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/**
 * A rosa dos ventos, no canto de cima à direita, logo abaixo da barra —
 * enfeite de carta, discreto, que não anda com o mapa.
 */
function desenharRosaDosVentos(
  ctx: CanvasRenderingContext2D,
  cores: CoresDoMapa,
  largura: number,
  topo: number,
): void {
  const r = 17
  const x = largura - 34
  const y = topo - 50
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = cores.poeira
  ctx.fillStyle = cores.poeira
  ctx.lineWidth = 0.8
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, r - 4, 0, 2 * Math.PI)
  ctx.stroke()

  // As quatro pontas: norte e sul compridas, leste e oeste curtas; metade de
  // cada ponta cheia, metade vazia, como nas rosas desenhadas à mão.
  const ponta = (angulo: number, comprimento: number): void => {
    const c = Math.cos(angulo)
    const s = Math.sin(angulo)
    const lado = 3.2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(c * comprimento, s * comprimento)
    ctx.lineTo(-s * lado, c * lado)
    ctx.closePath()
    ctx.globalAlpha = 0.55
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(c * comprimento, s * comprimento)
    ctx.lineTo(s * lado, -c * lado)
    ctx.closePath()
    ctx.globalAlpha = 0.4
    ctx.stroke()
  }
  ponta(-Math.PI / 2, r + 3)
  ponta(Math.PI / 2, r + 1)
  ponta(0, r - 4)
  ponta(Math.PI, r - 4)

  ctx.globalAlpha = 0.7
  ctx.font = 'small-caps 600 9px ui-serif, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('N', 0, -r - 4)
  ctx.restore()
}

/**
 * A névoa das adormecidas: um chumaço por ideia, grande no mundo — perto umas
 * das outras, viram uma área só na ilha. Aparece de qualquer distância: de
 * longe ela diz onde há ideia parada sem precisar dos pontos.
 */
function desenharNevoa(ctx: CanvasRenderingContext2D, cena: CenaDoMapa): void {
  if (cena.adormecidas.size === 0) return
  const nevoa = spriteDeNevoa(cena.cores.nevoa)
  const lado = 2 * RAIO_DA_NEVOA
  ctx.globalAlpha = 0.55
  for (const id of cena.adormecidas) {
    const p = cena.absolutos.get(id)
    if (!finito(p)) continue
    ctx.drawImage(nevoa, p.x - RAIO_DA_NEVOA, p.y - RAIO_DA_NEVOA, lado, lado)
  }
  ctx.globalAlpha = 1
}

/** As feitas: pontos acesos, com o anel de ouro gravado em volta. */
function desenharFeitas(
  ctx: CanvasRenderingContext2D,
  pontos: readonly Ponto[],
  cores: CoresDoMapa,
  presenca: number,
  px: number,
): void {
  if (pontos.length === 0) return
  const raio = RAIO_DO_PONTO_PX * 1.15 * px
  ctx.beginPath()
  for (const p of pontos) {
    ctx.moveTo(p.x + raio, p.y)
    ctx.arc(p.x, p.y, raio, 0, 2 * Math.PI)
  }
  ctx.fillStyle = cores.papel
  ctx.globalAlpha = presenca
  ctx.fill()

  const anel = raio + FOLGA_DO_ANEL_PX * px
  ctx.beginPath()
  for (const p of pontos) {
    ctx.moveTo(p.x + anel, p.y)
    ctx.arc(p.x, p.y, anel, 0, 2 * Math.PI)
  }
  ctx.strokeStyle = cores.ouro
  ctx.lineWidth = 1.2 * px
  ctx.globalAlpha = 0.9 * presenca
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** O tracejado da trilha, em px de tela — o mesmo na legenda. */
export const TRACEJADO_DA_TRILHA_PX = [3, 3] as const

/**
 * As trilhas: as conexões de dentro de um livro, finas e tracejadas na cor dos
 * fios — nunca na de ponte. Só de perto, e aparecendo junto com os pontos.
 */
function desenharTrilhas(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  presenca: number,
  px: number,
): void {
  const livroDe = new Map(cena.neuronios.map((n) => [n.id, n.livroId]))
  // Duas passadas: as trilhas de quem dorme saem mais fracas.
  const tracar = (dormentes: boolean): void => {
    ctx.beginPath()
    for (const c of cena.conexoes) {
      const livro = livroDe.get(c.aId)
      if (livro === null || livro === undefined || livro !== livroDe.get(c.bId)) continue
      const dorme = cena.adormecidas.has(c.aId) || cena.adormecidas.has(c.bId)
      if (dorme !== dormentes) continue
      const a = cena.absolutos.get(c.aId)
      const b = cena.absolutos.get(c.bId)
      if (!finito(a) || !finito(b)) continue
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
    }
    ctx.globalAlpha = 0.6 * presenca * (dormentes ? DORMENTE : 1)
    ctx.stroke()
  }
  ctx.strokeStyle = cena.cores.fio
  ctx.lineWidth = 0.9 * px
  ctx.setLineDash(TRACEJADO_DA_TRILHA_PX.map((d) => d * px))
  tracar(false)
  tracar(true)
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/** Os pontos: o claro da noite (ou a tinta do dia) com o toque do livro. */
function desenharPontos(
  ctx: CanvasRenderingContext2D,
  pontos: readonly Ponto[],
  cor: string | undefined,
  cores: CoresDoMapa,
  presenca: number,
  px: number,
): void {
  const raio = RAIO_DO_PONTO_PX * px
  ctx.beginPath()
  for (const p of pontos) {
    ctx.moveTo(p.x + raio, p.y)
    ctx.arc(p.x, p.y, raio, 0, 2 * Math.PI)
  }
  ctx.fillStyle = cores.no
  ctx.globalAlpha = presenca
  ctx.fill()
  if (cor) {
    ctx.fillStyle = cor
    ctx.globalAlpha = 0.38 * presenca
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** Texto com um contorno da cor do mar: continua legível por cima de terra e ponte. */
function escreverComHalo(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  cores: CoresDoMapa,
): void {
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.strokeStyle = cores.sala
  ctx.strokeText(texto, x, y)
  ctx.fillText(texto, x, y)
}

/**
 * O nome do livro e quantos neurônios moram nela, acima de cada ilha. Os de
 * ilha maior escolhem lugar primeiro; um nome que encostaria noutro já posto
 * fica de fora — de longe, num palácio grande, não cabem todos.
 */
function desenharNomesDasIlhas(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  ilhas: readonly [Id, IlhaDoMapa][],
  naTela: (p: Ponto) => Ponto,
  escala: number,
  largura: number,
  altura: number,
  ocupadas: Caixa[],
): void {
  const ordem = [...ilhas].sort(
    (a, b) =>
      Object.keys(b[1].pontos).length - Object.keys(a[1].pontos).length || (a[0] < b[0] ? -1 : 1),
  )

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  for (const [livroId, ilha] of ordem) {
    const livro = cena.livros.find((l) => l.id === livroId)
    if (!livro) continue
    // O nome é empurrado para dentro da tela pelos lados; com o centro da ilha
    // fora dela, ele flutuaria sobre o mar, longe da ilha que nomeia. Na
    // vertical ele acompanha a ilha, sem empurrão.
    const centro = naTela(ilha.centro)
    const raio = ilha.raio * escala
    const aparece =
      centro.x >= 0 && centro.x <= largura && centro.y + raio > 0 && centro.y - raio < altura
    if (!aparece) continue

    const quantos = contar(Object.keys(ilha.pontos).length, 'neurônio', 'neurônios')
    ctx.font = FONTE_DA_ILHA
    ctx.letterSpacing = ESPACO_DO_NOME
    const largo = Math.max(ctx.measureText(livro.titulo).width, 60)
    const x = Math.min(Math.max(centro.x, largo / 2 + 8), largura - largo / 2 - 8)
    const topo = centro.y - raio
    const caixa = { x0: x - largo / 2 - 4, y0: topo - 38, x1: x + largo / 2 + 4, y1: topo - 2 }
    if (bate(caixa, ocupadas)) continue
    ocupadas.push(caixa)

    ctx.fillStyle = cena.cores.papel
    escreverComHalo(ctx, livro.titulo, x, topo - 20, cena.cores)
    ctx.letterSpacing = '0px'
    ctx.font = FONTE_DA_CONTAGEM
    ctx.fillStyle = cena.cores.poeira
    escreverComHalo(ctx, quantos, x, topo - 6, cena.cores)
  }
  ctx.restore()
}

/**
 * De perto, os nomes dos neurônios, embaixo de cada ponto. Os mais conectados
 * escolhem lugar primeiro; quem encostaria num nome já posto fica sem — o
 * ponto continua lá, e tocá-lo diz o nome.
 */
function desenharNomesDeNeuronios(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  naTela: (p: Ponto) => Ponto,
  largura: number,
  altura: number,
  ocupadas: Caixa[],
  vizinhanca: ReadonlySet<Id> | null,
): void {
  const candidatos: { n: NeuronioNaTela; p: Ponto; grau: number }[] = []
  for (const n of cena.neuronios) {
    // A vizinhança do tocado tem os nomes dela por cima do véu.
    if (vizinhanca?.has(n.id)) continue
    const mundo = cena.absolutos.get(n.id)
    if (!finito(mundo)) continue
    const p = naTela(mundo)
    if (p.x < -40 || p.x > largura + 40 || p.y < -20 || p.y > altura + 20) continue
    candidatos.push({ n, p, grau: cena.graus.get(n.id) ?? 0 })
  }
  candidatos.sort((a, b) => b.grau - a.grau || (a.n.id < b.n.id ? -1 : 1))
  escreverNomesDePontos(ctx, cena, candidatos, ocupadas, 0.85)
}

function escreverNomesDePontos(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  candidatos: readonly { n: NeuronioNaTela; p: Ponto }[],
  ocupadas: Caixa[],
  alfa: number,
): void {
  ctx.save()
  ctx.font = FONTE_DO_NEURONIO
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = cena.cores.papel
  ctx.globalAlpha = alfa
  let postos = 0
  for (const { n, p } of candidatos) {
    if (postos >= MAX_NOMES_DE_NEURONIO) break
    const largo = ctx.measureText(n.titulo).width
    const y = p.y + RAIO_DO_PONTO_PX + 3
    const caixa = { x0: p.x - largo / 2 - 3, y0: y - 2, x1: p.x + largo / 2 + 3, y1: y + 14 }
    if (bate(caixa, ocupadas)) continue
    ocupadas.push(caixa)
    escreverComHalo(ctx, n.titulo, p.x, y, cena.cores)
    postos++
  }
  ctx.restore()
}

/**
 * O neurônio tocado por cima do véu: as conexões dele, uma por uma — trilha
 * tracejada dentro do livro, ponte cheia para os outros —, os vizinhos acesos
 * e com nome, e a etiqueta dele.
 */
function desenharVizinhanca(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
  selecionado: Id,
  vizinhanca: ReadonlySet<Id>,
  camera: Camera,
  largura: number,
  altura: number,
  naTela: (p: Ponto) => Ponto,
): void {
  const { cores } = cena
  const px = 1 / camera.escala
  const livroDe = new Map(cena.neuronios.map((n) => [n.id, n.livroId]))
  const corDoLivro = new Map(cena.livros.map((l) => [l.id, l.cor]))
  const origem = cena.absolutos.get(selecionado)
  if (!finito(origem)) return

  const vizinhos: { id: Id; score: number }[] = []
  ctx.save()
  aplicarCamera(ctx, camera, largura, altura)
  ctx.lineCap = 'round'
  for (const c of cena.conexoes) {
    if (c.aId !== selecionado && c.bId !== selecionado) continue
    const outroId = c.aId === selecionado ? c.bId : c.aId
    const destino = cena.absolutos.get(outroId)
    if (!finito(destino)) continue
    vizinhos.push({ id: outroId, score: c.score })

    const mesmoLivro = livroDe.get(outroId) === livroDe.get(selecionado)
    ctx.beginPath()
    ctx.moveTo(origem.x, origem.y)
    ctx.lineTo(destino.x, destino.y)
    if (mesmoLivro) {
      ctx.strokeStyle = cores.fio
      ctx.lineWidth = 1.3 * px
      ctx.setLineDash(TRACEJADO_DA_TRILHA_PX.map((d) => d * px))
    } else {
      ctx.strokeStyle = cores.ponte
      ctx.lineWidth = 1.8 * px
      // Score zero é tracejado, como em todo o app: o vizinho menos ruim.
      ctx.setLineDash(c.score === 0 ? [2 * px, 5 * px] : [])
    }
    ctx.stroke()
  }
  ctx.setLineDash([])

  for (const id of vizinhanca) {
    const p = cena.absolutos.get(id)
    const livro = livroDe.get(id)
    if (!finito(p)) continue
    if (cena.feitas.has(id)) desenharFeitas(ctx, [p], cores, 1, px)
    else desenharPontos(ctx, [p], livro ? corDoLivro.get(livro) : undefined, cores, 1, px)
  }
  ctx.strokeStyle = cores.papel
  ctx.lineWidth = 1.5 * px
  ctx.beginPath()
  ctx.arc(origem.x, origem.y, (RAIO_DO_PONTO_PX + 5) * px, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.restore()

  const n = cena.neuronios.find((x) => x.id === selecionado)
  const etiqueta = n ? desenharEtiqueta(ctx, n.titulo, naTela(origem), largura, cores) : null
  vizinhos.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1))
  const candidatos = vizinhos.flatMap(({ id }) => {
    const v = cena.neuronios.find((x) => x.id === id)
    const p = cena.absolutos.get(id)
    return v && finito(p) ? [{ n: v, p: naTela(p) }] : []
  })
  const ocupadas = areasProibidas(cena.cobertas, largura, altura)
  if (etiqueta) ocupadas.push(etiqueta)
  escreverNomesDePontos(ctx, cena, candidatos, ocupadas, 1)
}

/** O nome do neurônio tocado, como na Rede: acima do ponto, sobre um fundo da sala. */
function desenharEtiqueta(
  ctx: CanvasRenderingContext2D,
  titulo: string,
  ponto: Ponto,
  largura: number,
  cores: CoresDoMapa,
): Caixa {
  ctx.save()
  ctx.font = '600 13px ui-serif, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  const largo = ctx.measureText(titulo).width
  const x = Math.min(Math.max(ponto.x, largo / 2 + 10), largura - largo / 2 - 10)
  const y = ponto.y - RAIO_DO_PONTO_PX - 12

  ctx.globalAlpha = 0.9
  ctx.fillStyle = cores.sala
  ctx.fillRect(x - largo / 2 - 7, y - 18, largo + 14, 22)
  ctx.globalAlpha = 1
  ctx.fillStyle = cores.papel
  ctx.fillText(titulo, x, y)
  ctx.restore()
  return { x0: x - largo / 2 - 7, y0: y - 18, x1: x + largo / 2 + 7, y1: y + 4 }
}
