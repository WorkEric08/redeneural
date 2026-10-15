/**
 * Quando a pessoa salvou uma cópia pela última vez — só para lembrá-la, em Ajustes.
 *
 * Fica fora do banco da rede de propósito, como as dicas (`dicas.ts`): não é dado dela, não vai no
 * backup, e perder o registro só faz a linha voltar a dizer que ainda não há cópia (CLAUDE.md,
 * "Nunca usar localStorage para dados de domínio" — isto não é domínio).
 */
const CHAVE_DA_ULTIMA_COPIA = 'locus-ultima-copia'

export function lerUltimaCopia(): Date | null {
  try {
    const bruto = localStorage.getItem(CHAVE_DA_ULTIMA_COPIA)
    if (bruto === null) return null
    const data = new Date(bruto)
    return Number.isNaN(data.getTime()) ? null : data
  } catch {
    return null
  }
}

export function marcarUltimaCopia(quando: Date = new Date()): void {
  try {
    localStorage.setItem(CHAVE_DA_ULTIMA_COPIA, quando.toISOString())
  } catch {
    // Armazenamento bloqueado: a linha continua dizendo que não há cópia.
  }
}
