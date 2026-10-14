import {
  cabeNaPilhaDepoisDeMudar,
  mudarOrientacaoNaEstante,
  type Id,
  type Livro,
  type OrientacaoDoLivro,
} from '@/core'

import {
  alturaDaLombadaEmPercentual,
  cabeNaPrateleira,
  larguraDoLivroGravado,
  larguraDosLivrosDaPrateleira,
} from './prateleiras'

/**
 * Se um livro cabe na estante — a conta que as telas fora dela (criar e editar um livro) fazem
 * antes de gravar, porque só a estante mede a fileira.
 *
 * Puro e fora dos componentes (CLAUDE.md regra 9). A regra é a de sempre das laterais sólidas:
 * os livros de uma prateleira têm que caber inteiros entre elas (os enfeites cedem). O livro
 * deitado a torna mais exigente — ele é largo, 90 a 130 px — e é por isso que ela passou a valer
 * também ao criar e ao editar, não só ao arrastar.
 */

/** Como a estante mediu a fileira da última vez que foi aberta. */
export interface MedidasDaEstante {
  /** O que a fileira tem entre as laterais, em px. */
  larguraUtil: number
  /** A altura da fileira, em px: o livro deitado se estende por uma % dela. */
  alturaDaFileira: number
}

/** O quanto um livro deitado se estende, em px, dada a altura automática (0..1) e a da fileira. */
export function extensaoDoLivroGravado(
  livro: Pick<Livro, 'comprimentoLombada'>,
  alturaAutomatica: number,
  alturaDaFileira: number,
): number {
  return Math.round(
    (alturaDaLombadaEmPercentual(livro.comprimentoLombada, alturaAutomatica) * alturaDaFileira) /
      100,
  )
}

/** O que os livros de uma prateleira ocupam, com a extensão dos deitados medida na fileira. */
export function larguraDaPrateleira(
  livros: readonly Livro[],
  prateleira: number,
  alturasAutomaticas: ReadonlyMap<Id, number>,
  alturaDaFileira: number,
): number {
  return larguraDosLivrosDaPrateleira(livros, prateleira, (l) =>
    l.orientacao === 'deitado'
      ? extensaoDoLivroGravado(l, alturasAutomaticas.get(l.id) ?? 0, alturaDaFileira)
      : larguraDoLivroGravado(l),
  )
}

/**
 * Os livros de `prateleira` continuam cabendo entre as laterais depois da mudança? Quem já estava
 * além do limite (uma tela mais estreita que a de quando o livro foi guardado) pode ser mexido,
 * desde que não piore — a mesma regra de `cabeNaPrateleira`.
 */
export function cabeDepoisDeMudar(
  antes: readonly Livro[],
  depois: readonly Livro[],
  prateleira: number,
  alturasAutomaticas: ReadonlyMap<Id, number>,
  medidas: MedidasDaEstante,
): boolean {
  return cabeNaPrateleira(
    larguraDaPrateleira(antes, prateleira, alturasAutomaticas, medidas.alturaDaFileira),
    larguraDaPrateleira(depois, prateleira, alturasAutomaticas, medidas.alturaDaFileira),
    medidas.larguraUtil,
  )
}

/**
 * O que impede uma edição de forma ou de tamanho de um livro, em frase para o aviso — ou `null`
 * quando pode. Vale para a tela de editar e para o "Deitar/Levantar" do menu do livro: virar o
 * livro ou mudar a largura dele pode estourar a altura da pilha ou as laterais da prateleira.
 * `medidas` nulas (a estante nunca foi medida) é "não sei": só a pilha, cujo teto é fixo, vale.
 */
export function recusaDaEdicao(args: {
  livros: readonly Livro[]
  livroId: Id
  orientacao: OrientacaoDoLivro
  larguraLombada: number | null
  comprimentoLombada: number | null
  alturasAutomaticas: ReadonlyMap<Id, number>
  medidas: MedidasDaEstante | null
}): string | null {
  const { livros, livroId, orientacao, larguraLombada, comprimentoLombada } = args
  const livro = livros.find((l) => l.id === livroId)
  if (!livro) return null
  const virado = mudarOrientacaoNaEstante(livros, livroId, orientacao) ?? livros
  const depois = virado.map((l) =>
    l.id === livroId ? { ...l, larguraLombada, comprimentoLombada } : l,
  )
  // Num livro deitado a largura é a espessura que ele pesa na pilha: uma maior pode passar do teto
  // de altura, e a pilha seria cortada pela prateleira de cima.
  const lugar = depois.find((l) => l.id === livroId)
  if (lugar && !cabeNaPilhaDepoisDeMudar(livros, depois, lugar.prateleira, lugar.ordem)) {
    return 'A pilha não tem altura para essa mudança.'
  }
  if (args.medidas !== null) {
    const prateleira = lugar?.prateleira ?? livro.prateleira
    if (!cabeDepoisDeMudar(livros, depois, prateleira, args.alturasAutomaticas, args.medidas)) {
      return `A prateleira ${String(prateleira + 1)} não tem espaço para essa mudança.`
    }
  }
  return null
}
