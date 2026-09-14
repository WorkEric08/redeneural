/**
 * Largura da lombada, escolhida na mão — em px, o mesmo mundo da largura
 * automática (`Math.round(30 + a * 16)` em `prateleiras.ts`, 30 a 46px).
 *
 * Nomeada e discreta, não um slider contínuo: "quão grosso é este livro" se
 * lê melhor como fino/normal/grosso/grande do que como um número de pixel.
 */

export interface OpcaoDeLargura {
  chave: string
  rotulo: string
  px: number
}

export const LARGURAS: readonly OpcaoDeLargura[] = [
  { chave: 'fina', rotulo: 'Fina', px: 24 },
  { chave: 'normal', rotulo: 'Normal', px: 38 },
  { chave: 'grossa', rotulo: 'Grossa', px: 52 },
  { chave: 'grande', rotulo: 'Grande', px: 68 },
] as const
