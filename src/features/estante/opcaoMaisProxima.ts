/**
 * A opção da lista que fica mais perto de `valor`. É como a tela de editar enfeite
 * mostra a medida dele: o enfeite sorteado tem largura e altura que quase nunca
 * caem em Fina/Normal/Grossa/Grande ou Curto/Normal/Alto/Enorme, e só essas quatro
 * existem na tela. Empate fica com a menor.
 */
export function opcaoMaisProxima(valor: number, opcoes: readonly number[]): number {
  let melhor = opcoes[0] ?? valor
  for (const o of opcoes) {
    if (Math.abs(o - valor) < Math.abs(melhor - valor)) melhor = o
  }
  return melhor
}
