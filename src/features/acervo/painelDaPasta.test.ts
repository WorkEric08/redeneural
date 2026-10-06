import { describe, expect, it } from 'vitest'

import { lerPainelDaPasta } from './painelDaPasta'

const busca = (texto: string) => new URLSearchParams(texto)

describe('lerPainelDaPasta', () => {
  it('sem busca, nenhum painel', () => {
    expect(lerPainelDaPasta(busca(''))).toBeNull()
    expect(lerPainelDaPasta(busca('?outra=1'))).toBeNull()
  })

  it('?item= é o menu do item', () => {
    expect(lerPainelDaPasta(busca('?item=a1'))).toEqual({ tipo: 'acoes', anexoId: 'a1' })
  })

  it('?apagar= é a pergunta, e vence o menu se os dois vierem', () => {
    expect(lerPainelDaPasta(busca('?apagar=a1'))).toEqual({ tipo: 'apagar', anexoId: 'a1' })
    expect(lerPainelDaPasta(busca('?item=a1&apagar=a2'))).toEqual({
      tipo: 'apagar',
      anexoId: 'a2',
    })
  })

  it('um valor vazio não abre nada', () => {
    expect(lerPainelDaPasta(busca('?item='))).toBeNull()
  })
})
