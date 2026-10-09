import { describe, expect, it } from 'vitest'

import { geometriaDaAbertura, PERSPECTIVA, type Caixa } from './abertura'

/**
 * Onde a face da lombada aparece na tela, com o livro na pose de partida
 * (`translate3d · scale3d · rotateY(90deg)`), pela mesma projeção que o
 * navegador faz com `perspective` no centro da tela.
 */
function lombadaProjetada(lombada: Caixa, largura: number, altura: number): Caixa {
  const g = geometriaDaAbertura(lombada, largura, altura)
  const { x, y, escala, escalaX } = g.partida
  const z = (escala * g.largura) / 2
  const aumento = PERSPECTIVA / (PERSPECTIVA - z)

  const w = g.grossura * escalaX * aumento
  const h = g.altura * escala * aumento
  const cx = largura / 2 + x * aumento
  const cy = altura / 2 + y * aumento
  return { left: cx - w / 2, top: cy - h / 2, width: w, height: h }
}

describe('geometriaDaAbertura', () => {
  const lombada: Caixa = { left: 40, top: 120, width: 38, height: 104 }

  it('parte com a lombada 3D exatamente em cima da lombada da estante', () => {
    // Das mais finas às mais largas que a estante desenha, e em lugares
    // diferentes da tela — inclusive quando a grossura bate no limite.
    for (const caixa of [
      lombada,
      { left: 300, top: 700, width: 24, height: 123 },
      { left: 180, top: 40, width: 68, height: 58 },
    ]) {
      const projetada = lombadaProjetada(caixa, 412, 892)
      expect(projetada.left).toBeCloseTo(caixa.left, 6)
      expect(projetada.top).toBeCloseTo(caixa.top, 6)
      expect(projetada.width).toBeCloseTo(caixa.width, 6)
      expect(projetada.height).toBeCloseTo(caixa.height, 6)
    }
  })

  it('aberto, as duas páginas cabem na tela, do menor celular ao desktop', () => {
    for (const [largura, altura] of [
      [320, 568],
      [412, 892],
      [768, 1024],
      [1440, 900],
    ] as const) {
      const g = geometriaDaAbertura(lombada, largura, altura)
      expect(g.largura * 2).toBeLessThanOrEqual(largura * 0.9)
      expect(g.altura).toBeLessThanOrEqual(altura * 0.6)
    }
  })

  it('a grossura segue a lombada: livro largo na estante é livro grosso na mão', () => {
    const fino = geometriaDaAbertura({ ...lombada, width: 26 }, 412, 892)
    const grosso = geometriaDaAbertura({ ...lombada, width: 60 }, 412, 892)
    expect(grosso.grossura).toBeGreaterThan(fino.grossura)
  })

  it('a grossura tem limite: nem folha de papel, nem tijolo', () => {
    const g = geometriaDaAbertura({ ...lombada, width: 400 }, 412, 892)
    expect(g.grossura).toBeLessThanOrEqual(g.altura * 0.3)
    const h = geometriaDaAbertura({ ...lombada, width: 1 }, 412, 892)
    expect(h.grossura).toBeGreaterThanOrEqual(h.altura * 0.08)
  })

  it('aberto, o livro anda meia capa para o par de páginas ficar no meio', () => {
    const g = geometriaDaAbertura(lombada, 412, 892)
    expect(g.deslocamentoAberto).toBe(g.largura / 2)
  })

  it('um livro de pé não gira na partida', () => {
    expect(geometriaDaAbertura(lombada, 412, 892).giro).toBe(0)
  })

  it('um livro deitado parte girado -90°, com a lombada exatamente em cima da dele', () => {
    // Largura e altura trocadas: o livro deitado é o mesmo livro, de lado.
    for (const caixa of [
      { left: 30, top: 300, width: 95, height: 38 },
      { left: 200, top: 500, width: 129, height: 24 },
      { left: 100, top: 50, width: 66, height: 68 },
    ]) {
      const g = geometriaDaAbertura(caixa, 412, 892, true)
      expect(g.giro).toBe(-90)

      const emPe = {
        left: caixa.left + caixa.width / 2 - caixa.height / 2,
        top: caixa.top + caixa.height / 2 - caixa.width / 2,
        width: caixa.height,
        height: caixa.width,
      }
      const projetada = lombadaProjetada(emPe, 412, 892)
      // Girar -90° em volta do centro troca a largura pela altura e não mexe no centro.
      expect(projetada.left + projetada.width / 2).toBeCloseTo(caixa.left + caixa.width / 2, 6)
      expect(projetada.top + projetada.height / 2).toBeCloseTo(caixa.top + caixa.height / 2, 6)
      expect(projetada.height).toBeCloseTo(caixa.width, 6)
      expect(projetada.width).toBeCloseTo(caixa.height, 6)
    }
  })

  it('a mesma pose de chegada, de pé ou deitado: só a partida muda', () => {
    const emPe = geometriaDaAbertura({ left: 40, top: 120, width: 38, height: 95 }, 412, 892)
    const deitado = geometriaDaAbertura(
      { left: 40, top: 120, width: 95, height: 38 },
      412,
      892,
      true,
    )
    expect(deitado.largura).toBe(emPe.largura)
    expect(deitado.altura).toBe(emPe.altura)
    expect(deitado.deslocamentoAberto).toBe(emPe.deslocamentoAberto)
  })
})
