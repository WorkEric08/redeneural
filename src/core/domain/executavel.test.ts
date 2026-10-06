import { describe, expect, it } from 'vitest'

import {
  andamentoDoLivro,
  clampDiasParaAdormecer,
  DIAS_PARA_ADORMECER_MAXIMO,
  DIAS_PARA_ADORMECER_PADRAO,
  entraEmExecutavel,
  estaAdormecida,
  estadoAoGuardar,
  estadoVisivel,
  MS_POR_DIA,
} from './executavel'
import type { EstadoDaIdeia } from './types'

const EXECUTAVEL = { id: 'exe', executavel: true }
const OUTRO_EXECUTAVEL = { id: 'exe-2', executavel: true }
const PENSAMENTOS = { id: 'psi', executavel: false }

describe('entraEmExecutavel', () => {
  it('nascer, sair do porto ou de outro livro para um executável é entrar', () => {
    expect(entraEmExecutavel(undefined, EXECUTAVEL)).toBe(true)
    expect(entraEmExecutavel(null, EXECUTAVEL)).toBe(true)
    expect(entraEmExecutavel('psi', EXECUTAVEL)).toBe(true)
    expect(entraEmExecutavel('exe-2', EXECUTAVEL)).toBe(true)
  })

  it('continuar no mesmo livro, ou ir para um que não é executável, não é', () => {
    expect(entraEmExecutavel('exe', EXECUTAVEL)).toBe(false)
    expect(entraEmExecutavel('exe', PENSAMENTOS)).toBe(false)
    expect(entraEmExecutavel(undefined, undefined)).toBe(false)
  })
})

describe('estadoAoGuardar', () => {
  it('entrar num executável começa em "para fazer", seja qual for o estado de antes', () => {
    expect(estadoAoGuardar(undefined, EXECUTAVEL)).toBe('para_fazer')
    expect(estadoAoGuardar({ livroId: 'psi', estado: null }, EXECUTAVEL)).toBe('para_fazer')
    expect(estadoAoGuardar({ livroId: 'exe-2', estado: 'feita' }, EXECUTAVEL)).toBe('para_fazer')
  })

  it('continuar no mesmo executável mantém o que tinha', () => {
    expect(estadoAoGuardar({ livroId: 'exe', estado: 'fazendo' }, EXECUTAVEL)).toBe('fazendo')
    expect(estadoAoGuardar({ livroId: 'exe', estado: null }, EXECUTAVEL)).toBe('para_fazer')
  })

  it('sair para um livro de pensamentos guarda o estado, sem perder nada', () => {
    expect(estadoAoGuardar({ livroId: 'exe', estado: 'feita' }, PENSAMENTOS)).toBe('feita')
    expect(estadoAoGuardar(undefined, PENSAMENTOS)).toBeNull()
  })

  it('trocar de um executável para outro também é entrar', () => {
    expect(estadoAoGuardar({ livroId: 'exe', estado: 'fazendo' }, OUTRO_EXECUTAVEL)).toBe(
      'para_fazer',
    )
  })
})

describe('estadoVisivel', () => {
  it('só aparece num livro executável', () => {
    expect(estadoVisivel({ estado: 'feita' }, EXECUTAVEL)).toBe('feita')
    expect(estadoVisivel({ estado: null }, EXECUTAVEL)).toBe('para_fazer')
    expect(estadoVisivel({ estado: 'feita' }, PENSAMENTOS)).toBeNull()
    expect(estadoVisivel({ estado: 'feita' }, undefined)).toBeNull()
  })
})

describe('estaAdormecida', () => {
  const agora = new Date('2026-10-01T12:00:00.000Z')
  const ha = (dias: number): Date => new Date(agora.getTime() - dias * MS_POR_DIA)
  const livro = { executavel: true, diasParaAdormecer: 30 }

  it('parada mais que os dias do livro, adormece', () => {
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: ha(31) }, livro, agora)).toBe(true)
    expect(estaAdormecida({ estado: 'fazendo', ultimoToque: ha(31) }, livro, agora)).toBe(true)
    expect(estaAdormecida({ estado: null, ultimoToque: ha(31) }, livro, agora)).toBe(true)
  })

  it('dentro do prazo, ou exatamente nele, continua acordada', () => {
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: ha(29) }, livro, agora)).toBe(false)
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: ha(30) }, livro, agora)).toBe(false)
  })

  it('feita nunca adormece', () => {
    expect(estaAdormecida({ estado: 'feita', ultimoToque: ha(400) }, livro, agora)).toBe(false)
  })

  it('só num livro executável', () => {
    const pensamentos = { executavel: false, diasParaAdormecer: 30 }
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: ha(400) }, pensamentos, agora)).toBe(
      false,
    )
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: ha(400) }, undefined, agora)).toBe(
      false,
    )
  })

  it('com 0 dias adormece logo depois de qualquer toque, para testar', () => {
    const teste = { executavel: true, diasParaAdormecer: 0 }
    const toque = new Date(agora.getTime() - 1)
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: toque }, teste, agora)).toBe(true)
    expect(estaAdormecida({ estado: 'para_fazer', ultimoToque: agora }, teste, agora)).toBe(false)
  })
})

describe('clampDiasParaAdormecer', () => {
  it('dias inteiros entre zero e um ano', () => {
    expect(clampDiasParaAdormecer(0)).toBe(0)
    expect(clampDiasParaAdormecer(7.6)).toBe(8)
    expect(clampDiasParaAdormecer(-3)).toBe(0)
    expect(clampDiasParaAdormecer(9999)).toBe(DIAS_PARA_ADORMECER_MAXIMO)
    expect(clampDiasParaAdormecer(Number.NaN)).toBe(DIAS_PARA_ADORMECER_PADRAO)
  })
})

describe('andamentoDoLivro', () => {
  const AGORA = new Date('2026-10-06T12:00:00.000Z')
  const dias = (n: number): Date => new Date(AGORA.getTime() - n * MS_POR_DIA)
  const LIVRO = { executavel: true, diasParaAdormecer: 30 }

  const ideia = (estado: EstadoDaIdeia | null, paradaHa = 0) => ({
    estado,
    ultimoToque: dias(paradaHa),
  })

  it('livro que não é executável, ou sem ideia, não tem andamento', () => {
    expect(andamentoDoLivro({ ...LIVRO, executavel: false }, [ideia('fazendo')], AGORA)).toBeNull()
    expect(andamentoDoLivro(LIVRO, [], AGORA)).toBeNull()
  })

  it('fazendo: alguma ideia acordada está em andamento', () => {
    expect(andamentoDoLivro(LIVRO, [ideia('fazendo'), ideia('para_fazer')], AGORA)).toBe('fazendo')
  })

  it('feita: tem ideias e todas estão feitas', () => {
    expect(andamentoDoLivro(LIVRO, [ideia('feita'), ideia('feita', 90)], AGORA)).toBe('feita')
  })

  it('uma ideia por fazer tira o livro de feita', () => {
    expect(andamentoDoLivro(LIVRO, [ideia('feita'), ideia('para_fazer')], AGORA)).toBeNull()
  })

  it('adormecido: sobrou ideia por fazer e todas dormem, mesmo as feitas ao lado', () => {
    const dormindo = [ideia('para_fazer', 40), ideia('fazendo', 60), ideia('feita')]
    expect(andamentoDoLivro(LIVRO, dormindo, AGORA)).toBe('adormecido')
  })

  it('uma ideia acordada impede o livro de adormecer', () => {
    expect(
      andamentoDoLivro(LIVRO, [ideia('para_fazer', 40), ideia('para_fazer', 1)], AGORA),
    ).toBeNull()
  })

  it('uma ideia fazendo que adormeceu não conta como fazendo', () => {
    expect(andamentoDoLivro(LIVRO, [ideia('fazendo', 40), ideia('feita')], AGORA)).toBe(
      'adormecido',
    )
  })

  it('ideia sem estado, num livro que acabou de virar executável, está para fazer', () => {
    expect(andamentoDoLivro(LIVRO, [ideia(null)], AGORA)).toBeNull()
  })

  it('com 0 dias, adormece logo depois de qualquer toque', () => {
    const impaciente = { executavel: true, diasParaAdormecer: 0 }
    expect(andamentoDoLivro(impaciente, [ideia('fazendo', 1)], AGORA)).toBe('adormecido')
  })
})
