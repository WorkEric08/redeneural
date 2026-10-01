import type { Id, Livro, MapaDoPalacio, NeuronioNaTela, Ponto } from '@/core'
import type { Camera } from '@/features/rede/desenhar'
import { contar } from '@/lib/plural'

import { contornoDaIlha } from './ilha'

/**
 * O desenho do Mapa, em canvas: o palácio como arquipélago — a sala é o mar,
 * a parede é a terra, e cada livro tinge a própria ilha com um toque da cor
 * dele, o mesmo toque que pinta os pontos da Rede. Os pontos são os neurônios;
 * as conexões entram na parte 2.
 *
 * Aqui não há estado nem `useEffect` — é uma função que recebe a cena e pinta.
 */

export interface CoresDoMapa {
  sala: string
  parede: string
  papel: string
  poeira: string
  no: string
}

export interface CenaDoMapa {
  mapa: MapaDoPalacio
  /** Onde cada neurônio está no mundo — o centro da ilha mais o lugar nela. */
  absolutos: ReadonlyMap<Id, Ponto>
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  selecionado: Id | null
  cores: CoresDoMapa
}

/** O ponto do neurônio, em pixels de tela — continua ponto em qualquer zoom. */
const RAIO_DO_PONTO_PX = 2.2

function finito(p: Ponto | undefined): p is Ponto {
  return p !== undefined && Number.isFinite(p.x) && Number.isFinite(p.y)
}

export function desenharMapa(
  ctx: CanvasRenderingContext2D,
  cena: CenaDoMapa,
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
  const px = 1 / camera.escala
  const corDoLivro = new Map(cena.livros.map((l) => [l.id, l.cor]))

  const ilhas = Object.entries(cena.mapa.ilhas).sort((a, b) => (a[0] < b[0] ? -1 : 1))
  for (const [livroId, ilha] of ilhas) {
    const costa = contornoDaIlha(livroId, ilha.raio)
    tracarCosta(ctx, ilha.centro, costa)
    ctx.fillStyle = cores.parede
    ctx.globalAlpha = 1
    ctx.fill()

    const cor = corDoLivro.get(livroId)
    if (cor) {
      ctx.fillStyle = cor
      ctx.globalAlpha = 0.14
      ctx.fill()
      ctx.strokeStyle = cor
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 1.2 * px
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1

  // Os pontos: o claro da noite (ou a tinta do dia) com o toque do livro.
  for (const [livroId, ilha] of ilhas) {
    const cor = corDoLivro.get(livroId)
    const raio = RAIO_DO_PONTO_PX * px
    ctx.beginPath()
    for (const p of Object.values(ilha.pontos)) {
      const x = ilha.centro.x + p.x
      const y = ilha.centro.y + p.y
      ctx.moveTo(x + raio, y)
      ctx.arc(x, y, raio, 0, 2 * Math.PI)
    }
    ctx.fillStyle = cores.no
    ctx.fill()
    if (cor) {
      ctx.fillStyle = cor
      ctx.globalAlpha = 0.38
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  const escolhido = cena.selecionado ? cena.absolutos.get(cena.selecionado) : undefined
  if (finito(escolhido)) {
    ctx.strokeStyle = cores.papel
    ctx.lineWidth = 1.5 * px
    ctx.beginPath()
    ctx.arc(escolhido.x, escolhido.y, (RAIO_DO_PONTO_PX + 5) * px, 0, 2 * Math.PI)
    ctx.stroke()
  }
  ctx.restore()

  // Em pixels de tela, fora da câmera: nome de ilha e de neurônio não encolhem.
  const naTela = (p: Ponto): Ponto => ({
    x: largura / 2 + camera.x + p.x * camera.escala,
    y: altura / 2 + camera.y + p.y * camera.escala,
  })
  const quantos = new Map<Id, number>()
  for (const [livroId, ilha] of ilhas) quantos.set(livroId, Object.keys(ilha.pontos).length)
  for (const [livroId, ilha] of ilhas) {
    const livro = cena.livros.find((l) => l.id === livroId)
    if (!livro) continue
    // O nome é empurrado para dentro da tela pelos lados; com o centro da ilha
    // fora dela, ele flutuaria sobre o mar, longe da ilha que nomeia. Na
    // vertical ele acompanha a ilha, sem empurrão.
    const centro = naTela(ilha.centro)
    const raio = ilha.raio * camera.escala
    const aparece =
      centro.x >= 0 && centro.x <= largura && centro.y + raio > 0 && centro.y - raio < altura
    if (!aparece) continue
    const topo = naTela({ x: ilha.centro.x, y: ilha.centro.y - ilha.raio })
    desenharNomeDaIlha(ctx, livro.titulo, quantos.get(livroId) ?? 0, topo, largura, cores)
  }

  if (finito(escolhido) && cena.selecionado) {
    const n = cena.neuronios.find((x) => x.id === cena.selecionado)
    if (n) desenharEtiqueta(ctx, n.titulo, naTela(escolhido), largura, cores)
  }
}

/** A costa como curva suave: quadráticas pelos pontos médios, sem quinas. */
function tracarCosta(ctx: CanvasRenderingContext2D, centro: Ponto, costa: readonly Ponto[]): void {
  ctx.beginPath()
  const n = costa.length
  const meio = (a: Ponto, b: Ponto): Ponto => ({
    x: centro.x + (a.x + b.x) / 2,
    y: centro.y + (a.y + b.y) / 2,
  })
  const inicio = meio(costa[n - 1]!, costa[0]!)
  ctx.moveTo(inicio.x, inicio.y)
  for (let i = 0; i < n; i++) {
    const p = costa[i]!
    const m = meio(p, costa[(i + 1) % n]!)
    ctx.quadraticCurveTo(centro.x + p.x, centro.y + p.y, m.x, m.y)
  }
  ctx.closePath()
}

/** O nome do livro acima da ilha, e quantos neurônios moram nela. */
function desenharNomeDaIlha(
  ctx: CanvasRenderingContext2D,
  titulo: string,
  quantos: number,
  topo: Ponto,
  largura: number,
  cores: CoresDoMapa,
): void {
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.font = '600 13px ui-serif, Georgia, serif'
  const largo = Math.max(ctx.measureText(titulo).width, 60)
  const x = Math.min(Math.max(topo.x, largo / 2 + 8), largura - largo / 2 - 8)

  ctx.fillStyle = cores.papel
  ctx.fillText(titulo, x, topo.y - 20)
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
  ctx.fillStyle = cores.poeira
  ctx.fillText(contar(quantos, 'neurônio', 'neurônios'), x, topo.y - 6)
  ctx.restore()
}

/** O nome do neurônio tocado, como na Rede: acima do ponto, sobre um fundo da sala. */
function desenharEtiqueta(
  ctx: CanvasRenderingContext2D,
  titulo: string,
  ponto: Ponto,
  largura: number,
  cores: CoresDoMapa,
): void {
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
}
