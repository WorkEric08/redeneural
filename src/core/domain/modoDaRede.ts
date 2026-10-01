/**
 * As duas visões da tela da Rede: a constelação (por significado) e o Mapa
 * (por livro, em ilhas). A tela abre no último modo usado — na primeira vez,
 * a Rede —, gravado como preferência, junto do modo da busca.
 */
export type ModoDaRede = 'rede' | 'mapa'

export const MODO_DA_REDE_PADRAO: ModoDaRede = 'rede'

/** Um valor gravado que não é um modo conhecido vale o padrão, em vez de quebrar. */
export function modoDaRedeOuPadrao(valor: unknown): ModoDaRede {
  return valor === 'rede' || valor === 'mapa' ? valor : MODO_DA_REDE_PADRAO
}
