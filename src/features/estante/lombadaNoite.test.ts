import { describe, expect, it } from 'vitest'

import { ESTILOS_DA_LOMBADA, PALETA_NOITE } from '@/core'

import {
  CREME,
  corDoTexto,
  ehCorClara,
  corNaLuz,
  geometriaDaLombada,
  luminancia,
  reservaDoIcone,
  sombraDoFundoEmPercentual,
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

describe('a cor sob a luz', () => {
  it('em 50 é a cor real, para o livro e para o enfeite', () => {
    expect(corNaLuz('#1B2A6B', 50, 'livro')).toBe('#1B2A6B')
    expect(corNaLuz('#1B2A6B', 50, 'enfeite')).toBe('#1B2A6B')
  })

  it('abaixo de 50 vem uma sombra (preto por cima), que cresce até 60% no 0', () => {
    expect(corNaLuz('#1B2A6B', 25, 'livro')).toContain('#000 30%')
    expect(corNaLuz('#1B2A6B', 0, 'livro')).toContain('#000 60%')
    expect(corNaLuz('#1B2A6B', 0, 'enfeite')).toContain('#000 60%')
  })

  it('acima de 50 o livro ganha uma luz azul-clara e o enfeite fica mais branco', () => {
    expect(corNaLuz('#1B2A6B', 100, 'livro')).toContain('#8FA6FF 32%')
    expect(corNaLuz('#1B2A6B', 100, 'enfeite')).toContain('#fff 18%')
    expect(corNaLuz('#1B2A6B', 75, 'enfeite')).toContain('#fff 9%')
  })

  it('só a luz dos enfeites escurece o fundo, e só abaixo de 50', () => {
    expect(sombraDoFundoEmPercentual(50)).toBe(0)
    expect(sombraDoFundoEmPercentual(100)).toBe(0)
    expect(sombraDoFundoEmPercentual(25)).toBe(35)
    expect(sombraDoFundoEmPercentual(0)).toBe(70)
  })
})

describe('tamanho do título', () => {
  it('numa lombada estreita quem manda é a largura: 0,46 × W', () => {
    expect(tamanhoDoTitulo(24, 90, 3)).toBe(11)
  })

  it('num título longo quem manda é o espaço: espaço ÷ (n × 0,72)', () => {
    // 100 ÷ (10 × 0,72) = 13,88…
    expect(tamanhoDoTitulo(68, 100, 10)).toBe(13.9)
  })

  it('nunca desce de 11 px, o piso de leitura — o resto vira reticências', () => {
    expect(tamanhoDoTitulo(24, 70, 60)).toBe(11)
  })

  it('título vazio não divide por zero', () => {
    expect(Number.isFinite(tamanhoDoTitulo(38, 100, 0))).toBe(true)
  })
})

describe('o ícone do pé', () => {
  it('reserva 20 px do pé (7 de base, 11 do ícone, 2 de folga) — e 26 no papel, acima da contagem', () => {
    expect(reservaDoIcone('solido')).toBe(20)
    expect(reservaDoIcone('contorno')).toBe(20)
    expect(reservaDoIcone('papel')).toBe(26)
  })
})

describe('geometriaDaLombada', () => {
  const base = {
    estilo: 'solido',
    cor: '#1B2A6B',
    titulo: 'Psicologia',
    largura: 38,
    altura: 100,
    intensidadeDaLuz: 50,
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
    // Em 50 a cor na luz é a cor real.
    expect(style).toMatchObject({ '--cor-na-luz': '#1B2A6B' })
  })

  it('abaixo de 50 a cor na luz ganha sombra, e acima o enfeite fica mais branco', () => {
    const escuro = geometriaDaLombada({ ...base, intensidadeDaLuz: 0 }).style as Record<
      string,
      string
    >
    expect(escuro['--cor-na-luz']).toContain('#000 60%')
    const branco = geometriaDaLombada({ ...base, intensidadeDaLuz: 100, peca: 'enfeite' })
      .style as Record<string, string>
    expect(branco['--cor-na-luz']).toContain('#fff 18%')
  })

  it('o papel é sempre creme, com texto escuro, qualquer que seja a cor', () => {
    const { style } = geometriaDaLombada({ ...base, estilo: 'papel', cor: '#12204F' })
    expect(style).toMatchObject({ '--cor': CREME, '--fg': TEXTO_ESCURO, '--cor-na-luz': CREME })
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
    const fonte = (estilo: 'solido' | 'fio'): string =>
      (
        geometriaDaLombada({ ...base, estilo, largura: 68, titulo: 'Arte' }).style as Record<
          string,
          string
        >
      )['--fs']!
    // 75 ÷ (4 × 0,72) = 26 px no sólido; a zona do fio (72,5) é um pouco menor.
    expect(fonte('solido')).toBe('26px')
    expect(fonte('fio')).toBe('25.2px')
  })

  it('o título se centra na lombada em toda forma', () => {
    for (const estilo of ESTILOS_DA_LOMBADA) {
      const { style } = geometriaDaLombada({ ...base, estilo })
      expect(style).toMatchObject({ '--zt-x': '50%' })
    }
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

  it('com ícone, o título cede o pé: a zona termina acima dele, qualquer que seja o título', () => {
    for (const titulo of ['Arte', 'Uma área enorme do que eu sei hoje']) {
      for (const estilo of ESTILOS_DA_LOMBADA) {
        const altura = 100
        const style = geometriaDaLombada({ ...base, estilo, titulo, altura, icone: true })
          .style as Record<string, string>
        const fim = parseFloat(style['--zt-topo']!) + parseFloat(style['--zt-altura']!)
        // o fim da zona (em % de H = px, com H = 100) fica acima da reserva do ícone
        expect(fim).toBeLessThanOrEqual(100 - reservaDoIcone(estilo) + 0.1)
      }
    }
  })

  it('sem ícone, a zona é a de sempre (o título usa o pé)', () => {
    const sem = geometriaDaLombada({ ...base, altura: 100 }).style as Record<string, string>
    const com = geometriaDaLombada({ ...base, altura: 100, icone: true }).style as Record<
      string,
      string
    >
    expect(sem['--zt-altura']).toBe('75%')
    expect(parseFloat(com['--zt-altura']!)).toBeLessThan(75)
  })

  it('o título nunca fica menor que o piso por causa do ícone: a zona tem pelo menos 11 px', () => {
    const style = geometriaDaLombada({ ...base, estilo: 'ponto', altura: 40, icone: true })
      .style as Record<string, string>
    expect((parseFloat(style['--zt-altura']!) / 100) * 40).toBeGreaterThanOrEqual(11 - 0.01)
  })
})
