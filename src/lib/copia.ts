import { contar } from './plural'

/** O que o arquivo de uma cópia traz, para a pessoa conferir antes de restaurar. */
export interface ResumoDaCopia {
  livros: number
  pensamentos: number
}

/**
 * Lê só o suficiente para dizer o que o arquivo é, sem validar nada de verdade: quem valida o
 * formato e a integridade é o motor (`importAll`), que recusa antes de encostar no banco. Aqui o
 * objetivo é só recusar cedo o que claramente não é uma cópia (outro JSON, um texto qualquer) e
 * mostrar quanto vem junto. `null` quando não parece uma cópia do Locus.
 */
export function resumoDaCopia(texto: string): ResumoDaCopia | null {
  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch {
    return null
  }

  if (typeof bruto !== 'object' || bruto === null) return null
  const { livros, neuronios } = bruto as Record<string, unknown>
  if (!Array.isArray(livros) || !Array.isArray(neuronios)) return null

  return { livros: livros.length, pensamentos: neuronios.length }
}

const MS_POR_DIA = 24 * 60 * 60 * 1000

/** "hoje", "ontem" ou "há 12 dias" — por dia de calendário, não por 24 horas corridas. */
export function haQuantoTempo(quando: Date, agora: Date = new Date()): string {
  const diaDe = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dias = Math.max(0, Math.round((diaDe(agora) - diaDe(quando)) / MS_POR_DIA))

  if (dias === 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${contar(dias, 'dia', 'dias')}`
}
