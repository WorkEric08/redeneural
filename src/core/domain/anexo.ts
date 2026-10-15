/**
 * O que a pessoa escreve num item de pasta: um título e uma legenda (15/10/2026). O título é o nome do
 * item — o que aparece no cartão da pasta e no alto da tela dele —, e a legenda é o texto, como o
 * conteúdo de um pensamento.
 */
interface TextoDoAnexo {
  titulo: string
  legenda: string
}

/**
 * O que o motor lê de um anexo: o título e a legenda juntos, como o pensamento lê "título. conteúdo".
 * Vazio, o anexo não tem o que ler e fica só na pasta, sem fio nenhum.
 */
export function textoDoAnexo(a: TextoDoAnexo): string {
  return [a.titulo.trim(), a.legenda.trim()].filter((t) => t !== '').join('. ')
}

/** Como a pessoa chama o item: o título, ou, num item de antes dos títulos, a legenda. */
export function nomeDoAnexo(a: TextoDoAnexo): string {
  return a.titulo.trim() || a.legenda.trim()
}
