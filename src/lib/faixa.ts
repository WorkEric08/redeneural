/**
 * O espaço entre as opções de uma fileira que rola de lado para que a última opção visível fique
 * **cortada ao meio** na borda direita — o aviso, como nas fileiras da Netflix, de que há mais ao
 * lado. As opções têm larguras diferentes e não mudam de tamanho: quem cede é o espaço entre elas.
 *
 * Procura a maior quantidade de opções inteiras que ainda deixa o meio da seguinte exatamente na
 * borda (`visivel`), sem o espaço descer de `minimo`. Devolve `null` quando a fileira inteira cabe
 * (não há o que avisar) ou quando nenhum espaço serve — aí a fileira fica como está.
 *
 * @param larguras largura de cada opção
 * @param visivel largura da área visível da fileira
 * @param recuo folga no começo da fileira, antes da primeira opção
 * @param padrao o espaço de sempre; se a fileira cabe com ele, não se mexe em nada
 * @param minimo o menor espaço aceito entre duas opções
 */
export function espacoParaMeiaOpcao(
  larguras: readonly number[],
  visivel: number,
  recuo: number,
  padrao: number,
  minimo: number,
): number | null {
  const n = larguras.length
  if (n < 2) return null
  const total = larguras.reduce((soma, l) => soma + l, 0)
  if (recuo * 2 + total + (n - 1) * padrao <= visivel) return null

  let inteiras = 0
  for (let k = 1; k < n; k++) {
    // k opções inteiras antes da cortada, que é a de índice k: o meio dela cai em `visivel`.
    inteiras += larguras[k - 1] ?? 0
    const espaco = (visivel - recuo - inteiras - (larguras[k] ?? 0) / 2) / k
    if (espaco >= minimo) continue
    // O espaço desceu abaixo do mínimo com k opções: a anterior (k - 1) era a última que servia.
    return k === 1 ? null : espacoCom(larguras, visivel, recuo, k - 1)
  }
  return espacoCom(larguras, visivel, recuo, n - 1)
}

function espacoCom(larguras: readonly number[], visivel: number, recuo: number, k: number): number {
  let inteiras = 0
  for (let i = 0; i < k; i++) inteiras += larguras[i] ?? 0
  return (visivel - recuo - inteiras - (larguras[k] ?? 0) / 2) / k
}

/** Quanto de folga conta como "chegou no fim": subpixel e arredondamento não valem. */
const TOLERANCIA_DO_FIM_PX = 2

/** Ainda há opções escondidas à direita de uma fileira que rola de lado? */
export function haMaisADireita(scrollLeft: number, visivel: number, total: number): boolean {
  return scrollLeft + visivel < total - TOLERANCIA_DO_FIM_PX
}
