/**
 * As alturas em que uma folha (bottom sheet) para no celular. Puro e fora do
 * componente (CLAUDE.md regra 9): é a regra de "mostrar tudo sem deslize" e merece
 * teste, que o `<dialog>` não deixa fazer.
 */

/** Altura em que a folha abre quando o conteúdo **não cabe** na tela: metade dela. */
const FRACAO_DO_MEIO = 0.5
/** ...com um piso para tela baixa e teclado aberto. */
const PISO_DO_MEIO_PX = 300
/** Altura máxima, depois de esticada: perto do topo, sem encostar nele. */
export const FRACAO_DA_CHEIA = 0.92
/** Entre as duas paradas só há o que esticar se a diferença for visível. */
const DIFERENCA_MINIMA_PX = 8

export interface Paradas {
  meio: number
  cheio: number
  /** Há duas alturas de verdade: a folha abre pela metade e se estica. */
  expansivel: boolean
}

/**
 * `natural` é a altura do conteúdo inteiro (alça, respiro e conteúdo); `tela` é a
 * altura útil da janela — que encolhe com o teclado aberto.
 *
 * **O que cabe na tela abre inteiro**, sem esticar e sem rolar (06/10/2026, pedido do
 * usuário: sempre preferir mostrar tudo sem deslize vertical). Só o que passa dela
 * abre pela metade, para esticar até o teto (92% da tela) e rolar dali em diante.
 */
export function paradasDaFolha(natural: number, tela: number): Paradas {
  const teto = tela * FRACAO_DA_CHEIA
  const cheio = Math.min(natural, teto)
  const meio =
    natural <= teto ? natural : Math.min(Math.max(tela * FRACAO_DO_MEIO, PISO_DO_MEIO_PX), teto)
  const expansivel = cheio - meio > DIFERENCA_MINIMA_PX
  return { meio, cheio: expansivel ? cheio : meio, expansivel }
}
