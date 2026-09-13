import { describe, expect, it } from 'vitest'

import { buscaDoPainel, lerPainel, type Painel } from './painel'

const ler = (busca: string): Painel | null => lerPainel(new URLSearchParams(busca))

describe('painel da estante na URL', () => {
  it('ida e volta sem perder nada', () => {
    const paineis: Painel[] = [
      { tipo: 'espiar', livroId: '382f8b34-7e8e-4074-ab84-ad134110b691' },
      { tipo: 'acoes', livroId: 'abc' },
      { tipo: 'editar', livroId: 'abc' },
      { tipo: 'apagar', livroId: 'abc' },
      { tipo: 'novo', prateleira: 0 },
      { tipo: 'novo', prateleira: 3 },
      { tipo: 'ordenar' },
    ]

    for (const p of paineis) expect(ler(buscaDoPainel(p))).toEqual(p)
  })

  it('estante sem busca não tem painel', () => {
    expect(ler('')).toBeNull()
  })

  // Um link colado errado não pode abrir painel de prateleira que não existe.
  it('ignora prateleira que não é número inteiro e positivo', () => {
    expect(ler('?novo=')).toBeNull()
    expect(ler('?novo=abc')).toBeNull()
    expect(ler('?novo=-1')).toBeNull()
    expect(ler('?novo=1.5')).toBeNull()
  })
})
