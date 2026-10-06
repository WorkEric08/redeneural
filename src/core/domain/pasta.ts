import type { Anexo, Id } from './types'

/**
 * Quanto cabe numa pasta de acervo (07/10/2026): 8 imagens e 8 links. A tela não
 * mostra os oito lugares — só um "+" com quantos ainda cabem, que desce a cada item
 * guardado.
 */
export const MAXIMO_DE_IMAGENS_NA_PASTA = 8
export const MAXIMO_DE_LINKS_NA_PASTA = 8

export type TipoDeItem = Anexo['midia']['tipo']

const MAXIMO: Record<TipoDeItem, number> = {
  imagem: MAXIMO_DE_IMAGENS_NA_PASTA,
  link: MAXIMO_DE_LINKS_NA_PASTA,
}

/**
 * Quantos itens de cada tipo ainda cabem na pasta. Uma pasta que já passa do limite
 * (de antes dele) não perde nada: só deixa de aceitar mais daquele tipo, e conta 0.
 */
export function restantesNaPasta(
  anexos: readonly { livroId: Id; midia: { tipo: TipoDeItem } }[],
  livroId: Id,
): Record<TipoDeItem, number> {
  const usados: Record<TipoDeItem, number> = { imagem: 0, link: 0 }
  for (const a of anexos) {
    if (a.livroId === livroId) usados[a.midia.tipo] += 1
  }
  return {
    imagem: Math.max(0, MAXIMO.imagem - usados.imagem),
    link: Math.max(0, MAXIMO.link - usados.link),
  }
}

/** A frase de quando a pasta já está cheia daquele tipo — a do erro que o motor devolve. */
export function pastaCheia(tipo: TipoDeItem): string {
  return tipo === 'imagem'
    ? `A pasta já tem ${String(MAXIMO_DE_IMAGENS_NA_PASTA)} imagens.`
    : `A pasta já tem ${String(MAXIMO_DE_LINKS_NA_PASTA)} links.`
}
