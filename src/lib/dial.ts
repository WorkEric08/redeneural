/**
 * A geometria do dial.
 *
 * Pura e fora do componente (CLAUDE.md regra 9): o dial é um anel de setores em
 * volta de um botão, e decidir "para qual setor o dedo está apontando" é
 * trigonometria, não React. Aqui dá para testar sem DOM nenhum.
 *
 * O botão mora no canto de baixo à direita, então o arco só pode ocupar o que
 * sobra: de quase-esquerda a quase-cima. Ângulos em graus, no sentido
 * anti-horário a partir da direita — 90° é para cima, 180° é para a esquerda.
 */

/** O arco vai de perto da esquerda até perto de cima, passando pela diagonal. */
export const ARCO_INICIO = 75
export const ARCO_FIM = 195

/** Raio do anel. O vão interno é maior que o botão, para o dedo não tapar tudo. */
export const RAIO_INTERNO = 46
export const RAIO_EXTERNO = 104
export const RAIO_MEIO = (RAIO_INTERNO + RAIO_EXTERNO) / 2

/**
 * Dentro deste raio nada é escolhido: é onde o botão está, e é para onde se
 * volta quando se desiste no meio do gesto.
 */
export const RAIO_MORTO = 34

export interface Setor {
  inicio: number
  fim: number
  meio: number
}

export function setores(quantos: number): Setor[] {
  const passo = (ARCO_FIM - ARCO_INICIO) / quantos

  return Array.from({ length: quantos }, (_, i) => {
    const inicio = ARCO_INICIO + i * passo
    return { inicio, fim: inicio + passo, meio: inicio + passo / 2 }
  })
}

/** Graus do vetor que sai do centro do botão. A tela cresce para baixo; o ângulo, não. */
export function grauDe(dx: number, dy: number): number {
  const grau = (Math.atan2(-dy, dx) * 180) / Math.PI
  return grau < 0 ? grau + 360 : grau
}

/**
 * Qual setor o dedo aponta, ou `null` para nenhum.
 *
 * Sem raio máximo de propósito: quem arrasta para longe continua apontando para
 * o mesmo lugar, e a cunha só fica mais fácil de acertar. O que cancela é
 * voltar para o centro, não passar do anel.
 */
export function setorEm(dx: number, dy: number, quantos: number): number | null {
  if (Math.hypot(dx, dy) < RAIO_MORTO) return null

  const passo = (ARCO_FIM - ARCO_INICIO) / quantos
  const indice = Math.floor((grauDe(dx, dy) - ARCO_INICIO) / passo)

  return indice >= 0 && indice < quantos ? indice : null
}

export function pontoNoArco(raio: number, grau: number): { x: number; y: number } {
  const rad = (grau * Math.PI) / 180
  return { x: raio * Math.cos(rad), y: -raio * Math.sin(rad) }
}

/**
 * O `d` de uma cunha do anel, com uma folga angular para os setores não se
 * encostarem — é a fresta escura que faz ler como peças separadas, e não como
 * uma rosca pintada.
 */
export function caminhoDoSetor(setor: Setor, folga = 1.6): string {
  const de = setor.inicio + folga
  const ate = setor.fim - folga
  const grande = ate - de > 180 ? 1 : 0

  const externoDe = pontoNoArco(RAIO_EXTERNO, de)
  const externoAte = pontoNoArco(RAIO_EXTERNO, ate)
  const internoAte = pontoNoArco(RAIO_INTERNO, ate)
  const internoDe = pontoNoArco(RAIO_INTERNO, de)

  // Ângulo crescente vira anti-horário na tela, e anti-horário é sweep 0.
  return [
    `M ${n(externoDe.x)} ${n(externoDe.y)}`,
    `A ${String(RAIO_EXTERNO)} ${String(RAIO_EXTERNO)} 0 ${String(grande)} 0 ${n(externoAte.x)} ${n(externoAte.y)}`,
    `L ${n(internoAte.x)} ${n(internoAte.y)}`,
    `A ${String(RAIO_INTERNO)} ${String(RAIO_INTERNO)} 0 ${String(grande)} 1 ${n(internoDe.x)} ${n(internoDe.y)}`,
    'Z',
  ].join(' ')
}

/**
 * O fio que sai do setor e vai até o rótulo, como na referência: nasce radial e
 * chega horizontal no nome da opção.
 */
export function caminhoDoFio(setor: Setor, alvoX: number, alvoY: number): string {
  const saida = pontoNoArco(RAIO_EXTERNO + 4, setor.meio)
  const puxada = pontoNoArco(RAIO_EXTERNO + 26, setor.meio)

  return `M ${n(saida.x)} ${n(saida.y)} C ${n(puxada.x)} ${n(puxada.y)} ${n(alvoX + 26)} ${n(alvoY)} ${n(alvoX)} ${n(alvoY)}`
}

function n(valor: number): string {
  return (Math.round(valor * 100) / 100).toString()
}
