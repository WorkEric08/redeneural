/**
 * Quantas letras do título aparecem na lombada — a mesma conta que o navegador faz com as
 * reticências de `.lombada-titulo` (caixa alta, Source Sans 3 em peso 600, 0,06em de espaçamento, uma
 * linha só): o que não cabe na zona do título é cortado e vira "…". O campo de nome do formulário usa
 * este número para mostrar, enquanto se escreve, o que vai ficar de fora (13/10/2026).
 */

const ESPACAMENTO_EM = 0.06
const FAMILIA = '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
/** Sem canvas (testes, ambiente sem fonte), cada letra vale isto do corpo: a média medida. */
const AVANCO_SEM_CANVAS = 0.6

/** Largura de um texto (já em caixa alta) em px, a esse corpo, sem o espaçamento entre letras. */
export type Medidor = (texto: string, corpoPx: number) => number

let contexto: CanvasRenderingContext2D | null | undefined

export const medirNoCanvas: Medidor = (texto, corpoPx) => {
  if (contexto === undefined) {
    try {
      contexto =
        typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
    } catch {
      contexto = null
    }
  }
  if (!contexto) return texto.length * corpoPx * AVANCO_SEM_CANVAS
  contexto.font = `600 ${String(corpoPx)}px ${FAMILIA}`
  return contexto.measureText(texto).width
}

/**
 * O número de letras (do começo do título) que aparecem na lombada: todas, se cabem na zona, ou as
 * que cabem junto com as reticências. `zonaPx` é a altura da zona do título (o texto corre na vertical).
 */
export function letrasVisiveis(
  titulo: string,
  corpoPx: number,
  zonaPx: number,
  medir: Medidor = medirNoCanvas,
): number {
  const letras = [...titulo].map((l) => l.toUpperCase())
  const largura = (k: number): number =>
    medir(letras.slice(0, k).join(''), corpoPx) + k * ESPACAMENTO_EM * corpoPx
  if (letras.length === 0 || largura(letras.length) <= zonaPx) return letras.length
  const reticencias = medir('…', corpoPx) + ESPACAMENTO_EM * corpoPx
  let k = letras.length
  while (k > 0 && largura(k) + reticencias > zonaPx) k -= 1
  return k
}
