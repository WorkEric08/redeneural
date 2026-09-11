import type { Conexao, Id, Livro, NeuronioNaTela } from '@/core'

import type { Mapa, Ponto } from './layout'

/**
 * O desenho da rede, em canvas.
 *
 * Canvas e não SVG por decisão do plano: centenas de nós em SVG viram centenas
 * de elementos no DOM, e numa WebView Android isso derruba a rolagem.
 *
 * Aqui não há estado nem `useEffect` — é uma função que recebe a cena e pinta.
 */

export interface CoresDaRede {
  sala: string
  papel: string
  poeira: string
  ouro: string
  linha: string
}

export interface Camera {
  x: number
  y: number
  escala: number
}

export interface Cena {
  mapa: Mapa
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  conexoes: readonly Conexao[]
  graus: ReadonlyMap<Id, number>
  /** Um livro em foco apaga o resto, sem escondê-lo. */
  livroEmFoco: Id | null
  /** Só as pontes: some com tudo que não atravessa livro. */
  soAsPontes: boolean
  selecionado: Id | null
  cores: CoresDaRede
}

const APAGADO = 0.12

export function raioDoNeuronio(grau: number): number {
  return 4 + Math.min(grau, 14) * 0.85
}

function finito(n: number, padrao: number): number {
  return Number.isFinite(n) ? n : padrao
}

/** O halo da região acompanha o tamanho do palácio, medido pelas próprias âncoras. */
function raioDaRegiao(cena: Cena): number {
  const primeira = [...cena.mapa.ancoras.values()][0]
  const distancia = primeira ? Math.hypot(primeira.x, primeira.y) : 120
  return Math.max(90, finito(distancia, 120) * 0.72)
}

export function desenhar(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  camera: Camera,
  largura: number,
  altura: number,
): void {
  const { cores } = cena

  ctx.save()
  ctx.fillStyle = cores.sala
  ctx.fillRect(0, 0, largura, altura)

  ctx.translate(largura / 2 + camera.x, altura / 2 + camera.y)
  ctx.scale(camera.escala, camera.escala)

  const livroDoNeuronio = new Map(cena.neuronios.map((n) => [n.id, n.livroId]))
  const corDoLivro = new Map(cena.livros.map((l) => [l.id, l.cor]))

  const visivel = (livroId: Id | undefined): number =>
    cena.livroEmFoco === null || cena.livroEmFoco === livroId ? 1 : APAGADO

  desenharRegioes(ctx, cena, corDoLivro, visivel)
  desenharFios(ctx, cena, livroDoNeuronio, corDoLivro, visivel)
  desenharNeuronios(ctx, cena, livroDoNeuronio, corDoLivro, visivel)
  desenharNomes(ctx, cena, visivel)

  ctx.restore()

  if (cena.selecionado) desenharEtiqueta(ctx, cena, camera, largura, altura)
}

/** O livro é uma região: um halo largo e fraco na cor do pano. */
function desenharRegioes(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  corDoLivro: ReadonlyMap<Id, string>,
  visivel: (livroId: Id | undefined) => number,
): void {
  const raio = raioDaRegiao(cena)

  for (const [livroId, ancora] of cena.mapa.ancoras) {
    const cor = corDoLivro.get(livroId)
    // Um ponto não-finito faria o canvas lançar e derrubar a rota inteira pelo
    // ErrorBoundary. Um desenho incompleto é sempre melhor que uma tela branca.
    if (!cor || !Number.isFinite(ancora.x) || !Number.isFinite(ancora.y)) continue

    const halo = ctx.createRadialGradient(ancora.x, ancora.y, 0, ancora.x, ancora.y, raio)
    halo.addColorStop(0, cor)
    halo.addColorStop(1, 'transparent')

    ctx.globalAlpha = 0.16 * visivel(livroId)
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(ancora.x, ancora.y, raio, 0, 2 * Math.PI)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * Fios internos primeiro, pontes por cima — a ponte é o achado e não pode ficar
 * debaixo de nada. O ouro é luz, então ela também brilha um pouco.
 */
function desenharFios(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  livroDoNeuronio: ReadonlyMap<Id, Id>,
  corDoLivro: ReadonlyMap<Id, string>,
  visivel: (livroId: Id | undefined) => number,
): void {
  const { posicoes } = cena.mapa

  ctx.lineCap = 'round'

  if (!cena.soAsPontes) {
    for (const c of cena.conexoes) {
      if (c.cross) continue
      const a = posicoes.get(c.aId)
      const b = posicoes.get(c.bId)
      if (!a || !b) continue

      const livroId = livroDoNeuronio.get(c.aId)
      ctx.globalAlpha = (0.16 + c.score * 0.4) * visivel(livroId)
      ctx.strokeStyle = corDoLivro.get(livroId ?? '') ?? cena.cores.poeira
      ctx.lineWidth = 0.6 + c.score * 1.8
      tracar(ctx, a, b, c.score === 0)
    }
  }

  ctx.shadowColor = cena.cores.ouro
  for (const c of cena.conexoes) {
    if (!c.cross) continue
    const a = posicoes.get(c.aId)
    const b = posicoes.get(c.bId)
    if (!a || !b) continue

    const foco = Math.max(visivel(livroDoNeuronio.get(c.aId)), visivel(livroDoNeuronio.get(c.bId)))
    ctx.globalAlpha = (0.45 + c.score * 0.5) * foco
    ctx.strokeStyle = cena.cores.ouro
    ctx.lineWidth = 0.9 + c.score * 2.4
    ctx.shadowBlur = 6 * foco
    tracar(ctx, a, b, c.score === 0)
  }

  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

/** Score zero vira tracejado: é o vizinho menos ruim, não um parentesco. */
function tracar(ctx: CanvasRenderingContext2D, a: Ponto, b: Ponto, tracejado: boolean): void {
  ctx.setLineDash(tracejado ? [2, 5] : [])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.setLineDash([])
}

function desenharNeuronios(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  livroDoNeuronio: ReadonlyMap<Id, Id>,
  corDoLivro: ReadonlyMap<Id, string>,
  visivel: (livroId: Id | undefined) => number,
): void {
  for (const n of cena.neuronios) {
    const p = cena.mapa.posicoes.get(n.id)
    if (!p) continue

    const raio = raioDoNeuronio(cena.graus.get(n.id) ?? 0)
    ctx.globalAlpha = visivel(livroDoNeuronio.get(n.id))
    ctx.fillStyle = corDoLivro.get(n.livroId) ?? cena.cores.poeira

    ctx.beginPath()
    ctx.arc(p.x, p.y, raio, 0, 2 * Math.PI)
    ctx.fill()

    if (n.id === cena.selecionado) {
      ctx.strokeStyle = cena.cores.papel
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, raio + 5, 0, 2 * Math.PI)
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

/** O nome do livro fica gravado na região, como numa lombada. */
function desenharNomes(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  visivel: (livroId: Id | undefined) => number,
): void {
  const nome = new Map(cena.livros.map((l) => [l.id, l.titulo]))

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 13px ui-serif, Georgia, serif'
  ctx.fillStyle = cena.cores.ouro

  for (const [livroId, ponto] of cena.mapa.rotulos) {
    const titulo = nome.get(livroId)
    if (!titulo) continue

    ctx.globalAlpha = 0.8 * visivel(livroId)
    ctx.fillText(titulo.toUpperCase(), ponto.x, ponto.y)
  }
  ctx.globalAlpha = 1
}

/**
 * A etiqueta do selecionado é desenhada fora da câmera, em pixels de tela: nome
 * de neurônio não pode encolher junto com o zoom.
 */
function desenharEtiqueta(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  camera: Camera,
  largura: number,
  altura: number,
): void {
  const n = cena.neuronios.find((x) => x.id === cena.selecionado)
  const p = cena.selecionado ? cena.mapa.posicoes.get(cena.selecionado) : undefined
  if (!n || !p) return

  const x = largura / 2 + camera.x + p.x * camera.escala
  const y = altura / 2 + camera.y + p.y * camera.escala
  const raio = raioDoNeuronio(cena.graus.get(n.id) ?? 0) * camera.escala

  ctx.save()
  ctx.font = '600 13px ui-serif, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const largo = ctx.measureText(n.titulo).width
  const caixaX = Math.min(Math.max(x, largo / 2 + 10), largura - largo / 2 - 10)
  const caixaY = y - raio - 10

  ctx.globalAlpha = 0.92
  ctx.fillStyle = cena.cores.sala
  ctx.fillRect(caixaX - largo / 2 - 7, caixaY - 18, largo + 14, 22)

  ctx.globalAlpha = 1
  ctx.fillStyle = cena.cores.papel
  ctx.fillText(n.titulo, caixaX, caixaY)
  ctx.restore()
}
