/** Parâmetros do motor de conexões. Números vindos do plano; ajustáveis por teste. */
export interface OpcoesMotor {
  /** Quantos vizinhos por nó entram na disputa (top-K por cosseno centralizado). */
  candK: number
  /**
   * Piso do divisor da escala do embedding.
   *
   * O divisor em si (`PerfilDoPalacio.escalaEmb`) é derivado do corpus, não fixo:
   * o spike da Fase 3 mediu cosseno centralizado máximo de 0,070 num palácio de
   * 9 neurônios, contra o 0,45 constante que o plano previa. Com o divisor errado
   * todo score sai perto de zero. Este piso só existe para evitar divisão por
   * ~zero num palácio recém-nascido.
   */
  escalaEmbMinima: number
  /** Peso do embedding na fusão; o reranker fica com `1 - pesoEmb`. */
  pesoEmb: number
  /** Um vizinho sobrevive se `fused >= razaoCorte * melhorFused` daquele nó. */
  razaoCorte: number
  /** Nunca órfão. */
  minVizinhos: number
  /** Nunca vira novelo — teto do que **cada nó mantém**, não do grau final. */
  maxVizinhos: number
}

export const OPCOES_PADRAO: OpcoesMotor = {
  candK: 6,
  escalaEmbMinima: 0.02,
  pesoEmb: 0.5,
  razaoCorte: 0.6,
  minVizinhos: 1,
  maxVizinhos: 6,
}
