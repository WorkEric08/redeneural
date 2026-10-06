import { describe, expect, it } from 'vitest'

import { FRACAO_DA_CHEIA, paradasDaFolha } from './paradasDaFolha'

describe('paradasDaFolha', () => {
  it('o conteúdo que cabe na tela abre inteiro, sem esticar e sem rolar', () => {
    // 420px numa tela de 568px: antes abria em 300px (o piso do meio) e rolava.
    expect(paradasDaFolha(420, 568)).toEqual({ meio: 420, cheio: 420, expansivel: false })
  })

  it('com o teclado aberto a tela encolhe, e o conteúdo que ainda cabe continua inteiro', () => {
    expect(paradasDaFolha(285, 312)).toEqual({ meio: 285, cheio: 285, expansivel: false })
  })

  it('cabe até o teto de 92% da tela, e nem um pixel a mais', () => {
    const tela = 800
    const teto = tela * FRACAO_DA_CHEIA
    expect(paradasDaFolha(teto, tela).expansivel).toBe(false)
    expect(paradasDaFolha(teto, tela).meio).toBe(teto)
    expect(paradasDaFolha(teto + 1, tela).expansivel).toBe(true)
  })

  it('o que passa da tela abre pela metade e estica até o teto', () => {
    expect(paradasDaFolha(1200, 844)).toEqual({
      meio: 422,
      cheio: 844 * FRACAO_DA_CHEIA,
      expansivel: true,
    })
  })

  it('numa tela baixa a metade tem um piso de 300px, sem passar do teto', () => {
    // 400 * 0,92 = 368: o piso (300) cabe abaixo do teto.
    expect(paradasDaFolha(900, 400)).toMatchObject({ meio: 300, expansivel: true })
    // 300 * 0,92 = 276: o piso passaria do teto, então vale o teto.
    expect(paradasDaFolha(900, 300)).toMatchObject({ meio: 276, expansivel: false })
  })
})
