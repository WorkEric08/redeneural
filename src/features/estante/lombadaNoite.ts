import type { CSSProperties } from 'react'

import { brilhoDaLuz, sombraDaLuz, type EstiloDaLombada } from '@/core'

/**
 * As contas da lombada no estilo Noite (06/10/2026): cor do texto, tamanho do
 * título e a zona onde ele mora em cada forma. Puro e fora dos componentes
 * (CLAUDE.md regra 9) — a lombada só escreve o resultado em variáveis CSS, e o
 * CSS (`.lombada` em index.css) desenha a forma a partir delas.
 *
 * Tudo é proporcional a H (a altura da lombada, em px) e W (a largura).
 */

export const TEXTO_CLARO = '#F2F2F5'
export const TEXTO_ESCURO = '#14141C'
export const CREME = '#F1EEE6'

/**
 * A luz sobre a lombada em repouso (07/10/2026). Em 50 é a cor real; abaixo, cada uma ganha uma
 * sombra por cima da cor (até `SOMBRA_MAXIMA` % de preto, no 0); acima, o livro fica mais
 * brilhante (uma luz azul-clara por cima, até `BRILHO_DO_LIVRO_MAXIMO` %) e o enfeite, um pouco
 * mais branco (até `BRILHO_DO_ENFEITE_MAXIMO` % de branco).
 */
const SOMBRA_MAXIMA = 60
const COR_DO_BRILHO_DO_LIVRO = '#8FA6FF'
const BRILHO_DO_LIVRO_MAXIMO = 32
const BRILHO_DO_ENFEITE_MAXIMO = 18
/** A sombra que o fundo da estante recebe, a mesma escala (no 0, 70% de preto). */
const SOMBRA_MAXIMA_DO_FUNDO = 70

/**
 * O ícone (a espécie do livro) tem 11 px e vai **logo abaixo das letras**, no mesmo grupo que o título,
 * com 7 px de folga do pé. O espaço dele é reservado, e o título é que cede (08/10/2026; antes o ícone
 * só aparecia se o título, já medido, deixasse lugar, e com um título de verdade quase nunca deixava).
 */
const ICONE_PX = 11
/** Numa fileira baixa o ícone encolhe até isto, e não some. */
const MINIMO_DO_ICONE_PX = 6
/** O espaço entre as letras e o ícone, e o dele numa fileira baixa. */
const INTERVALO_DO_ICONE_PX = 3
const INTERVALO_APERTADO_PX = 2
const BASE_DO_ICONE_PX = 7

/**
 * O menor corpo do título (08/10/2026; era 9 px): abaixo disso ele deixa de ser legível. A
 * lombada mais estreita (24 px) já dá 11 px (0,46 × 24), então ninguém perde por causa do piso —
 * só o título que não cabe vira reticências, em vez de encolher até sumir.
 */
const MINIMO_DO_TITULO = 11
/**
 * A fileira de referência (a mais alta, 132 px): nela o piso do título é o de 11 px. Numa fileira
 * menor o piso **encolhe junto**, em proporção — assim a mesma quantidade de letras cabe em tela
 * pequena e em tela grande (pedido do usuário, 13/10/2026) —, até `PISO_ABSOLUTO_DO_TITULO`.
 */
const FILEIRA_DE_REFERENCIA_PX = 132
const PISO_ABSOLUTO_DO_TITULO = 7
/**
 * Quanto cada caractere ocupa na vertical, em fração do corpo, na fonte do título (Source Sans 3
 * em peso 600, caixa alta, 0,06em de espaçamento). Medido com a fonte carregada, sobre títulos
 * de verdade: a média dá 0,60, as palavras de letras largas (CONTORNO, PROGRAMAÇÃO) 0,67–0,68 e o
 * pior caso inventado (WWWW MMMM) 0,77. 0,72 deixa os títulos comuns inteiros, e as reticências
 * ficam para o que não cabe de verdade. (Na Literata de antes eram 0,9; por isso o título agora
 * sai maior na mesma lombada.)
 */
const AVANCO_DO_CARACTERE = 0.72

/** Luminância de 0 a 1 (0,299 R + 0,587 G + 0,114 B), a conta do desenho. */
export function luminancia(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Cor clara: o texto vai escuro, e o degradê e o bloco invertem. */
export function ehCorClara(hex: string): boolean {
  return luminancia(hex) > 0.55
}

export function corDoTexto(hex: string): string {
  return ehCorClara(hex) ? TEXTO_ESCURO : TEXTO_CLARO
}

export type Peca = 'livro' | 'enfeite'

function percentual(fracao: number, maximo: number): number {
  return Math.round(fracao * maximo * 10) / 10
}

/**
 * A cor da lombada em repouso sob a luz de Ajustes (0-100). 50 devolve a cor real, sem mexer.
 * Abaixo, a sombra; acima, o brilho do livro ou o branco do enfeite — ver as constantes.
 */
export function corNaLuz(cor: string, intensidadeDaLuz: number, peca: Peca): string {
  const sombra = sombraDaLuz(intensidadeDaLuz)
  if (sombra > 0) {
    const preto = percentual(sombra, SOMBRA_MAXIMA)
    return `color-mix(in srgb, ${cor} ${String(100 - preto)}%, #000 ${String(preto)}%)`
  }
  const brilho = brilhoDaLuz(intensidadeDaLuz)
  if (brilho > 0) {
    const luz = percentual(
      brilho,
      peca === 'livro' ? BRILHO_DO_LIVRO_MAXIMO : BRILHO_DO_ENFEITE_MAXIMO,
    )
    const cinza = peca === 'livro' ? COR_DO_BRILHO_DO_LIVRO : '#fff'
    return `color-mix(in srgb, ${cor} ${String(100 - luz)}%, ${cinza} ${String(luz)}%)`
  }
  return cor
}

/**
 * O quanto de preto cobre o fundo da estante (`0%` a `70%`). Só a luz dos enfeites o mexe, e só
 * para baixo de 50: acima disso o fundo fica como está.
 */
export function sombraDoFundoEmPercentual(intensidadeDaLuzDoEnfeite: number): number {
  return percentual(sombraDaLuz(intensidadeDaLuzDoEnfeite), SOMBRA_MAXIMA_DO_FUNDO)
}

interface Zona {
  /** Em % de H. */
  topo: number
  fundo: number
  /** Em % de W: onde o título se centra na horizontal. */
  x: number
}

/** Onde o título mora em cada forma, em % de H. */
const ZONAS: Record<EstiloDaLombada, Zona> = {
  solido: { topo: 12.5, fundo: 87.5, x: 50 },
  faixa: { topo: 19.4, fundo: 90.6, x: 50 },
  contorno: { topo: 10.6, fundo: 90, x: 50 },
  ponto: { topo: 22.5, fundo: 92.5, x: 50 },
  fio: { topo: 13.8, fundo: 86.3, x: 50 },
  degrade: { topo: 12.5, fundo: 87.5, x: 50 },
  bloco: { topo: 15.6, fundo: 84.4, x: 50 },
}

/**
 * `min(0,46 × W, espaço ÷ (n × 0,9))`, com piso de 9 px. No sólido o espaço é
 * a zona do título (75% de H) — a conta do desenho, 0,75 × H. Nas outras
 * formas a zona é menor ou maior, e o título se mede por ela: com 0,75 × H
 * fixo, "FAIXA" não caberia na zona da faixa e viraria reticências. Abaixo do
 * piso o título fica em 9 px e o que não cabe vira reticências.
 */
export function tamanhoDoTitulo(
  largura: number,
  espaco: number,
  caracteres: number,
  piso: number = MINIMO_DO_TITULO,
): number {
  const n = Math.max(1, caracteres)
  const livre = Math.min(0.46 * largura, espaco / (n * AVANCO_DO_CARACTERE))
  return Math.round(Math.max(piso, livre) * 10) / 10
}

/** O piso do título para uma fileira: 11 px na de 132 px, proporcional abaixo, nunca menos que 7 px. */
export function pisoDoTitulo(fileira: number | undefined): number {
  if (fileira === undefined || fileira >= FILEIRA_DE_REFERENCIA_PX) return MINIMO_DO_TITULO
  return Math.max(
    PISO_ABSOLUTO_DO_TITULO,
    Math.round(MINIMO_DO_TITULO * (fileira / FILEIRA_DE_REFERENCIA_PX) * 10) / 10,
  )
}

/**
 * Até onde o grupo título + ícone pode descer, em px a partir do topo da lombada. Sem ícone é o fim da
 * zona do título de sempre. Com ícone, o limite de cada forma: o pé (7 px de folga, ou 2 numa fileira
 * baixa) na maioria; acima da linha de baixo do fio (92,5%) e da moldura do contorno (96,25%); e
 * dentro do bloco (até 84,4%), que é onde o detalhe dessa forma mora.
 */
function baixoDoGrupo(
  estilo: EstiloDaLombada,
  altura: number,
  icone: boolean,
  apertado: boolean,
): number {
  const zona = ZONAS[estilo]
  if (!icone) return (zona.fundo / 100) * altura
  const folga = apertado ? 2 : BASE_DO_ICONE_PX
  switch (estilo) {
    case 'contorno':
      return 0.9625 * altura - folga / 2 - 1
    case 'fio':
      return 0.925 * altura - folga / 2 - 1
    case 'bloco':
      return 0.844 * altura
    default:
      return altura - folga
  }
}

interface Entrada {
  estilo: EstiloDaLombada
  cor: string
  titulo: string
  /** Em px. */
  largura: number
  /** Em px. */
  altura: number
  /** 0-100 — o slider de Ajustes (o dos livros ou o dos enfeites, conforme a `peca`). */
  intensidadeDaLuz: number
  /** Livro por padrão: decide o que a luz de cima de 50 faz. */
  peca?: Peca
  /** A lombada mostra o ícone da espécie no pé: o título cede o espaço dele. */
  icone?: boolean
  /** A altura da fileira onde a lombada mora, em px: numa fileira baixa o piso do título encolhe. */
  alturaDaFileira?: number
}

export interface GeometriaDaLombada {
  estilo: EstiloDaLombada
  /** As variáveis CSS que `.lombada` lê. */
  style: CSSProperties
}

function arredondar(valor: number): number {
  return Math.round(valor * 10) / 10
}

/** Tudo o que a lombada precisa para se desenhar, num objeto de variáveis CSS. */
export function geometriaDaLombada(e: Entrada): GeometriaDaLombada {
  const cor = e.cor
  const fg = corDoTexto(cor)
  const clara = ehCorClara(cor)

  const caracteres = [...e.titulo].length
  const zona = ZONAS[e.estilo]
  const piso = pisoDoTitulo(e.alturaDaFileira)
  const topoPx = (zona.topo / 100) * e.altura

  // Título e ícone são **um grupo só**, centrado na faixa livre da forma (13/10/2026): o ícone vem logo
  // abaixo das letras, e não colado no pé. A faixa vai do começo da zona do título até o limite de
  // baixo da forma (`baixoDoGrupo`) — que respeita os detalhes dela: a linha do fio, a moldura do
  // contorno, o bloco. O título pode ocupar o que sobra depois do ícone; o que não cabe vira reticências.
  let iconePx = ICONE_PX
  let intervalo = INTERVALO_DO_ICONE_PX
  let baixoPx = baixoDoGrupo(e.estilo, e.altura, Boolean(e.icone), false)
  const espacoDoTitulo = (): number =>
    Math.max(piso, baixoPx - topoPx - (e.icone ? intervalo + iconePx : 0))
  let titulo = espacoDoTitulo()
  let fonte = tamanhoDoTitulo(e.largura, titulo, caracteres, piso)
  // Numa fileira baixa (piso menor que o de referência) o título que não cabe com o ícone inteiro
  // aperta o grupo: o ícone encolhe (de 11 até 6 px) e desce para perto do pé, e o título ganha esse
  // espaço — é o que deixa a mesma quantidade de letras da tela grande, sem o ícone sumir.
  if (
    e.icone &&
    piso < MINIMO_DO_TITULO &&
    titulo / (Math.max(1, caracteres) * AVANCO_DO_CARACTERE) < piso
  ) {
    iconePx = MINIMO_DO_ICONE_PX
    intervalo = INTERVALO_APERTADO_PX
    baixoPx = baixoDoGrupo(e.estilo, e.altura, true, true)
    titulo = espacoDoTitulo()
    fonte = tamanhoDoTitulo(e.largura, titulo, caracteres, piso)
  }
  const alturaDoGrupo = Math.max(baixoPx - topoPx, titulo + (e.icone ? intervalo + iconePx : 0))

  const style = {
    '--cor': cor,
    '--fg': fg,
    '--cor-na-luz': corNaLuz(cor, e.intensidadeDaLuz, e.peca ?? 'livro'),
    // Do lado oposto ao texto: escuro em livro escuro, claro em livro claro.
    '--oposto': clara ? '#fff' : '#000',
    '--degrade-alvo': clara ? '#fff' : '#000',
    '--fs': `${String(fonte)}px`,
    '--zt-topo': `${String(zona.topo)}%`,
    '--zt-altura': `${String(Math.round((alturaDoGrupo / e.altura) * 1000) / 10)}%`,
    '--titulo-px': `${String(Math.round(titulo * 10) / 10)}px`,
    '--zt-x': `${String(zona.x)}%`,
    '--icone-px': `${String(iconePx)}px`,
    '--icone-intervalo': `${String(intervalo)}px`,
    // Os sinais de andamento (Fazendo, Feita) são proporcionais a H, com piso em px.
    '--faixa-fazendo': `${String(arredondar(Math.max(2, 0.0125 * e.altura)))}px`,
    '--ponto-fazendo': `${String(arredondar(2 * Math.max(2.2, 0.016 * e.altura)))}px`,
    '--disco-feita': `${String(arredondar(2 * Math.max(3.4, 0.034 * e.altura)))}px`,
  } as CSSProperties

  return { estilo: e.estilo, style }
}
