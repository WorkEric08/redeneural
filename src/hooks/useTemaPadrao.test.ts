import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useTemaPadrao } from './useTemaPadrao'

afterEach(() => {
  delete document.documentElement.dataset.tema
})

describe('useTemaPadrao', () => {
  it('é falso no Clássico e sem tema ligado', () => {
    expect(renderHook(() => useTemaPadrao()).result.current).toBe(false)

    document.documentElement.dataset.tema = 'classico'
    expect(renderHook(() => useTemaPadrao()).result.current).toBe(false)
  })

  it('é verdadeiro nas duas versões do Padrão', () => {
    document.documentElement.dataset.tema = 'padrao-claro'
    expect(renderHook(() => useTemaPadrao()).result.current).toBe(true)

    document.documentElement.dataset.tema = 'padrao-escuro'
    expect(renderHook(() => useTemaPadrao()).result.current).toBe(true)
  })

  it('acompanha a troca de tema sem recarregar', async () => {
    const { result } = renderHook(() => useTemaPadrao())
    expect(result.current).toBe(false)

    await act(async () => {
      document.documentElement.dataset.tema = 'padrao-escuro'
      await Promise.resolve()
    })
    expect(result.current).toBe(true)

    await act(async () => {
      document.documentElement.dataset.tema = 'classico'
      await Promise.resolve()
    })
    expect(result.current).toBe(false)
  })

  it('um valor desconhecido vale o Clássico', () => {
    document.documentElement.dataset.tema = 'noite'
    expect(renderHook(() => useTemaPadrao()).result.current).toBe(false)
  })
})
