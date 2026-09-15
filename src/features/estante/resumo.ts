import type { Conexao, Id, Livro, NeuronioNaTela } from '@/core'

/**
 * As contas que a estante mostra.
 *
 * Puras e fora dos componentes (CLAUDE.md regra 9): a tela só compõe. Nada aqui
 * consulta o banco — tudo sai do que a store já tem em memória.
 */

/**
 * Quantos fios de ponte ligam cada par de livros: `mapa.get(a).get(b)`.
 *
 * É o que a estante acende quando se segura um livro, e o que o "espiar" lista.
 * Sai inteiro de uma vez para os dois lerem dele sem recontar a cada toque.
 *
 * A ponte é decidida pelo livro de cada neurônio agora, e não pelo `cross`
 * gravado na aresta: é a mesma regra de `montarEstante`, e as duas contas não
 * podem discordar na mesma tela.
 */
export function pontesEntreLivros(
  neuronios: readonly NeuronioNaTela[],
  conexoes: readonly Conexao[],
): Map<Id, Map<Id, number>> {
  const livroDoNeuronio = new Map(neuronios.map((n) => [n.id, n.livroId]))
  const mapa = new Map<Id, Map<Id, number>>()

  const somar = (de: Id, para: Id): void => {
    const linha = mapa.get(de) ?? new Map<Id, number>()
    linha.set(para, (linha.get(para) ?? 0) + 1)
    mapa.set(de, linha)
  }

  for (const c of conexoes) {
    const a = livroDoNeuronio.get(c.aId)
    const b = livroDoNeuronio.get(c.bId)
    if (a === undefined || b === undefined || a === b) continue

    somar(a, b)
    somar(b, a)
  }

  return mapa
}

export interface LivroNaEstante {
  livro: Livro
  neuronios: number
  /** Conexões que ficam dentro deste livro. */
  internas: number
  /** Fios de ponte que saem daqui para outro livro. */
  saindo: number
  /** Altura da lombada, 0..1 — a única métrica que a estante mostra sem abrir nada. */
  altura: number
}

export function montarEstante(
  livros: readonly Livro[],
  neuronios: readonly NeuronioNaTela[],
  conexoes: readonly Conexao[],
): LivroNaEstante[] {
  const livroDoNeuronio = new Map(neuronios.map((n) => [n.id, n.livroId]))

  const contagem = new Map<string, number>()
  for (const n of neuronios) contagem.set(n.livroId, (contagem.get(n.livroId) ?? 0) + 1)

  const internas = new Map<string, number>()
  const saindo = new Map<string, number>()

  for (const c of conexoes) {
    const a = livroDoNeuronio.get(c.aId)
    const b = livroDoNeuronio.get(c.bId)
    if (a === undefined || b === undefined) continue

    if (a === b) {
      internas.set(a, (internas.get(a) ?? 0) + 1)
    } else {
      // Uma conexão de ponte sai dos dois livros: cada lado a enxerga saindo dele.
      saindo.set(a, (saindo.get(a) ?? 0) + 1)
      saindo.set(b, (saindo.get(b) ?? 0) + 1)
    }
  }

  const maior = Math.max(1, ...livros.map((l) => contagem.get(l.id) ?? 0))

  return livros.map((livro) => ({
    livro,
    neuronios: contagem.get(livro.id) ?? 0,
    internas: internas.get(livro.id) ?? 0,
    saindo: saindo.get(livro.id) ?? 0,
    altura: (contagem.get(livro.id) ?? 0) / maior,
  }))
}

export interface VizinhoDoNeuronio {
  conexao: Conexao
  outroId: string
  outroTitulo: string
  /** Nome do livro do outro lado — só interessa quando o fio é de ponte. */
  outroLivro: string
}

/** Os vizinhos de cada neurônio, do mais forte para o mais fraco. */
export function vizinhosPorNeuronio(
  neuronios: readonly NeuronioNaTela[],
  livros: readonly Livro[],
  conexoes: readonly Conexao[],
): Map<string, VizinhoDoNeuronio[]> {
  const porId = new Map(neuronios.map((n) => [n.id, n]))
  const nomeDoLivro = new Map(livros.map((l) => [l.id, l.titulo]))
  const mapa = new Map<string, VizinhoDoNeuronio[]>()

  const anotar = (deId: string, paraId: string, conexao: Conexao): void => {
    const outro = porId.get(paraId)
    if (!outro) return

    const item: VizinhoDoNeuronio = {
      conexao,
      outroId: outro.id,
      outroTitulo: outro.titulo,
      outroLivro: nomeDoLivro.get(outro.livroId) ?? '',
    }

    const lista = mapa.get(deId)
    if (lista) lista.push(item)
    else mapa.set(deId, [item])
  }

  for (const c of conexoes) {
    anotar(c.aId, c.bId, c)
    anotar(c.bId, c.aId, c)
  }

  for (const lista of mapa.values()) lista.sort((x, y) => y.conexao.score - x.conexao.score)
  return mapa
}
