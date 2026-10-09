import type { MedidasDaEstante } from './cabeNaEstante'

/**
 * A fileira da estante, como ela mediu da última vez que esteve na tela. Só a estante sabe o
 * quanto ela tem entre as laterais (a fileira se mede pela tela), e criar ou editar um livro mora
 * em outra tela: este é o recado que a estante deixa para elas.
 *
 * Uma variável de módulo, e não estado: só é lida na hora de gravar, nunca para desenhar. `null`
 * até a estante abrir uma vez (um link direto para o formulário) — aí não há o que conferir, e a
 * adaptação visual das laterais (`ajustarALargura`) cobre.
 */
let ultima: MedidasDaEstante | null = null

export function lembrarMedidasDaEstante(medidas: MedidasDaEstante): void {
  ultima = medidas
}

export function medidasDaEstante(): MedidasDaEstante | null {
  return ultima
}
