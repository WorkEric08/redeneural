/**
 * Os dois jeitos de buscar (ver `pages/Busca.tsx`). A tela abre no último que
 * a pessoa escolheu — pedido do usuário, 30/09/2026 —, gravado como
 * preferência, no mesmo lugar de `quantidadeDePrateleiras`.
 */
export type ModoDaBusca = 'sentido' | 'exata'

/** Quem nunca escolheu começa no sentido. */
export const MODO_DA_BUSCA_PADRAO: ModoDaBusca = 'sentido'

/** Um valor gravado que não é um modo conhecido vale o padrão, em vez de quebrar. */
export function modoDaBuscaOuPadrao(valor: unknown): ModoDaBusca {
  return valor === 'sentido' || valor === 'exata' ? valor : MODO_DA_BUSCA_PADRAO
}
