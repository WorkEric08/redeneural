import type { Conexao, Id, Livro, NeuronioNaTela, Ponto } from '@/core'

/**
 * O desenho da rede, em canvas: uma constelação.
 *
 * Canvas e não SVG por decisão do plano: centenas de nós em SVG viram centenas
 * de elementos no DOM, e numa WebView Android isso derruba a rolagem.
 *
 * Pontos pequenos e fios finíssimos, que à noite **somam luz** (`lighter`) e de
 * dia **acumulam tinta** (`multiply`) — onde muitos se cruzam, o aglomerado
 * aparece sozinho. As pontes continuam por cima de tudo, na cor de ponte —
 * ouro até 15/09/2026, azul claro desde então (pedido do usuário — ver
 * CLAUDE.md, "A ponte muda de ouro para azul").
 *
 * Aqui não há estado nem `useEffect` — é uma função que recebe a cena e pinta.
 */

export interface CoresDaRede {
  sala: string
  papel: string
  ponte: string
  fio: string
  no: string
  mistura: GlobalCompositeOperation
}

export interface Camera {
  x: number
  y: number
  escala: number
}

export interface Cena {
  /** Onde cada neurônio está — organizado por significado, gravado (`@/core/motor/redeLayout`). */
  posicoes: ReadonlyMap<Id, Ponto>
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

/**
 * Quantas faixas de brilho os fios têm. Um `stroke()` por faixa, e não um por
 * fio: milhares de traços separados engasgam numa WebView, e a diferença entre
 * seis níveis de opacidade e um contínuo não se vê num fio de meio pixel.
 */
const FAIXAS = 6

/**
 * O raio de um neurônio **em pixels de tela**, e não do mundo: numa
 * constelação o ponto continua ponto quando você aproxima. O hub cresce um
 * pouco — o motor já o faz crescer —, mas nunca vira bola.
 */
export function raioNaTela(grau: number): number {
  return 1.25 + Math.min(grau, 12) * 0.11
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
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = cores.sala
  ctx.fillRect(0, 0, largura, altura)

  ctx.translate(largura / 2 + camera.x, altura / 2 + camera.y)
  ctx.scale(camera.escala, camera.escala)

  // Um pixel de tela em unidades do mundo: é o que mantém fio e ponto finos em
  // qualquer zoom.
  const px = 1 / camera.escala
  const livroDoNeuronio = new Map(cena.neuronios.map((n) => [n.id, n.livroId]))
  const apagado = (livroId: Id | undefined): boolean =>
    cena.livroEmFoco !== null && cena.livroEmFoco !== livroId

  ctx.lineCap = 'round'
  if (!cena.soAsPontes) desenharFios(ctx, cena, livroDoNeuronio, apagado, px)
  desenharPontes(ctx, cena, livroDoNeuronio, apagado, px)
  desenharNeuronios(ctx, cena, apagado, px)

  ctx.restore()

  if (cena.selecionado) desenharEtiqueta(ctx, cena, camera, largura, altura)
}

function finito(p: Ponto | undefined): p is Ponto {
  // Um ponto não-finito faria o canvas lançar e derrubar a rota inteira pelo
  // ErrorBoundary. Um desenho incompleto é sempre melhor que uma tela branca.
  return p !== undefined && Number.isFinite(p.x) && Number.isFinite(p.y)
}

interface Lote {
  alfa: number
  largura: number
  tracejado: boolean
  segmentos: [Ponto, Ponto][]
}

function acrescentar(
  lotes: Map<string, Lote>,
  chave: string,
  base: Omit<Lote, 'segmentos'>,
  a: Ponto,
  b: Ponto,
): void {
  const lote = lotes.get(chave)
  if (lote) lote.segmentos.push([a, b])
  else lotes.set(chave, { ...base, segmentos: [[a, b]] })
}

function tracarLotes(ctx: CanvasRenderingContext2D, lotes: Map<string, Lote>, px: number): void {
  for (const lote of lotes.values()) {
    ctx.globalAlpha = lote.alfa
    ctx.lineWidth = lote.largura
    // Score zero vira tracejado: é o vizinho menos ruim, não um parentesco.
    ctx.setLineDash(lote.tracejado ? [2 * px, 5 * px] : [])
    ctx.beginPath()
    for (const [a, b] of lote.segmentos) {
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
    }
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

function desenharFios(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  livroDoNeuronio: ReadonlyMap<Id, Id>,
  apagado: (livroId: Id | undefined) => boolean,
  px: number,
): void {
  const { posicoes } = cena
  const lotes = new Map<string, Lote>()

  for (const c of cena.conexoes) {
    if (c.cross) continue
    const a = posicoes.get(c.aId)
    const b = posicoes.get(c.bId)
    if (!finito(a) || !finito(b)) continue

    const faixa = Math.min(FAIXAS - 1, Math.floor(c.score * FAIXAS))
    const longe = apagado(livroDoNeuronio.get(c.aId))
    const tracejado = c.score === 0
    const forca = (faixa + 0.5) / FAIXAS

    acrescentar(
      lotes,
      `${String(faixa)}:${String(longe)}:${String(tracejado)}`,
      {
        alfa: (0.12 + forca * 0.45) * (longe ? APAGADO : 1),
        largura: (0.55 + forca * 0.65) * px,
        tracejado,
      },
      a,
      b,
    )
  }

  ctx.globalCompositeOperation = cena.cores.mistura
  ctx.strokeStyle = cena.cores.fio
  tracarLotes(ctx, lotes, px)
  ctx.globalCompositeOperation = 'source-over'
}

/**
 * A ponte é o achado e não pode ficar debaixo de nada, e ela brilha — duas
 * passadas, um halo largo e fraco e o fio fino e forte, em vez de
 * `shadowBlur`, que numa WebView custa um desfoque por traço.
 */
function desenharPontes(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  livroDoNeuronio: ReadonlyMap<Id, Id>,
  apagado: (livroId: Id | undefined) => boolean,
  px: number,
): void {
  const { posicoes } = cena
  const halos = new Map<string, Lote>()
  const fios = new Map<string, Lote>()

  for (const c of cena.conexoes) {
    if (!c.cross) continue
    const a = posicoes.get(c.aId)
    const b = posicoes.get(c.bId)
    if (!finito(a) || !finito(b)) continue

    const faixa = Math.min(FAIXAS - 1, Math.floor(c.score * FAIXAS))
    // Uma ponte só se apaga se os dois lados estão fora do foco: ela é justamente
    // o que liga o livro em foco aos outros.
    const longe = apagado(livroDoNeuronio.get(c.aId)) && apagado(livroDoNeuronio.get(c.bId))
    const tracejado = c.score === 0
    const forca = (faixa + 0.5) / FAIXAS
    const chave = `${String(faixa)}:${String(longe)}:${String(tracejado)}`
    const escurecer = longe ? APAGADO : 1

    acrescentar(
      halos,
      chave,
      { alfa: (0.03 + forca * 0.07) * escurecer, largura: 3 * px, tracejado: false },
      a,
      b,
    )
    acrescentar(
      fios,
      chave,
      { alfa: (0.28 + forca * 0.37) * escurecer, largura: (0.6 + forca * 0.45) * px, tracejado },
      a,
      b,
    )
  }

  ctx.globalCompositeOperation = cena.cores.mistura
  ctx.strokeStyle = cena.cores.ponte
  tracarLotes(ctx, halos, px)
  // O fio de ponte por cima é tinta normal: somado à luz dos fios de baixo ele
  // estouraria para uma cor lavada, e a ponte tem que continuar reconhecível.
  ctx.globalCompositeOperation = 'source-over'
  tracarLotes(ctx, fios, px)
}

/**
 * Pontos claros de noite e escuros de dia, com um toque da cor do livro por
 * cima — o bastante para reconhecer o livro de perto sem transformar a
 * constelação num mapa de cores.
 */
function desenharNeuronios(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  apagado: (livroId: Id | undefined) => boolean,
  px: number,
): void {
  const corDoLivro = new Map(cena.livros.map((l) => [l.id, l.cor]))
  const grupos = new Map<
    string,
    { cor: string | undefined; longe: boolean; pontos: [Ponto, number][] }
  >()

  for (const n of cena.neuronios) {
    const p = cena.posicoes.get(n.id)
    if (!finito(p)) continue
    const longe = apagado(n.livroId)
    const chave = `${n.livroId}:${String(longe)}`
    const raio = raioNaTela(cena.graus.get(n.id) ?? 0) * px
    const grupo = grupos.get(chave)
    if (grupo) grupo.pontos.push([p, raio])
    else grupos.set(chave, { cor: corDoLivro.get(n.livroId), longe, pontos: [[p, raio]] })
  }

  const circulos = (pontos: [Ponto, number][], aumento: number): void => {
    ctx.beginPath()
    for (const [p, raio] of pontos) {
      ctx.moveTo(p.x + raio * aumento, p.y)
      ctx.arc(p.x, p.y, raio * aumento, 0, 2 * Math.PI)
    }
    ctx.fill()
  }

  for (const { cor, longe, pontos } of grupos.values()) {
    const escurecer = longe ? APAGADO : 1

    // Sem halo em volta do ponto: num aglomerado denso os halos se somavam em
    // manchas, e a constelação deixava de ser pontos.
    ctx.fillStyle = cena.cores.no
    ctx.globalAlpha = escurecer
    circulos(pontos, 1)

    if (cor) {
      ctx.fillStyle = cor
      ctx.globalAlpha = 0.38 * escurecer
      circulos(pontos, 1)
    }
  }
  ctx.globalAlpha = 1

  const escolhido = cena.selecionado ? cena.posicoes.get(cena.selecionado) : undefined
  if (finito(escolhido) && cena.selecionado) {
    const raio = raioNaTela(cena.graus.get(cena.selecionado) ?? 0) * px
    ctx.strokeStyle = cena.cores.papel
    ctx.lineWidth = 1.5 * px
    ctx.beginPath()
    ctx.arc(escolhido.x, escolhido.y, raio + 5 * px, 0, 2 * Math.PI)
    ctx.stroke()
  }
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
  const p = cena.selecionado ? cena.posicoes.get(cena.selecionado) : undefined
  if (!n || !finito(p)) return

  const x = largura / 2 + camera.x + p.x * camera.escala
  const y = altura / 2 + camera.y + p.y * camera.escala
  const raio = raioNaTela(cena.graus.get(n.id) ?? 0)

  ctx.save()
  ctx.font = '600 13px ui-serif, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const largo = ctx.measureText(n.titulo).width
  const caixaX = Math.min(Math.max(x, largo / 2 + 10), largura - largo / 2 - 10)
  const caixaY = y - raio - 12

  ctx.globalAlpha = 0.9
  ctx.fillStyle = cena.cores.sala
  ctx.fillRect(caixaX - largo / 2 - 7, caixaY - 18, largo + 14, 22)

  ctx.globalAlpha = 1
  ctx.fillStyle = cena.cores.papel
  ctx.fillText(n.titulo, caixaX, caixaY)
  ctx.restore()
}
