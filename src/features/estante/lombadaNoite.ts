import type { CSSProperties } from 'react'

import { INTENSIDADE_DA_LUZ_PADRAO, type EstiloDaLombada } from '@/core'

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

/** A luz da sala que lava o pano em repouso (azul-claro frio). */
const COR_DA_LAVAGEM = '#5565B5'
/** Com o slider no padrão (42), a lavagem é de 16% — o valor do desenho Noite. */
const LAVAGEM_NO_PADRAO = 16
const LAVAGEM_MAXIMA = 38

/** O emblema ocupa 11 px a 7 px da base; o título precisa terminar acima disso. */
const TOPO_DO_EMBLEMA = 18
const FOLGA_DO_EMBLEMA = 2

const MINIMO_DO_TITULO = 9
/**
 * Quanto cada caractere ocupa na vertical, em fração do corpo. O desenho Noite
 * estimava 0,78; medida na Literata em negrito, maiúscula e com 0,1em de
 * espaçamento, a média dá 0,81 e as letras largas (O, D, M) passam de 0,9 —
 * com 0,78, "CONTORNO" virava "CONTOR…" mesmo cabendo na conta. 0,9 deixa o
 * título inteiro caber, e as reticências ficam para o que não cabe de verdade.
 */
const AVANCO_DO_CARACTERE = 0.9

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

/**
 * O slider de luz (0-100) escala a lavagem: 42, o padrão, dá os 16% do desenho
 * Noite; 0 mostra a cor real mesmo em repouso, e 100 chega a 38%.
 */
export function lavagemEmPercentual(intensidadeDaLuz: number): number {
  const bruto = (intensidadeDaLuz * LAVAGEM_NO_PADRAO) / INTENSIDADE_DA_LUZ_PADRAO
  return Math.round(Math.min(LAVAGEM_MAXIMA, Math.max(0, bruto)) * 10) / 10
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
  'duas-cores': { topo: 36.3, fundo: 93.8, x: 50 },
  contorno: { topo: 10.6, fundo: 90, x: 50 },
  ponto: { topo: 22.5, fundo: 92.5, x: 50 },
  fio: { topo: 13.8, fundo: 86.3, x: 50 },
  degrade: { topo: 12.5, fundo: 87.5, x: 50 },
  papel: { topo: 12.5, fundo: 84.4, x: 50 },
  // A coluna da direita tem 38% de W: o título se centra nos 62% da esquerda.
  metade: { topo: 12.5, fundo: 87.5, x: 31 },
  bloco: { topo: 15.6, fundo: 84.4, x: 50 },
}

/**
 * `min(0,46 × W, espaço ÷ (n × 0,9))`, com piso de 9 px. No sólido o espaço é
 * a zona do título (75% de H) — a conta do desenho, 0,75 × H. Nas outras
 * formas a zona é menor ou maior, e o título se mede por ela: com 0,75 × H
 * fixo, "FAIXA" não caberia na zona da faixa e viraria reticências. Abaixo do
 * piso o título fica em 9 px e o que não cabe vira reticências.
 */
export function tamanhoDoTitulo(largura: number, espaco: number, caracteres: number): number {
  const n = Math.max(1, caracteres)
  const livre = Math.min(0.46 * largura, espaco / (n * AVANCO_DO_CARACTERE))
  return Math.round(Math.max(MINIMO_DO_TITULO, livre) * 10) / 10
}

/**
 * O emblema só aparece se o título terminar acima dele. O título se centra na
 * zona e ocupa o que o texto pede, até a zona inteira. O pé do papel (a
 * contagem) ocupa o mesmo lugar do emblema, então ali ele nunca cabe.
 */
export function emblemaCabe(
  estilo: EstiloDaLombada,
  altura: number,
  fonte: number,
  caracteres: number,
): boolean {
  if (estilo === 'papel') return false
  const zona = ZONAS[estilo]
  const alturaDaZona = ((zona.fundo - zona.topo) / 100) * altura
  const tamanhoDoTexto = Math.min(
    Math.max(1, caracteres) * fonte * AVANCO_DO_CARACTERE,
    alturaDaZona,
  )
  const centro = ((zona.topo + zona.fundo) / 200) * altura
  return centro + tamanhoDoTexto / 2 <= altura - TOPO_DO_EMBLEMA - FOLGA_DO_EMBLEMA
}

interface Entrada {
  estilo: EstiloDaLombada
  cor: string
  titulo: string
  /** Em px. */
  largura: number
  /** Em px. */
  altura: number
  /** 0-100 — o slider de Ajustes. */
  intensidadeDaLuz: number
}

export interface GeometriaDaLombada {
  estilo: EstiloDaLombada
  /** As variáveis CSS que `.lombada` lê. */
  style: CSSProperties
  /** O emblema, se houver, cabe abaixo do título. */
  emblemaCabe: boolean
}

function arredondar(valor: number): number {
  return Math.round(valor * 10) / 10
}

/** Tudo o que a lombada precisa para se desenhar, num objeto de variáveis CSS. */
export function geometriaDaLombada(e: Entrada): GeometriaDaLombada {
  const papel = e.estilo === 'papel'
  // O papel é sempre creme, qualquer que seja a cor guardada: ela continua
  // valendo na Rede e no Mapa.
  const cor = papel ? CREME : e.cor
  const fg = papel ? TEXTO_ESCURO : corDoTexto(cor)
  const clara = ehCorClara(cor)
  const lavagem = papel ? 0 : lavagemEmPercentual(e.intensidadeDaLuz)

  const caracteres = [...e.titulo].length
  const zona = ZONAS[e.estilo]
  const fonte = tamanhoDoTitulo(e.largura, ((zona.fundo - zona.topo) / 100) * e.altura, caracteres)

  const style = {
    '--cor': cor,
    '--fg': fg,
    '--cor-lavada': `color-mix(in srgb, ${cor} ${String(100 - lavagem)}%, ${COR_DA_LAVAGEM} ${String(lavagem)}%)`,
    // Do lado oposto ao texto: escuro em livro escuro, claro em livro claro.
    '--oposto': clara ? '#fff' : '#000',
    '--degrade-alvo': clara ? '#fff' : '#000',
    '--fs': `${String(fonte)}px`,
    '--fs-contagem': `${String(Math.round(0.22 * e.largura * 10) / 10)}px`,
    '--zt-topo': `${String(zona.topo)}%`,
    '--zt-altura': `${String(Math.round((zona.fundo - zona.topo) * 10) / 10)}%`,
    '--zt-x': `${String(zona.x)}%`,
    // Os sinais de andamento (Fazendo, Feita) são proporcionais a H, com piso em px.
    '--faixa-fazendo': `${String(arredondar(Math.max(2, 0.0125 * e.altura)))}px`,
    '--ponto-fazendo': `${String(arredondar(2 * Math.max(2.2, 0.016 * e.altura)))}px`,
    '--disco-feita': `${String(arredondar(2 * Math.max(3.4, 0.034 * e.altura)))}px`,
  } as CSSProperties

  return {
    estilo: e.estilo,
    style,
    emblemaCabe: emblemaCabe(e.estilo, e.altura, fonte, caracteres),
  }
}
