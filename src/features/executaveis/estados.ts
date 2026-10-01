import type { EstadoDaIdeia } from '@/core'

/** Como cada estado se chama na tela — uma ideia, e não uma tarefa. */
export const ROTULO_DO_ESTADO: Readonly<Record<EstadoDaIdeia, string>> = {
  para_fazer: 'Para fazer',
  fazendo: 'Fazendo',
  feita: 'Feita',
}

/** O nome de cada seção da tela do livro executável. */
export const TITULO_DA_SECAO: Readonly<Record<EstadoDaIdeia, string>> = {
  fazendo: 'Fazendo',
  para_fazer: 'Para fazer',
  feita: 'Feitas',
}

/** O nome que o app sugere para o primeiro livro executável. */
export const NOME_SUGERIDO_DO_EXECUTAVEL = 'Ideias executáveis'
