import { describe, expect, it } from 'vitest'

import { ESTILOS_DA_LOMBADA, PALETA_NOITE } from '@/core'

import {
  CREME,
  corDoTexto,
  ehCorClara,
  emblemaCabe,
  geometriaDaLombada,
  lavagemEmPercentual,
  luminancia,
  tamanhoDoTitulo,
  TEXTO_CLARO,
  TEXTO_ESCURO,
} from './lombadaNoite'

describe('cor do texto', () => {
  it('só o Creme é claro na paleta, e só nele o texto vai escuro', () => {
    for (const t of PALETA_NOITE) {
      const esperado = t.hex === CREME ? TEXTO_ESCURO : TEXTO_CLARO
      expect(corDoTexto(t.hex)).toBe(esperado)
    }
  })

  it('a luminância é a de 0,299 R + 0,587 G + 0,114 B, de 0 a 1', () => {
    expect(luminancia('#000000')).toBe(0)
    expect(luminancia('#ffffff')).toBeCloseTo(1, 5)
    expect(luminancia('#ff0000')).toBeCloseTo(0.299, 3)
    expect(ehCorClara('#8c8c8c')).toBe(false)
    expect(ehCorClara('#909090')).toBe(true)
  })
})

describe('lavagem', () => {
  it('o slider no padrão dá os 16% do desenho, e 0 mostra a cor real', () => {
    expect(lavagemEmPercentual(42)).toBe(16)
    expect(lavagemEmPercentual(0)).toBe(0)
  })

  it('cresce com o slider e para em 38%', () => {
    expect(lavagemEmPercentual(21)).toBe(8)
    expect(lavagemEmPercentual(100)).toBe(38)
  })
})

describe('tamanho do título', () => {
  it('numa lombada estreita quem manda é a largura: 0,46 × W', () => {
    expect(tamanhoDoTitulo(24, 90, 3)).toBe(11)
  })

  it('num título longo quem manda é o espaço: espaço ÷ (n × 0,9)', () => {
    // 100 ÷ (10 × 0,9) = 11,1…
    expect(tamanhoDoTitulo(68, 100, 10)).toBe(11.1)
  })

  it('nunca desce de 9 px — o resto vira reticências', () => {
    expect(tamanhoDoTitulo(24, 70, 60)).toBe(9)
  })

  it('título vazio não divide por zero', () => {
    expect(Number.isFinite(tamanhoDoTitulo(38, 100, 0))).toBe(true)
  })
})

describe('emblema', () => {
  it('cabe quando o título é curto e some quando ele ocupa a zona', () => {
    expect(emblemaCabe('solido', 120, 11, 3)).toBe(true)
    expect(emblemaCabe('solido', 120, 11, 40)).toBe(false)
  })

  it('no papel a contagem ocupa o pé: o emblema nunca cabe', () => {
    expect(emblemaCabe('papel', 130, 11, 1)).toBe(false)
  })
})

describe('geometriaDaLombada', () => {
  const base = {
    estilo: 'solido',
    cor: '#1B2A6B',
    titulo: 'Psicologia',
    largura: 38,
    altura: 100,
    intensidadeDaLuz: 42,
  } as const

  it('escreve cor, texto, fonte e zona como variáveis CSS', () => {
    const { style } = geometriaDaLombada(base)
    expect(style).toMatchObject({
      '--cor': '#1B2A6B',
      '--fg': TEXTO_CLARO,
      '--zt-topo': '12.5%',
      '--zt-altura': '75%',
      '--zt-x': '50%',
    })
    expect(String((style as Record<string, string>)['--cor-lavada'])).toContain('84%')
  })

  it('o papel é sempre creme, com texto escuro e sem lavagem, qualquer que seja a cor', () => {
    const { style } = geometriaDaLombada({ ...base, estilo: 'papel', cor: '#12204F' })
    expect(style).toMatchObject({ '--cor': CREME, '--fg': TEXTO_ESCURO })
    expect(String((style as Record<string, string>)['--cor-lavada'])).toContain('100%')
  })

  it('o degradê e o bloco invertem em livro claro', () => {
    const escuro = geometriaDaLombada(base).style as Record<string, string>
    const claro = geometriaDaLombada({ ...base, cor: CREME }).style as Record<string, string>
    expect(escuro['--degrade-alvo']).toBe('#000')
    expect(escuro['--oposto']).toBe('#000')
    expect(claro['--degrade-alvo']).toBe('#fff')
    expect(claro['--oposto']).toBe('#fff')
    expect(claro['--fg']).toBe(TEXTO_ESCURO)
  })

  it('o título se mede pela zona da forma: no sólido a zona é 0,75 × H', () => {
    const fonte = (estilo: 'solido' | 'duas-cores'): string =>
      (
        geometriaDaLombada({ ...base, estilo, largura: 68, titulo: 'Arte' }).style as Record<
          string,
          string
        >
      )['--fs']!
    // 75 ÷ (4 × 0,9) = 20,8 px no sólido; a zona de duas cores (57,5) é menor.
    expect(fonte('solido')).toBe('20.8px')
    expect(fonte('duas-cores')).toBe('16px')
  })

  it('a coluna da forma metade desloca o título para os 62% da esquerda', () => {
    const { style } = geometriaDaLombada({ ...base, estilo: 'metade' })
    expect(style).toMatchObject({ '--zt-x': '31%' })
  })

  it('a zona do título cabe dentro da lombada em todas as formas', () => {
    for (const estilo of ESTILOS_DA_LOMBADA) {
      const style = geometriaDaLombada({ ...base, estilo }).style as Record<string, string>
      const topo = parseFloat(style['--zt-topo']!)
      const altura = parseFloat(style['--zt-altura']!)
      expect(topo).toBeGreaterThan(0)
      expect(topo + altura).toBeLessThanOrEqual(100)
    }
  })

  it('a conta do emblema usa a mesma fonte que a lombada vai desenhar', () => {
    const curto = geometriaDaLombada({ ...base, titulo: 'Arte', altura: 130 })
    const longo = geometriaDaLombada({
      ...base,
      titulo: 'Uma área enorme do que eu sei hoje',
      altura: 130,
    })
    expect(curto.emblemaCabe).toBe(true)
    expect(longo.emblemaCabe).toBe(false)
  })
})
