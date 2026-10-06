import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useVisorNaUrl } from './useVisorNaUrl'

const IDS = ['a', 'b', 'c']

function montar(entradas: string[], ids: readonly string[] = IDS) {
  const embrulho = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={entradas} initialIndex={entradas.length - 1}>
      {children}
    </MemoryRouter>
  )
  return renderHook(() => ({ visor: useVisorNaUrl(ids), local: useLocation() }), {
    wrapper: embrulho,
  })
}

describe('useVisorNaUrl', () => {
  it('sem ?ver= o visor está fechado', () => {
    const { result } = montar(['/anexo/a'])
    expect(result.current.visor.aberto).toBe(false)
  })

  it('?ver= com uma imagem da lista abre nela', () => {
    const { result } = montar(['/anexo/a?ver=b'])
    expect(result.current.visor.aberto).toBe(true)
    expect(result.current.visor.indice).toBe(1)
  })

  it('um ?ver= que não está na lista (a imagem foi apagada) é visor fechado', () => {
    const { result } = montar(['/anexo/a?ver=zzz'])
    expect(result.current.visor.aberto).toBe(false)
    expect(result.current.visor.indice).toBe(0)
  })

  it('abrir põe o id na URL, numa entrada nova do histórico', () => {
    const { result } = montar(['/anexo/a'])
    act(() => {
      result.current.visor.abrir('c')
    })
    expect(result.current.local.search).toBe('?ver=c')
    expect(result.current.visor.aberto).toBe(true)
    expect(result.current.visor.indice).toBe(2)
  })

  it('trocar muda a imagem sem empilhar histórico: voltar sai do visor, não passa foto a foto', () => {
    const { result } = montar(['/anexo/a'])
    act(() => {
      result.current.visor.abrir('a')
    })
    act(() => {
      result.current.visor.trocar(1)
    })
    act(() => {
      result.current.visor.trocar(2)
    })
    expect(result.current.local.search).toBe('?ver=c')
  })

  it('trocar para um índice que não existe não faz nada', () => {
    const { result } = montar(['/anexo/a?ver=a'])
    act(() => {
      result.current.visor.trocar(9)
    })
    expect(result.current.local.search).toBe('?ver=a')
  })

  it('fechar, num app aberto direto no visor (sem tela antes), tira o ?ver= no lugar', () => {
    const { result } = montar(['/anexo/a?ver=b'])
    act(() => {
      result.current.visor.fechar()
    })
    expect(result.current.local.search).toBe('')
    expect(result.current.visor.aberto).toBe(false)
  })
})
