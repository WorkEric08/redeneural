import { textoDoAnexo, type AnexoNaTela, type Id, type Livro, type NeuronioNaTela } from '@/core'

/**
 * Busca no palácio inteiro — em memória, sobre o que a store já tem.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). Sem índice nem lib de
 * busca: um palácio pessoal tem no máximo algumas centenas de pensamentos, e
 * `includes` sobre isso é instantâneo — qualquer coisa mais esperta seria
 * abstração sem caso de uso.
 */

export interface ResultadoDeLivro {
  tipo: 'livro'
  livro: Livro
}

export interface ResultadoDeNeuronio {
  tipo: 'neuronio'
  neuronio: NeuronioNaTela
  /** `undefined` para um pensamento no porto, ainda sem livro. */
  livro: Livro | undefined
  /** Pedaço do conteúdo em volta do termo, só quando foi ele que bateu. */
  trecho: string | undefined
}

export type ResultadoDeBusca = ResultadoDeLivro | ResultadoDeNeuronio

/** Sem acento e sem caixa: "pratica" tem que achar "prática". */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const RAIO_DO_TRECHO = 46

/** O pedaço do texto em volta da primeira ocorrência do termo. */
function trechoEmVolta(texto: string, termo: string): string {
  const indice = normalizar(texto).indexOf(termo)
  if (indice === -1) return texto.slice(0, RAIO_DO_TRECHO * 2).trim()

  const inicio = Math.max(0, indice - RAIO_DO_TRECHO)
  const fim = Math.min(texto.length, indice + termo.length + RAIO_DO_TRECHO)
  const prefixo = inicio > 0 ? '…' : ''
  const sufixo = fim < texto.length ? '…' : ''
  return `${prefixo}${texto.slice(inicio, fim).trim()}${sufixo}`
}

export function buscar(
  consulta: string,
  livros: readonly Livro[],
  neuronios: readonly NeuronioNaTela[],
): ResultadoDeBusca[] {
  const termo = normalizar(consulta.trim())
  if (!termo) return []

  const livroPorId = new Map<Id, Livro>(livros.map((l) => [l.id, l]))

  const doLivro: ResultadoDeBusca[] = livros
    .filter((l) => normalizar(l.titulo).includes(termo))
    .map((livro) => ({ tipo: 'livro', livro }))

  // Título bate antes de conteúdo: achar pelo nome é mais provável de ser o
  // que a pessoa quer do que achar pelo meio de um texto comprido.
  const doNeuronio: ResultadoDeBusca[] = neuronios
    .map((neuronio) => ({
      neuronio,
      noTitulo: normalizar(neuronio.titulo).includes(termo),
      noConteudo: normalizar(neuronio.conteudo).includes(termo),
    }))
    .filter((r) => r.noTitulo || r.noConteudo)
    .sort((a, b) => Number(b.noTitulo) - Number(a.noTitulo))
    .map(({ neuronio, noTitulo }) => ({
      tipo: 'neuronio',
      neuronio,
      livro: neuronio.livroId === null ? undefined : livroPorId.get(neuronio.livroId),
      trecho: noTitulo ? undefined : trechoEmVolta(neuronio.conteudo, termo),
    }))

  return [...doLivro, ...doNeuronio]
}

/**
 * A busca **local de uma pasta de acervo**: os itens dela pelo título, pela legenda ou, nos links, pelo endereço.
 * Uma pasta não tem pensamentos — o que se guarda ali é imagem e link, e a legenda é o único texto
 * que a pessoa escreveu. Legenda bate antes de endereço, como o título bate antes do conteúdo.
 */
export function buscarAnexos(consulta: string, anexos: readonly AnexoNaTela[]): AnexoNaTela[] {
  const termo = normalizar(consulta.trim())
  if (!termo) return []

  return anexos
    .map((anexo) => ({
      anexo,
      naLegenda: normalizar(textoDoAnexo(anexo)).includes(termo),
      noEndereco: anexo.midia.tipo === 'link' && normalizar(anexo.midia.url).includes(termo),
    }))
    .filter((r) => r.naLegenda || r.noEndereco)
    .sort((a, b) => Number(b.naLegenda) - Number(a.naLegenda))
    .map((r) => r.anexo)
}
