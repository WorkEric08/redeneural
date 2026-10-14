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
 * O ícone do pé (a espécie do livro) ocupa 11 px, a 7 px da base — ou a 13 px no papel, que
 * sobe para ficar acima da contagem. O título termina 2 px acima dele: o espaço é **reservado**,
 * e o título é que cede (08/10/2026; antes o ícone só aparecia se o título, já medido, deixasse
 * lugar, e com um título de verdade quase nunca deixava).
 */
const ICONE_PX = 11
const BASE_DO_ICONE_PX = 7
const BASE_DO_ICONE_NO_PAPEL_PX = 13
const FOLGA_DO_ICONE_PX = 2

/**
 * O menor corpo do título (08/10/2026; era 9 px): abaixo disso ele deixa de ser legível. A
 * lombada mais estreita (24 px) já dá 11 px (0,46 × 24), então ninguém perde por causa do piso —
 * só o título que não cabe vira reticências, em vez de encolher até sumir.
 */
const MINIMO_DO_TITULO = 11
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
  papel: { topo: 12.5, fundo: 84.4, x: 50 },
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

/** Quantos px do pé a lombada reserva para o ícone, de baixo para cima. */
export function reservaDoIcone(estilo: EstiloDaLombada): number {
  const base = estilo === 'papel' ? BASE_DO_ICONE_NO_PAPEL_PX : BASE_DO_ICONE_PX
  return base + ICONE_PX + FOLGA_DO_ICONE_PX
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
  const papel = e.estilo === 'papel'
  // O papel é sempre creme, qualquer que seja a cor guardada: ela continua
  // valendo na Rede e no Mapa.
  const cor = papel ? CREME : e.cor
  const fg = papel ? TEXTO_ESCURO : corDoTexto(cor)
  const clara = ehCorClara(cor)

  const caracteres = [...e.titulo].length
  const zona = ZONAS[e.estilo]
  // Com ícone, o fim da zona do título sobe para ficar acima dele — sem passar do começo dela:
  // abaixo do piso de 9 px o título fica minúsculo e o que não cabe vira reticências.
  const fundoLivre = e.icone
    ? Math.min(zona.fundo, ((e.altura - reservaDoIcone(e.estilo)) / e.altura) * 100)
    : zona.fundo
  const alturaDaZona = Math.max(fundoLivre - zona.topo, (MINIMO_DO_TITULO / e.altura) * 100)
  const fonte = tamanhoDoTitulo(e.largura, (alturaDaZona / 100) * e.altura, caracteres)

  const style = {
    '--cor': cor,
    '--fg': fg,
    '--cor-na-luz': corNaLuz(cor, e.intensidadeDaLuz, e.peca ?? 'livro'),
    // Do lado oposto ao texto: escuro em livro escuro, claro em livro claro.
    '--oposto': clara ? '#fff' : '#000',
    '--degrade-alvo': clara ? '#fff' : '#000',
    '--fs': `${String(fonte)}px`,
    '--fs-contagem': `${String(Math.round(0.22 * e.largura * 10) / 10)}px`,
    '--zt-topo': `${String(zona.topo)}%`,
    '--zt-altura': `${String(Math.round(alturaDaZona * 10) / 10)}%`,
    '--zt-x': `${String(zona.x)}%`,
    // Os sinais de andamento (Fazendo, Feita) são proporcionais a H, com piso em px.
    '--faixa-fazendo': `${String(arredondar(Math.max(2, 0.0125 * e.altura)))}px`,
    '--ponto-fazendo': `${String(arredondar(2 * Math.max(2.2, 0.016 * e.altura)))}px`,
    '--disco-feita': `${String(arredondar(2 * Math.max(3.4, 0.034 * e.altura)))}px`,
  } as CSSProperties

  return { estilo: e.estilo, style }
}
