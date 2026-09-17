import { describe, expect, it } from 'vitest'

import { dividirEmSegmentos } from './links'

describe('dividirEmSegmentos', () => {
  it('texto sem URL vira um único segmento de texto', () => {
    expect(dividirEmSegmentos('sem link nenhum aqui')).toEqual([
      { tipo: 'texto', valor: 'sem link nenhum aqui' },
    ])
  })

  it('reconhece uma URL no meio do texto', () => {
    expect(dividirEmSegmentos('veja https://youtu.be/abc123 depois')).toEqual([
      { tipo: 'texto', valor: 'veja ' },
      { tipo: 'link', valor: 'https://youtu.be/abc123' },
      { tipo: 'texto', valor: ' depois' },
    ])
  })

  it('URL no início ou no fim não deixa segmento de texto vazio', () => {
    expect(dividirEmSegmentos('https://exemplo.com resto')).toEqual([
      { tipo: 'link', valor: 'https://exemplo.com' },
      { tipo: 'texto', valor: ' resto' },
    ])
    expect(dividirEmSegmentos('começo https://exemplo.com')).toEqual([
      { tipo: 'texto', valor: 'começo ' },
      { tipo: 'link', valor: 'https://exemplo.com' },
    ])
  })

  it('tira pontuação de frase colada no fim da URL', () => {
    expect(dividirEmSegmentos('olha isso: https://exemplo.com/x, é bom.')).toEqual([
      { tipo: 'texto', valor: 'olha isso: ' },
      { tipo: 'link', valor: 'https://exemplo.com/x' },
      { tipo: 'texto', valor: ', é bom.' },
    ])
  })

  it('não confunde parênteses de contexto com parte da URL', () => {
    expect(dividirEmSegmentos('(veja https://exemplo.com/a)')).toEqual([
      { tipo: 'texto', valor: '(veja ' },
      { tipo: 'link', valor: 'https://exemplo.com/a' },
      { tipo: 'texto', valor: ')' },
    ])
  })

  it('reconhece mais de uma URL', () => {
    expect(dividirEmSegmentos('https://a.com e https://b.com')).toEqual([
      { tipo: 'link', valor: 'https://a.com' },
      { tipo: 'texto', valor: ' e ' },
      { tipo: 'link', valor: 'https://b.com' },
    ])
  })

  it('texto vazio devolve lista vazia', () => {
    expect(dividirEmSegmentos('')).toEqual([])
  })
})
