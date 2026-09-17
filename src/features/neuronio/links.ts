/**
 * Divide o texto de um neurônio em trechos comuns e URLs, para a tela de
 * leitura poder desenhar as URLs como link sem o `conteudo` deixar de ser
 * `string` pura — o mesmo espírito do markdown em texto puro (ver CLAUDE.md,
 * "A barra de escrita acima do teclado"): nenhuma marcação entra no dado,
 * só a exibição reconhece o que já está lá.
 *
 * Só reconhece `http://`/`https://` — o caso pedido (colar um link do
 * YouTube) sempre vem com o protocolo.
 */

const URL_REGEX = /https?:\/\/[^\s<>"']+/g

/** Pontuação de frase que costuma vir colada depois de uma URL colada no meio do texto. */
const PONTUACAO_FINAL = /[.,;:!?)\]}'"]+$/

export interface SegmentoDeTexto {
  tipo: 'texto' | 'link'
  valor: string
}

export function dividirEmSegmentos(texto: string): SegmentoDeTexto[] {
  const segmentos: SegmentoDeTexto[] = []
  let cursor = 0

  for (const encontro of texto.matchAll(URL_REGEX)) {
    const inicio = encontro.index
    let url = encontro[0]

    const pontuacao = PONTUACAO_FINAL.exec(url)?.[0] ?? ''
    if (pontuacao) url = url.slice(0, -pontuacao.length)
    if (url.length === 0) continue

    if (inicio > cursor) segmentos.push({ tipo: 'texto', valor: texto.slice(cursor, inicio) })
    segmentos.push({ tipo: 'link', valor: url })
    cursor = inicio + url.length
  }

  if (cursor < texto.length) segmentos.push({ tipo: 'texto', valor: texto.slice(cursor) })

  return segmentos
}
