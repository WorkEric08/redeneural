/**
 * Dicas que se mostram uma vez só — o adaptador do navegador para "esta pessoa já viu".
 *
 * Fica fora do banco do palácio de propósito: não é dado dele, não vai no backup, e perder o
 * registro só faz a dica aparecer de novo (CLAUDE.md, "Nunca usar localStorage para dados de
 * domínio" — isto não é domínio). Se o armazenamento estiver bloqueado, a dica vale na sessão.
 */
const CHAVE_DA_DICA_DE_MOVER = 'locus-dica-mover'

/** A pessoa já viu (ou já fez) o gesto de segurar e arrastar um livro? */
export function dicaDeMoverJaVista(): boolean {
  try {
    return localStorage.getItem(CHAVE_DA_DICA_DE_MOVER) === '1'
  } catch {
    return false
  }
}

export function marcarDicaDeMoverVista(): void {
  try {
    localStorage.setItem(CHAVE_DA_DICA_DE_MOVER, '1')
  } catch {
    // Armazenamento bloqueado: a dica some desta sessão e volta na próxima.
  }
}
