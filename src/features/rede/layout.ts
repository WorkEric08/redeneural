import type { AnexoNaTela, Conexao, Id, NeuronioNaTela, Ponto, Vinculo } from '@/core'
import { semente } from '@/lib/semente'

/**
 * O que a UI da Rede ainda precisa calcular do próprio lado.
 *
 * Onde cada neurônio fica não mora mais aqui — isso é `calcularLayoutDaRede`,
 * em `@/core/motor/redeLayout`, porque agora roda dentro do Worker e o
 * resultado é gravado (posições organizadas por significado, cálculo pesado
 * fora da thread da interface). O que sobra é leve o bastante para rodar
 * direto na tela: contar grau para o tamanho do ponto, e achar quem está
 * debaixo do dedo.
 */

/** O grau de cada neurônio — é o que faz o hub ser desenhado maior. */
export function grausDoMapa(conexoes: readonly Conexao[]): Map<Id, number> {
  const grau = new Map<Id, number>()
  for (const c of conexoes) {
    grau.set(c.aId, (grau.get(c.aId) ?? 0) + 1)
    grau.set(c.bId, (grau.get(c.bId) ?? 0) + 1)
  }
  return grau
}

/**
 * O próprio selecionado e todo mundo que tem uma aresta direta com ele — é
 * quem "acende" quando você toca um ponto (ver `desenhar.ts`). `null` sem
 * seleção nenhuma, para o desenho saber que não há nada para apagar.
 */
export function vizinhancaDe(
  selecionado: Id | null,
  conexoes: readonly Conexao[],
): ReadonlySet<Id> | null {
  if (selecionado === null) return null

  const vizinhanca = new Set<Id>([selecionado])
  for (const c of conexoes) {
    if (c.aId === selecionado) vizinhanca.add(c.bId)
    else if (c.bId === selecionado) vizinhanca.add(c.aId)
  }
  return vizinhanca
}

/**
 * O neurônio sob o dedo, se houver.
 *
 * Percorre do fim para o começo para que o de cima ganhe, e usa um raio de toque
 * maior que o desenhado — 44 px de alvo continuam valendo aqui.
 */
export function neuronioEm(
  ponto: Ponto,
  posicoes: ReadonlyMap<Id, Ponto>,
  ordem: readonly NeuronioNaTela[],
  raioDeToque: number,
): Id | null {
  for (let i = ordem.length - 1; i >= 0; i--) {
    const n = ordem[i]!
    const p = posicoes.get(n.id)
    if (!p) continue

    const dx = p.x - ponto.x
    const dy = p.y - ponto.y
    if (dx * dx + dy * dy <= raioDeToque * raioDeToque) return n.id
  }
  return null
}

/**
 * O quanto um vizinho de 1 salto acompanha o arrasto **ao vivo**, por unidade
 * de score — só uma pista visual enquanto o dedo se move, não física de
 * verdade. A física de verdade (`calcularLayoutDaRede`, no núcleo) só roda ao
 * soltar, e é o que decide onde a vizinhança realmente deveria ficar.
 */
export const FATOR_DE_ACOMPANHAMENTO = 0.3

export interface NoArrastado {
  id: Id
  /** Onde o nó estava antes de o dedo tocar, para o delta ser sempre relativo a isso. */
  origem: Ponto
  vizinhos: readonly { id: Id; score: number; origem: Ponto }[]
}

/**
 * As posições enquanto o dedo arrasta: o nó segue o dedo exatamente, e cada
 * vizinho de 1 salto anda uma fração do mesmo deslocamento, proporcional a
 * quão forte é a conexão — uma conexão fraca quase não se move.
 */
export function posicoesDoArrasto(alvo: NoArrastado, delta: Ponto): Map<Id, Ponto> {
  const quadro = new Map<Id, Ponto>()
  quadro.set(alvo.id, { x: alvo.origem.x + delta.x, y: alvo.origem.y + delta.y })
  for (const v of alvo.vizinhos) {
    const f = FATOR_DE_ACOMPANHAMENTO * v.score
    quadro.set(v.id, { x: v.origem.x + delta.x * f, y: v.origem.y + delta.y * f })
  }
  return quadro
}

/**
 * Um quadro do assentamento em andamento: `k` (0..1, já passado pela curva de
 * easing) do caminho entre onde a vizinhança parou ao soltar (`inicio`) e onde
 * a física de verdade decidiu que ela deveria ficar (`alvo`). Um id que
 * `alvo` não conhece (não deveria acontecer, mas nunca quebra o desenho) fica
 * parado onde estava.
 */
export function quadroDoAssentamento(
  inicio: ReadonlyMap<Id, Ponto>,
  alvo: Readonly<Record<Id, Ponto>>,
  k: number,
): Map<Id, Ponto> {
  const quadro = new Map<Id, Ponto>()
  for (const [id, de] of inicio) {
    const para = alvo[id] ?? de
    quadro.set(id, { x: de.x + (para.x - de.x) * k, y: de.y + (para.y - de.y) * k })
  }
  return quadro
}

/** Começa rápido e desacelera — o mesmo formato de curva de qualquer coisa
 *  que "assenta" em vez de se mover a velocidade constante. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * A câmera que enquadra um conjunto de pontos — todo o grafo (`enquadrar`,
 * em Tela.tsx) ou só um neurônio e seus vizinhos (a revelação de quem acabou
 * de nascer, ver `revelar`). Pura: só matemática sobre pontos, sem canvas.
 *
 * Sem nenhum ponto válido, devolve a câmera neutra (centro do mundo, escala
 * 1) — o mesmo "vazio" que `enquadrar` já tratava antes de virar esta função.
 */
export function camaraParaEnquadrar(
  pontos: readonly Ponto[],
  larguraDaTela: number,
  alturaDaTela: number,
  folgas: { topo: number; base: number; lados: number },
  escalaMinima: number,
  escalaMaxima: number,
): { x: number; y: number; escala: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pontos) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (minX === Infinity) {
    return { x: 0, y: (folgas.topo - folgas.base) / 2, escala: 1 }
  }

  const larguraUtil = Math.max(1, larguraDaTela - 2 * folgas.lados)
  const alturaUtil = Math.max(1, alturaDaTela - folgas.topo - folgas.base)
  const cabe = Math.min(
    larguraUtil / Math.max(1, maxX - minX),
    alturaUtil / Math.max(1, maxY - minY),
  )
  const escala = Math.min(Math.max(cabe, escalaMinima), escalaMaxima)

  return {
    escala,
    x: -((minX + maxX) / 2) * escala,
    y: -((minY + maxY) / 2) * escala + (folgas.topo - folgas.base) / 2,
  }
}

/**
 * O balanço da Rede: um teste do usuário, 17/09/2026, puramente visual — a
 * posição gravada de cada neurônio **nunca** muda por causa disto (ver
 * `lib/semente.ts`: "o palácio não pode se remexer"). Quem chama soma este
 * vetor, já na amplitude de tela que quiser, em cima da posição de verdade
 * a cada quadro; fechar e abrir a Rede de novo volta exatamente ao lugar
 * gravado.
 *
 * A fase e o período saem da semente do id, não de `Math.random` nem do
 * relógio sozinho — determinístico como o resto do arquivo, só que agora
 * "determinístico" quer dizer "o mesmo balanço", não "parado". Período e
 * frequência de cada eixo variam por nó (a semente decide) para não
 * balançarem em cardume, todos preços à mesma vez.
 */
export function balanco(id: Id, tempoMs: number): Ponto {
  const [a, b] = semente(id)
  const periodoMs = 3200 + a * 2200 // 3,2-5,4s: vivo, mas devagar o bastante para ser "leve"
  const fase = b * 2 * Math.PI
  const angulo = (tempoMs / periodoMs) * 2 * Math.PI + fase
  return {
    x: Math.sin(angulo),
    // Frequência um pouco diferente da de x: uma órbita que muda de forma
    // devagar, não um círculo perfeito se repetindo.
    y: Math.cos(angulo * 0.87),
  }
}

// --- satélites: os itens das pastas de acervo -------------------------------

/**
 * O zoom que revela o que de longe seria ruído: os nomes dos neurônios e os
 * satélites dos anexos aparecem juntos, na mesma linha (decisão do usuário,
 * 24/09/2026).
 */
export const ESCALA_QUE_REVELA = 2.2

/**
 * Um item de pasta na Rede: um satélite do conceito que ele escolheu primeiro.
 * Não é neurônio — não tem posição gravada, não entra no grafo, e o fio dele
 * nunca é ponte (ver CLAUDE.md, "Pastas de acervo").
 */
export interface SateliteDaCena {
  anexoId: Id
  /** Quadrado para imagem, losango para link. */
  forma: 'quadrado' | 'losango'
  /** O conceito em volta de quem ele orbita: o vínculo de ordem 0. */
  donoId: Id
  /** Os outros conceitos que ele escolheu, na ordem — os fios só aparecem com ele tocado. */
  outrosIds: Id[]
  /** A pasta: o toque de cor do satélite é o dela. */
  pastaId: Id
}

/**
 * Os satélites a partir do que a store já tem. Anexo sem vínculo — sem
 * legenda, ou que não se parece com nada — fica só na pasta e não aparece.
 */
export function satelitesDaCena(
  anexos: readonly AnexoNaTela[],
  vinculos: readonly Vinculo[],
): SateliteDaCena[] {
  const porAnexo = new Map<Id, Vinculo[]>()
  for (const v of vinculos) {
    const lista = porAnexo.get(v.anexoId)
    if (lista) lista.push(v)
    else porAnexo.set(v.anexoId, [v])
  }

  const satelites: SateliteDaCena[] = []
  for (const a of anexos) {
    const escolhas = porAnexo.get(a.id)
    if (!escolhas || escolhas.length === 0) continue
    const [dono, ...outros] = [...escolhas].sort(
      (x, y) => x.ordem - y.ordem || (x.conceitoId < y.conceitoId ? -1 : 1),
    )
    satelites.push({
      anexoId: a.id,
      forma: a.midia.tipo === 'imagem' ? 'quadrado' : 'losango',
      donoId: dono!.conceitoId,
      outrosIds: outros.map((v) => v.conceitoId),
      pastaId: a.livroId,
    })
  }
  return satelites.sort((x, y) => (x.anexoId < y.anexoId ? -1 : 1))
}

/**
 * Os dois anéis da órbita, **em pixels de tela**: o satélite fica sempre à
 * mesma distância visível do conceito, em qualquer zoom — como o próprio ponto
 * do neurônio, que não cresce com a câmera.
 */
export const ORBITAS_DO_SATELITE_PX = [11, 16] as const

/**
 * Onde o satélite fica, a partir de onde o dono está desenhado agora. Ângulo e
 * anel saem da semente do id do **anexo**, e não da ordem entre os irmãos: um
 * item novo na mesma pasta não empurra os outros — o palácio não se remexe.
 */
export function posicaoDoSatelite(dono: Ponto, anexoId: Id, escala: number): Ponto {
  const [a, b] = semente(anexoId)
  const angulo = a * 2 * Math.PI
  const raio = (b < 0.5 ? ORBITAS_DO_SATELITE_PX[0] : ORBITAS_DO_SATELITE_PX[1]) / escala
  return { x: dono.x + Math.cos(angulo) * raio, y: dono.y + Math.sin(angulo) * raio }
}

/**
 * Quem aparece: de perto (o mesmo zoom dos nomes), o satélite do conceito
 * tocado, e o satélite tocado — mesmo depois de afastar. "Só as pontes" tira
 * todos: o fio de um anexo nunca é ponte.
 */
export function satelitesVisiveis(
  satelites: readonly SateliteDaCena[],
  estado: {
    escala: number
    soAsPontes: boolean
    selecionado: Id | null
    anexoSelecionado: Id | null
  },
): SateliteDaCena[] {
  if (estado.soAsPontes) return []
  if (estado.escala >= ESCALA_QUE_REVELA) return [...satelites]
  return satelites.filter(
    (s) => s.donoId === estado.selecionado || s.anexoId === estado.anexoSelecionado,
  )
}

/** O satélite mais perto do toque, dentro do raio — com a distância, para o
 *  toque decidir entre ele e um neurônio colado nele. */
export function sateliteEm(
  ponto: Ponto,
  visiveis: readonly SateliteDaCena[],
  posicoes: ReadonlyMap<Id, Ponto>,
  escala: number,
  raioDeToque: number,
): { anexoId: Id; distancia: number } | null {
  let melhor: { anexoId: Id; distancia: number } | null = null
  for (const s of visiveis) {
    const dono = posicoes.get(s.donoId)
    if (!dono) continue
    const p = posicaoDoSatelite(dono, s.anexoId, escala)
    const distancia = Math.hypot(p.x - ponto.x, p.y - ponto.y)
    if (distancia <= raioDeToque && (melhor === null || distancia < melhor.distancia)) {
      melhor = { anexoId: s.anexoId, distancia }
    }
  }
  return melhor
}
