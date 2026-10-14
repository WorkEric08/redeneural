import type { Conexao, Id, Livro, NeuronioNaTela, Ponto } from '@/core'

import { alvoDoPadrao, etiquetaDoPadrao, spriteDeNevoa, type CaixaDeTela } from './canvas'

import {
  ESCALA_QUE_REVELA,
  ORBITAS_DO_SATELITE_PX,
  posicaoDoSatelite,
  satelitesVisiveis,
  vizinhancaDe,
  type SateliteDaCena,
} from './layout'

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
  /** O ponto das ideias feitas — o ouro gravado das lombadas, nunca o da ponte. */
  ouro: string
  /** O círculo da ideia "para fazer", e a base do "fazendo". */
  cinza: string
  /** O halo de quem está em andamento: o tom do texto, que clareia na sala escura e escurece na clara. */
  brilho: string
  /** A névoa das adormecidas. */
  nevoa: string
  mistura: GlobalCompositeOperation
  /** A fonte do nome do pensamento escolhido (ver `lerFonteDoCanvas`). */
  fonteTitulo: string
  /** O tema Padrão: pontos de tinta sem o toque do livro, o alvo no escolhido e etiquetas em retângulo. */
  padrao: boolean
  /** Preenchimento e texto de destaque, e a superfície — só o tema Padrão usa. */
  blk: string
  blkt: string
  parede: string
  poeira: string
  /** A sombra curta das etiquetas (`null` onde o fundo é escuro). */
  sombraDaEtiqueta: string | null
}

export interface Camera {
  x: number
  y: number
  escala: number
}

export interface Cena {
  /** Onde cada pensamento está — organizado por significado, gravado (`@/core/motor/redeLayout`). */
  posicoes: ReadonlyMap<Id, Ponto>
  livros: readonly Livro[]
  neuronios: readonly NeuronioNaTela[]
  conexoes: readonly Conexao[]
  graus: ReadonlyMap<Id, number>
  /** Um livro em foco apaga o resto, sem escondê-lo. */
  livroEmFoco: Id | null
  /** Só as pontes: some com tudo que não atravessa livro. */
  soAsPontes: boolean
  /** Tocar um pensamento acende ele e a vizinhança dele; o resto apaga. */
  selecionado: Id | null
  /** Os itens das pastas de acervo que se prenderam a algum conceito. */
  satelites: readonly SateliteDaCena[]
  /** Tocar um satélite acende só ele e os conceitos que ele escolheu. */
  anexoSelecionado: Id | null
  /** Ideias adormecidas dos livros executáveis: na névoa, apagadas, e os fios delas mais fracos. */
  adormecidas: ReadonlySet<Id>
  /** Ideias feitas dos livros executáveis: o próprio ponto fica dourado. */
  feitas: ReadonlySet<Id>
  /** Ideias em andamento (acordadas): círculo cinza com um brilho claro. */
  fazendo: ReadonlySet<Id>
  /** Ideias para fazer: círculo cinza. */
  paraFazer: ReadonlySet<Id>
  cores: CoresDaRede
}

const APAGADO = 0.12
/** O quanto uma ideia adormecida, e os fios dela, perdem de luz — sem sumir. */
const DORMENTE = 0.35
/** O raio do chumaço de névoa em volta de uma adormecida, em px de tela. */
const RAIO_DA_NEVOA_PX = 13
/** O brilho claro em volta de uma ideia em andamento, em px de tela, e o quanto ele aparece. */
const RAIO_DO_BRILHO_PX = 11
const PRESENCA_DO_BRILHO = 0.7
/** O anel da ideia feita, a esta distância do ponto, em px de tela. */

/**
 * Quantas faixas de brilho os fios têm. Um `stroke()` por faixa, e não um por
 * fio: milhares de traços separados engasgam numa WebView, e a diferença entre
 * seis níveis de opacidade e um contínuo não se vê num fio de meio pixel.
 */
const FAIXAS = 6

/**
 * O raio de um pensamento **em pixels de tela**, e não do mundo: numa
 * constelação o ponto continua ponto quando você aproxima. O hub cresce um
 * pouco — o motor já o faz crescer —, mas nunca vira bola.
 */
export function raioNaTela(grau: number, padrao = false): number {
  // No Padrão o ponto é o das pranchas (4 px), com o hub só um pouco maior.
  if (padrao) return 3 + Math.min(grau, 12) * 0.1
  return 1.25 + Math.min(grau, 12) * 0.11
}

/**
 * As checagens de "isto apaga?", montadas uma vez por pintura. Duas razões
 * independentes, sempre combinadas com OU: fora do livro em foco, ou fora da
 * vizinhança de quem está selecionado.
 *
 * Uma ponte só apaga pelo livro se os dois lados estiverem fora — ela é
 * justamente o que liga o livro em foco aos outros. Já a vizinhança é mais
 * estrita: só o fio que toca o selecionado fica aceso, não os fios entre dois
 * vizinhos dele (isso seria "vizinhança de vizinhança").
 */
function montarChecagens(cena: Cena) {
  const vizinhanca = vizinhancaDe(cena.selecionado, cena.conexoes)
  // Um satélite tocado é o foco: acesos só ele e os conceitos que escolheu, e
  // nenhum fio entre conceitos — os fios que contam agora são os dele.
  const tocado =
    cena.anexoSelecionado === null
      ? undefined
      : cena.satelites.find((s) => s.anexoId === cena.anexoSelecionado)
  const doAnexo = tocado ? new Set<Id>([tocado.donoId, ...tocado.outrosIds]) : null
  const livroDe = new Map(cena.neuronios.map((n) => [n.id, n.livroId]))

  // Um pensamento no porto não é de livro nenhum: com um livro em foco, apaga.
  const apagadoPeloLivro = (livroId: Id | null | undefined): boolean =>
    cena.livroEmFoco !== null && cena.livroEmFoco !== livroId

  const arestaApagadaPelaVizinhanca = (aId: Id, bId: Id): boolean =>
    doAnexo !== null ||
    (cena.selecionado !== null && aId !== cena.selecionado && bId !== cena.selecionado)

  return {
    internaApagada: (livroId: Id | null | undefined, aId: Id, bId: Id): boolean =>
      apagadoPeloLivro(livroId) || arestaApagadaPelaVizinhanca(aId, bId),
    ponteApagada: (
      livroA: Id | null | undefined,
      livroB: Id | null | undefined,
      aId: Id,
      bId: Id,
    ): boolean =>
      (apagadoPeloLivro(livroA) && apagadoPeloLivro(livroB)) ||
      arestaApagadaPelaVizinhanca(aId, bId),
    noApagado: (n: NeuronioNaTela): boolean =>
      apagadoPeloLivro(n.livroId) ||
      (vizinhanca !== null && !vizinhanca.has(n.id)) ||
      (doAnexo !== null && !doAnexo.has(n.id)),
    // O satélite segue o dono: apaga com ele pelo livro e pela vizinhança, e
    // apaga sozinho quando outro satélite é o tocado.
    sateliteApagado: (s: SateliteDaCena): boolean =>
      apagadoPeloLivro(livroDe.get(s.donoId)) ||
      (vizinhanca !== null && !vizinhanca.has(s.donoId)) ||
      (cena.anexoSelecionado !== null && s.anexoId !== cena.anexoSelecionado),
  }
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
  const { internaApagada, ponteApagada, noApagado, sateliteApagado } = montarChecagens(cena)

  ctx.lineCap = 'round'
  if (!cena.soAsPontes) desenharFios(ctx, cena, livroDoNeuronio, internaApagada, px)
  desenharPontes(ctx, cena, livroDoNeuronio, ponteApagada, px)
  desenharNeuronios(ctx, cena, noApagado, px)
  desenharSatelites(ctx, cena, camera.escala, sateliteApagado, px)
  if (!cores.padrao) desenharRotulosAmbiente(ctx, cena, camera.escala, noApagado)

  ctx.restore()

  if (cores.padrao) desenharRotulosDoPadrao(ctx, cena, camera, largura, altura, noApagado)
  else if (cena.selecionado) desenharEtiqueta(ctx, cena, camera, largura, altura)
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
  livroDoNeuronio: ReadonlyMap<Id, Id | null>,
  apagada: (livroId: Id | null | undefined, aId: Id, bId: Id) => boolean,
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
    const longe = apagada(livroDoNeuronio.get(c.aId), c.aId, c.bId)
    const tracejado = c.score === 0
    const forca = (faixa + 0.5) / FAIXAS
    const dorme = cena.adormecidas.has(c.aId) || cena.adormecidas.has(c.bId)

    // No Padrão (pranchas "Rede"): fio fino de tinta; o que toca o escolhido fica forte.
    const doEscolhido = cena.cores.padrao && cena.selecionado !== null && !longe
    acrescentar(
      lotes,
      `${String(faixa)}:${String(longe)}:${String(tracejado)}:${String(dorme)}:${String(doEscolhido)}`,
      cena.cores.padrao
        ? {
            alfa: doEscolhido
              ? 0.85
              : (0.12 + forca * 0.22) * (longe ? 0.5 : 1) * (dorme ? DORMENTE : 1),
            largura: (doEscolhido ? 1.75 : 1.1) * px,
            tracejado,
          }
        : {
            alfa: (0.12 + forca * 0.45) * (longe ? APAGADO : 1) * (dorme ? DORMENTE : 1),
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
  livroDoNeuronio: ReadonlyMap<Id, Id | null>,
  apagada: (
    livroA: Id | null | undefined,
    livroB: Id | null | undefined,
    aId: Id,
    bId: Id,
  ) => boolean,
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
    const longe = apagada(livroDoNeuronio.get(c.aId), livroDoNeuronio.get(c.bId), c.aId, c.bId)
    const tracejado = c.score === 0
    const forca = (faixa + 0.5) / FAIXAS
    const dorme = cena.adormecidas.has(c.aId) || cena.adormecidas.has(c.bId)
    const chave = `${String(faixa)}:${String(longe)}:${String(tracejado)}:${String(dorme)}`
    const escurecer = (longe ? APAGADO : 1) * (dorme ? DORMENTE : 1)

    // No Padrão a ponte é um fio de 2 px no azul do acento, sem halo.
    if (cena.cores.padrao) {
      const forte = cena.selecionado !== null && !longe
      acrescentar(
        fios,
        chave,
        {
          alfa: (forte ? 0.95 : 0.75) * (longe ? 0.4 : 1) * (dorme ? DORMENTE : 1),
          largura: 2 * px,
          tracejado,
        },
        a,
        b,
      )
      continue
    }

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
  apagado: (n: NeuronioNaTela) => boolean,
  px: number,
): void {
  const corDoLivro = new Map(cena.livros.map((l) => [l.id, l.cor]))
  const grupos = new Map<
    string,
    { cor: string | undefined; escurecer: number; tinta: string; pontos: [Ponto, number][] }
  >()

  // A névoa vem antes do ponto: ele fica dentro dela, não por cima de um borrão.
  if (cena.adormecidas.size > 0) {
    const nevoa = spriteDeNevoa(cena.cores.nevoa)
    const r = RAIO_DA_NEVOA_PX * px
    for (const n of cena.neuronios) {
      if (!cena.adormecidas.has(n.id)) continue
      const p = cena.posicoes.get(n.id)
      if (!finito(p)) continue
      ctx.globalAlpha = 0.5 * (apagado(n) ? APAGADO : 1)
      ctx.drawImage(nevoa, p.x - r, p.y - r, 2 * r, 2 * r)
    }
    ctx.globalAlpha = 1
  }

  // O brilho de quem está em andamento também vem antes do ponto, e some junto com o que apaga.
  if (cena.fazendo.size > 0) {
    const brilho = spriteDeNevoa(cena.cores.brilho)
    const r = RAIO_DO_BRILHO_PX * px
    for (const n of cena.neuronios) {
      if (!cena.fazendo.has(n.id)) continue
      const p = cena.posicoes.get(n.id)
      if (!finito(p)) continue
      ctx.globalAlpha = PRESENCA_DO_BRILHO * (apagado(n) ? APAGADO : 1)
      ctx.drawImage(brilho, p.x - r, p.y - r, 2 * r, 2 * r)
    }
    ctx.globalAlpha = 1
  }

  for (const n of cena.neuronios) {
    const p = cena.posicoes.get(n.id)
    if (!finito(p)) continue
    const longe = apagado(n)
    const dorme = cena.adormecidas.has(n.id)
    // A tinta do ponto diz o andamento: o amarelo da feita, o cinza de quem é para fazer ou está
    // fazendo, e a de sempre para o resto.
    const tinta = cena.feitas.has(n.id)
      ? cena.cores.ouro
      : cena.fazendo.has(n.id) || cena.paraFazer.has(n.id)
        ? cena.cores.cinza
        : cena.cores.no
    const chave = `${n.livroId}:${String(longe)}:${String(dorme)}:${tinta}`
    const raio = raioNaTela(cena.graus.get(n.id) ?? 0, cena.cores.padrao) * px
    const grupo = grupos.get(chave)
    if (grupo) grupo.pontos.push([p, raio])
    else {
      // No porto não há livro, então não há o toque da cor de livro nenhum.
      // No Padrão os pontos são só tinta: as pranchas não levam o toque da cor do livro.
      // A ideia executável também não leva o toque da cor do livro: a tinta dela é o andamento.
      const cor =
        n.livroId === null || tinta !== cena.cores.no || cena.cores.padrao
          ? undefined
          : corDoLivro.get(n.livroId)
      const escurecer = (longe ? (cena.cores.padrao ? 0.3 : APAGADO) : 1) * (dorme ? DORMENTE : 1)
      grupos.set(chave, { cor, escurecer, tinta, pontos: [[p, raio]] })
    }
  }

  const circulos = (pontos: [Ponto, number][], aumento: number): void => {
    ctx.beginPath()
    for (const [p, raio] of pontos) {
      ctx.moveTo(p.x + raio * aumento, p.y)
      ctx.arc(p.x, p.y, raio * aumento, 0, 2 * Math.PI)
    }
    ctx.fill()
  }

  for (const { cor, escurecer, tinta, pontos } of grupos.values()) {
    // Sem halo em volta do ponto: num aglomerado denso os halos se somavam em
    // manchas, e a constelação deixava de ser pontos.
    ctx.fillStyle = tinta
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
  if (finito(escolhido) && cena.selecionado && cena.cores.padrao) {
    alvoDoPadrao(ctx, escolhido.x, escolhido.y, px, {
      cheio: cena.cores.blk,
      fundo: cena.cores.sala,
    })
  } else if (finito(escolhido) && cena.selecionado) {
    const raio = raioNaTela(cena.graus.get(cena.selecionado) ?? 0) * px
    ctx.strokeStyle = cena.cores.papel
    ctx.lineWidth = 1.5 * px
    ctx.beginPath()
    ctx.arc(escolhido.x, escolhido.y, raio + 5 * px, 0, 2 * Math.PI)
    ctx.stroke()
  }
}

/** Meio lado do quadrado e meia diagonal do losango, em pixels de tela. */
const MEIO_QUADRADO_PX = 2
const MEIA_DIAGONAL_PX = 2.6

/**
 * Os itens das pastas: satélites em volta do conceito que escolheram, num fio
 * curto até ele. A posição é calculada agora, a partir de onde o dono está
 * desenhado — por isso acompanha o balanço e o arrasto sem código a mais.
 *
 * O fio é o de sempre, na cor dos fios, e nunca o da ponte: ponte é o achado
 * entre conceitos. Os fios até os outros conceitos escolhidos só aparecem com
 * o satélite tocado — sempre à mostra, eles virariam novelo de perto.
 */
function desenharSatelites(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  escala: number,
  apagado: (s: SateliteDaCena) => boolean,
  px: number,
): void {
  const visiveis = satelitesVisiveis(cena.satelites, {
    escala,
    soAsPontes: cena.soAsPontes,
    selecionado: cena.selecionado,
    anexoSelecionado: cena.anexoSelecionado,
  })
  if (visiveis.length === 0) return

  const corDaPasta = new Map(cena.livros.map((l) => [l.id, l.cor]))
  const desenhados: { s: SateliteDaCena; p: Ponto; dono: Ponto; escurecer: number }[] = []
  for (const s of visiveis) {
    const dono = cena.posicoes.get(s.donoId)
    if (!finito(dono)) continue
    const p = posicaoDoSatelite(dono, s.anexoId, escala)
    desenhados.push({ s, p, dono, escurecer: apagado(s) ? APAGADO : 1 })
  }

  ctx.globalCompositeOperation = cena.cores.mistura
  ctx.strokeStyle = cena.cores.fio
  ctx.lineWidth = 0.6 * px
  for (const { s, p, dono, escurecer } of desenhados) {
    ctx.globalAlpha = 0.45 * escurecer
    ctx.beginPath()
    ctx.moveTo(dono.x, dono.y)
    ctx.lineTo(p.x, p.y)
    if (s.anexoId === cena.anexoSelecionado) {
      for (const outroId of s.outrosIds) {
        const outro = cena.posicoes.get(outroId)
        if (!finito(outro)) continue
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(outro.x, outro.y)
      }
    }
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'

  const forma = (s: SateliteDaCena, p: Ponto): void => {
    ctx.beginPath()
    if (s.forma === 'quadrado') {
      const m = MEIO_QUADRADO_PX * px
      ctx.rect(p.x - m, p.y - m, 2 * m, 2 * m)
    } else {
      const m = MEIA_DIAGONAL_PX * px
      ctx.moveTo(p.x, p.y - m)
      ctx.lineTo(p.x + m, p.y)
      ctx.lineTo(p.x, p.y + m)
      ctx.lineTo(p.x - m, p.y)
      ctx.closePath()
    }
  }

  // O mesmo tratamento do ponto de pensamento: o claro da noite (ou a tinta do
  // dia), com o toque da cor da pasta por cima, como o pensamento tem o do livro.
  for (const { s, p, escurecer } of desenhados) {
    forma(s, p)
    ctx.fillStyle = cena.cores.no
    ctx.globalAlpha = escurecer
    ctx.fill()
    const cor = corDaPasta.get(s.pastaId)
    if (cor) {
      ctx.fillStyle = cor
      ctx.globalAlpha = 0.38 * escurecer
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1

  const tocado = desenhados.find((d) => d.s.anexoId === cena.anexoSelecionado)
  if (tocado) {
    ctx.strokeStyle = cena.cores.papel
    ctx.lineWidth = 1.5 * px
    ctx.beginPath()
    ctx.arc(tocado.p.x, tocado.p.y, (MEIA_DIAGONAL_PX + 4) * px, 0, 2 * Math.PI)
    ctx.stroke()
  }
}

/** Em unidades do mundo, não de tela: crescer com o zoom é o próprio ponto —
 *  é o que faz "aproximar" revelar um nome que não cabia antes. */
const FONTE_DO_ROTULO = 7
/**
 * Zoom mínimo para os nomes aparecerem — um limiar só, igual para todo
 * pensamento (pedido do usuário, 16/09/2026: antes um hub aparecia bem antes de
 * uma folha, porque o limiar caía com o grau; agora todos cruzam a mesma
 * linha na mesma pintura). O mesmo valor de `ESCALA_DE_FOCO` em `Tela.tsx` —
 * focar um pensamento (busca ou duplo toque) já tem que chegar aqui.
 */
const ESCALA_MINIMA_DOS_ROTULOS = ESCALA_QUE_REVELA
/** Não sobrecarrega a pintura, mesmo num aglomerado com centenas de nós à mostra. */
const MAX_ROTULOS_AMBIENTE = 40

/**
 * Zoom revela nomes, todos no mesmo instante — não é o pertencimento a um
 * hub que adianta a revelação, só o zoom. Os mais conectados só vêm primeiro
 * na fila de espaço: sem disputar posição, cada candidato (do mais conectado
 * ao menos) ganha o rótulo se a caixa dele não bater na de alguém que já
 * ganhou nesta mesma pintura — o hub orienta mais, então vence o desempate.
 */
function desenharRotulosAmbiente(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  escala: number,
  apagado: (n: NeuronioNaTela) => boolean,
): void {
  if (escala < ESCALA_MINIMA_DOS_ROTULOS) return

  const candidatos: { n: NeuronioNaTela; p: Ponto; grau: number }[] = []
  for (const n of cena.neuronios) {
    if (n.id === cena.selecionado || apagado(n)) continue
    const p = cena.posicoes.get(n.id)
    if (!finito(p)) continue
    candidatos.push({ n, p, grau: cena.graus.get(n.id) ?? 0 })
  }
  if (candidatos.length === 0) return

  candidatos.sort((a, b) => b.grau - a.grau || (a.n.id < b.n.id ? -1 : 1))

  ctx.font = `${String(FONTE_DO_ROTULO)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = cena.cores.papel
  ctx.globalAlpha = 0.85

  const folga = FONTE_DO_ROTULO * 0.45
  const ocupados: { x0: number; y0: number; x1: number; y1: number }[] = []

  for (const { n, p, grau } of candidatos) {
    if (ocupados.length >= MAX_ROTULOS_AMBIENTE) break

    const largo = ctx.measureText(n.titulo).width
    const y0 = p.y + raioNaTela(grau) / escala + 2
    const caixa = {
      x0: p.x - largo / 2 - folga,
      y0: y0 - folga,
      x1: p.x + largo / 2 + folga,
      y1: y0 + FONTE_DO_ROTULO + folga,
    }

    const bate = ocupados.some(
      (o) => caixa.x0 < o.x1 && caixa.x1 > o.x0 && caixa.y0 < o.y1 && caixa.y1 > o.y0,
    )
    if (bate) continue

    ocupados.push(caixa)
    ctx.fillText(n.titulo, p.x, y0)
  }

  ctx.globalAlpha = 1
}

/**
 * A etiqueta do selecionado é desenhada fora da câmera, em pixels de tela: nome
 * de pensamento não pode encolher junto com o zoom.
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
  ctx.font = `600 13px ${cena.cores.fonteTitulo}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const largo = ctx.measureText(n.titulo).width
  const caixaX = Math.min(Math.max(x, largo / 2 + 10), largura - largo / 2 - 10)
  // Com satélites em volta, a etiqueta sobe acima da órbita de fora: senão a
  // caixa dela cobria a metade de cima de quem orbita por cima do ponto.
  const comSatelites = !cena.soAsPontes && cena.satelites.some((s) => s.donoId === n.id)
  const caixaY = y - raio - 12 - (comSatelites ? ORBITAS_DO_SATELITE_PX[1] : 0)

  ctx.globalAlpha = 0.9
  ctx.fillStyle = cena.cores.sala
  ctx.fillRect(caixaX - largo / 2 - 7, caixaY - 18, largo + 14, 22)

  ctx.globalAlpha = 1
  ctx.fillStyle = cena.cores.papel
  ctx.fillText(n.titulo, caixaX, caixaY)
  ctx.restore()
}

/**
 * Os nomes no tema Padrão (pranchas "Rede"): o do escolhido numa etiqueta clara, à direita do
 * ponto, e os dos vizinhos — ou, sem escolhido, os dos mais conectados, a partir do zoom que revela
 * nomes — em etiquetas menores. Em pixels de tela, e uma etiqueta que bateria noutra fica de fora.
 */
function desenharRotulosDoPadrao(
  ctx: CanvasRenderingContext2D,
  cena: Cena,
  camera: Camera,
  largura: number,
  altura: number,
  apagado: (n: NeuronioNaTela) => boolean,
): void {
  const { cores } = cena
  const naTela = (p: Ponto): Ponto => ({
    x: largura / 2 + camera.x + p.x * camera.escala,
    y: altura / 2 + camera.y + p.y * camera.escala,
  })
  const ocupadas: CaixaDeTela[] = []
  const bate = (c: CaixaDeTela): boolean =>
    ocupadas.some((o) => c.x0 < o.x1 && c.x1 > o.x0 && c.y0 < o.y1 && c.y1 > o.y0)

  const escolhido = cena.neuronios.find((n) => n.id === cena.selecionado)
  const pEscolhido = cena.selecionado ? cena.posicoes.get(cena.selecionado) : undefined
  if (escolhido && finito(pEscolhido)) {
    const p = naTela(pEscolhido)
    ocupadas.push(
      etiquetaDoPadrao(ctx, escolhido.titulo, p.x + 18, p.y, {
        fonte: `600 13px ${cores.fonteTitulo}`,
        cor: cores.papel,
        fundo: cores.parede,
        sombra: cores.sombraDaEtiqueta,
        limite: largura,
      }),
    )
  }

  const vizinhanca = vizinhancaDe(cena.selecionado, cena.conexoes)
  // Sem escolhido, nome só de perto — como no Clássico.
  if (vizinhanca === null && camera.escala < ESCALA_MINIMA_DOS_ROTULOS) return

  const candidatos: { n: NeuronioNaTela; p: Ponto; grau: number }[] = []
  for (const n of cena.neuronios) {
    if (n.id === cena.selecionado) continue
    if (vizinhanca === null ? apagado(n) : !vizinhanca.has(n.id)) continue
    const p = cena.posicoes.get(n.id)
    if (!finito(p)) continue
    candidatos.push({ n, p: naTela(p), grau: cena.graus.get(n.id) ?? 0 })
  }
  candidatos.sort((a, b) => b.grau - a.grau || (a.n.id < b.n.id ? -1 : 1))

  const fonte = `500 12px ${cores.fonteTitulo}`
  let postos = 0
  for (const { n, p, grau } of candidatos) {
    if (postos >= MAX_ROTULOS_AMBIENTE) break
    if (p.x < -40 || p.x > largura + 40 || p.y < -20 || p.y > altura + 20) continue
    const r = raioNaTela(grau, true)
    ctx.save()
    ctx.font = fonte
    const meio = ctx.measureText(n.titulo).width / 2 + 10
    ctx.restore()
    // Embaixo do ponto; se bater noutro nome, em cima.
    for (const dy of [r + 14, -(r + 14)]) {
      const prova = { x0: p.x - meio, y0: p.y + dy - 10, x1: p.x + meio, y1: p.y + dy + 10 }
      if (bate(prova)) continue
      ocupadas.push(
        etiquetaDoPadrao(ctx, n.titulo, p.x, p.y + dy, {
          fonte,
          cor: cores.poeira,
          fundo: cores.parede,
          sombra: cores.sombraDaEtiqueta,
          centro: true,
        }),
      )
      postos++
      break
    }
  }
}
