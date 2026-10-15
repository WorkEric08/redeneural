import { describe, expect, it } from 'vitest'

import { nomeDoAnexo, textoDoAnexo } from './anexo'

describe('textoDoAnexo', () => {
  it('junta o título e a legenda, como o pensamento lê "título. conteúdo"', () => {
    expect(textoDoAnexo({ titulo: 'Memória', legenda: 'Um diagrama' })).toBe('Memória. Um diagrama')
  })

  it('só com um dos dois, é esse', () => {
    expect(textoDoAnexo({ titulo: 'Memória', legenda: '  ' })).toBe('Memória')
    expect(textoDoAnexo({ titulo: '', legenda: 'Um diagrama' })).toBe('Um diagrama')
  })

  it('sem nenhum, é vazio: o item fica só na pasta', () => {
    expect(textoDoAnexo({ titulo: ' ', legenda: '' })).toBe('')
  })
})

describe('nomeDoAnexo', () => {
  it('é o título, e a legenda num item de antes dos títulos', () => {
    expect(nomeDoAnexo({ titulo: ' Memória ', legenda: 'Um diagrama' })).toBe('Memória')
    expect(nomeDoAnexo({ titulo: '', legenda: ' Um diagrama ' })).toBe('Um diagrama')
    expect(nomeDoAnexo({ titulo: '', legenda: '' })).toBe('')
  })
})
