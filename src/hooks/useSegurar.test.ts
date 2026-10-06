import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSegurar } from './useSegurar'

/** Os eventos do React reduzidos ao que o hook lê. */
const ponteiro = (x = 0, y = 0, button = 0) => ({ clientX: x, clientY: y, button }) as never
const clique = () => {
  const preventDefault = vi.fn()
  return { evento: { preventDefault } as never, preventDefault }
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useSegurar', () => {
  it('segurar 380 ms chama o gesto uma vez, e o clique do fim é engolido', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))

    act(() => {
      result.current.onPointerDown(ponteiro())
      vi.advanceTimersByTime(379)
    })
    expect(aoSegurar).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(aoSegurar).toHaveBeenCalledTimes(1)

    result.current.onPointerUp()
    const { evento, preventDefault } = clique()
    result.current.onClick(evento)
    expect(preventDefault).toHaveBeenCalledTimes(1)

    // Só engole o clique daquele segurar: o toque seguinte é um toque de verdade.
    const outro = clique()
    result.current.onClick(outro.evento)
    expect(outro.preventDefault).not.toHaveBeenCalled()
  })

  it('soltar antes do tempo é um toque: não chama o gesto e não engole o clique', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))

    act(() => {
      result.current.onPointerDown(ponteiro())
      vi.advanceTimersByTime(200)
      result.current.onPointerUp()
      vi.advanceTimersByTime(1000)
    })
    expect(aoSegurar).not.toHaveBeenCalled()

    const { evento, preventDefault } = clique()
    result.current.onClick(evento)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('andar mais de 8 px é rolar ou arrastar, e não segurar', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))

    act(() => {
      result.current.onPointerDown(ponteiro(10, 10))
      result.current.onPointerMove(ponteiro(10, 25))
      vi.advanceTimersByTime(1000)
    })
    expect(aoSegurar).not.toHaveBeenCalled()
  })

  it('um tremor de até 8 px não cancela', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))

    act(() => {
      result.current.onPointerDown(ponteiro(10, 10))
      result.current.onPointerMove(ponteiro(14, 14))
      vi.advanceTimersByTime(400)
    })
    expect(aoSegurar).toHaveBeenCalledTimes(1)
  })

  it('o navegador tomar o gesto para rolar (pointercancel) apaga o tempo', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))

    act(() => {
      result.current.onPointerDown(ponteiro())
      result.current.onPointerCancel()
      vi.advanceTimersByTime(1000)
    })
    expect(aoSegurar).not.toHaveBeenCalled()
  })

  it('o botão direito chama o gesto pelo contextmenu, sem tempo nenhum', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))
    const preventDefault = vi.fn()

    act(() => {
      result.current.onPointerDown(ponteiro(0, 0, 2))
      result.current.onContextMenu({ preventDefault } as never)
    })
    expect(preventDefault).toHaveBeenCalled()
    expect(aoSegurar).toHaveBeenCalledTimes(1)
  })

  it('no toque, o contextmenu do meio do segurar não abre o menu duas vezes', () => {
    const aoSegurar = vi.fn()
    const { result } = renderHook(() => useSegurar(aoSegurar))
    const preventDefault = vi.fn()

    act(() => {
      result.current.onPointerDown(ponteiro())
      // Antes de 380 ms: o tempo ainda corre.
      result.current.onContextMenu({ preventDefault } as never)
      vi.advanceTimersByTime(400)
      // Depois: já segurou.
      result.current.onContextMenu({ preventDefault } as never)
    })
    expect(aoSegurar).toHaveBeenCalledTimes(1)
  })
})
