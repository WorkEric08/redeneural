import { describe, expect, it } from 'vitest'

import { MODO_DA_BUSCA_PADRAO, modoDaBuscaOuPadrao } from './modoDaBusca'

describe('modoDaBuscaOuPadrao', () => {
  it('aceita os dois modos', () => {
    expect(modoDaBuscaOuPadrao('sentido')).toBe('sentido')
    expect(modoDaBuscaOuPadrao('exata')).toBe('exata')
  })

  it('um valor desconhecido, ou nenhum, vale o padrão', () => {
    expect(modoDaBuscaOuPadrao(undefined)).toBe(MODO_DA_BUSCA_PADRAO)
    expect(modoDaBuscaOuPadrao('palavra')).toBe(MODO_DA_BUSCA_PADRAO)
  })
})
