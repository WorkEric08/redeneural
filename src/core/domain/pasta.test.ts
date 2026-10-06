import { describe, expect, it } from 'vitest'

import { pastaCheia, restantesNaPasta } from './pasta'

const imagem = (livroId: string) => ({ livroId, midia: { tipo: 'imagem' as const } })
const link = (livroId: string) => ({ livroId, midia: { tipo: 'link' as const } })

describe('restantesNaPasta', () => {
  it('uma pasta vazia comporta 8 imagens e 8 links', () => {
    expect(restantesNaPasta([], 'p')).toEqual({ imagem: 8, link: 8 })
  })

  it('desce a cada item guardado, cada tipo na sua conta', () => {
    const anexos = [imagem('p'), imagem('p'), imagem('p'), link('p')]
    expect(restantesNaPasta(anexos, 'p')).toEqual({ imagem: 5, link: 7 })
  })

  it('só conta os itens da pasta pedida', () => {
    const anexos = [imagem('outra'), link('outra'), imagem('p')]
    expect(restantesNaPasta(anexos, 'p')).toEqual({ imagem: 7, link: 8 })
  })

  it('chega a 0 com 8 e nunca fica negativo numa pasta que já passava do limite', () => {
    const oito = Array.from({ length: 8 }, () => imagem('p'))
    expect(restantesNaPasta(oito, 'p').imagem).toBe(0)
    expect(restantesNaPasta([...oito, imagem('p'), imagem('p')], 'p').imagem).toBe(0)
  })

  it('um tipo cheio não tira vaga do outro', () => {
    const oito = Array.from({ length: 8 }, () => imagem('p'))
    expect(restantesNaPasta(oito, 'p')).toEqual({ imagem: 0, link: 8 })
  })
})

describe('pastaCheia', () => {
  it('diz de qual tipo é o limite', () => {
    expect(pastaCheia('imagem')).toMatch(/8 imagens/)
    expect(pastaCheia('link')).toMatch(/8 links/)
  })
})
