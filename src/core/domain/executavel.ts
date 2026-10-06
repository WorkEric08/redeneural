import type { EstadoDaIdeia, Id, Livro } from './types'

/**
 * As regras dos livros executáveis (01/10/2026): ideias para fazer — textos,
 * estudos, vídeos —, com um andamento. Sem prazo, sem data e sem subtarefa:
 * o livro não vira gerenciador de tarefas.
 */

/** Um mês parada, e a ideia adormece (Atualização 6). */
export const DIAS_PARA_ADORMECER_PADRAO = 30
/** Até um ano. Zero existe de propósito: adormece na hora, para testar. */
export const DIAS_PARA_ADORMECER_MAXIMO = 365

/** Na ordem da tela do livro: o que está andando vem primeiro. */
export const ESTADOS_DA_IDEIA: readonly EstadoDaIdeia[] = ['fazendo', 'para_fazer', 'feita']

/** Dias inteiros, entre 0 e o máximo. O que não é número vira o padrão. */
export function clampDiasParaAdormecer(valor: number): number {
  if (!Number.isFinite(valor)) return DIAS_PARA_ADORMECER_PADRAO
  return Math.min(DIAS_PARA_ADORMECER_MAXIMO, Math.max(0, Math.round(valor)))
}

/**
 * A ideia acabou de entrar num livro executável — vinda de outro livro, do
 * porto, ou recém-criada (`livroAnterior` ausente). É um toque.
 */
export function entraEmExecutavel(
  livroAnterior: Id | null | undefined,
  destino: Pick<Livro, 'id' | 'executavel'> | undefined,
): boolean {
  return destino?.executavel === true && livroAnterior !== destino.id
}

/**
 * O estado de uma ideia depois de guardada em `destino`:
 *
 * - entrar num livro executável começa em "para fazer" — é o "Tornar
 *   executável" e o "Quero executar isso";
 * - continuar no mesmo livro executável mantém o que tinha;
 * - ir para um livro que não é executável guarda o que tinha, sem mostrar —
 *   nada se perde se o livro voltar a ser executável.
 */
export function estadoAoGuardar(
  anterior: { livroId: Id | null; estado: EstadoDaIdeia | null } | undefined,
  destino: Pick<Livro, 'id' | 'executavel'> | undefined,
): EstadoDaIdeia | null {
  if (entraEmExecutavel(anterior?.livroId, destino)) return 'para_fazer'
  if (destino?.executavel) return anterior?.estado ?? 'para_fazer'
  return anterior?.estado ?? null
}

export const MS_POR_DIA = 86_400_000

/**
 * A ideia está adormecida: mora num livro executável, não está feita, e ficou
 * parada mais que os dias do livro desde o último toque. Calculado na hora de
 * mostrar, com o relógio de quem mostra — sem tarefa em segundo plano, e
 * igual sem rede. Com 0 dias, adormece logo depois de qualquer toque: é para
 * testar.
 */
export function estaAdormecida(
  ideia: { estado: EstadoDaIdeia | null; ultimoToque: Date },
  livro: Pick<Livro, 'executavel' | 'diasParaAdormecer'> | undefined,
  agora: Date,
): boolean {
  if (!livro?.executavel || ideia.estado === 'feita') return false
  return agora.getTime() - ideia.ultimoToque.getTime() > livro.diasParaAdormecer * MS_POR_DIA
}

/**
 * O estado que a tela mostra: só num livro executável. Uma ideia que estava
 * num livro antes de ele virar executável ainda não tem estado — está "para
 * fazer".
 */
export function estadoVisivel(
  ideia: { estado: EstadoDaIdeia | null },
  livro: Pick<Livro, 'executavel'> | undefined,
): EstadoDaIdeia | null {
  return livro?.executavel ? (ideia.estado ?? 'para_fazer') : null
}

/**
 * O andamento de um livro inteiro, para a lombada na estante (06/10/2026). O
 * livro não tem estado próprio: sai das ideias dele, e só num livro
 * executável.
 *
 * - `feita`: tem ideias e todas estão feitas;
 * - `adormecido`: sobrou ideia por fazer e todas elas estão adormecidas;
 * - `fazendo`: alguma ideia acordada está em andamento;
 * - `null`: o resto — só "para fazer", ou sem ideia nenhuma. Sem marca.
 *
 * As três são exclusivas entre si.
 */
export type AndamentoDoLivro = 'fazendo' | 'feita' | 'adormecido'

export function andamentoDoLivro(
  livro: Pick<Livro, 'executavel' | 'diasParaAdormecer'>,
  ideias: readonly { estado: EstadoDaIdeia | null; ultimoToque: Date }[],
  agora: Date,
): AndamentoDoLivro | null {
  if (!livro.executavel || ideias.length === 0) return null

  const porFazer = ideias.filter((i) => estadoVisivel(i, livro) !== 'feita')
  if (porFazer.length === 0) return 'feita'

  const acordadas = porFazer.filter((i) => !estaAdormecida(i, livro, agora))
  if (acordadas.length === 0) return 'adormecido'
  return acordadas.some((i) => estadoVisivel(i, livro) === 'fazendo') ? 'fazendo' : null
}
