import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { nomeDoBackup, salvarTexto } from './arquivos'

/** O navegador de teste não tem toque nem folha de compartilhar: cada caso monta o que precisa. */
function montarNavegador({ toque, compartilha }: { toque: boolean; compartilha: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: toque })),
  )
  const share = vi.fn<(dados: ShareData) => Promise<void>>()
  Object.defineProperty(navigator, 'share', {
    value: compartilha ? share : undefined,
    configurable: true,
  })
  Object.defineProperty(navigator, 'canShare', {
    value: compartilha ? vi.fn(() => true) : undefined,
    configurable: true,
  })
  return share
}

describe('salvarTexto', () => {
  const cliques = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:teste'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(cliques)
    cliques.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('no desktop baixa o arquivo, mesmo que o navegador saiba compartilhar', async () => {
    const share = montarNavegador({ toque: false, compartilha: true })

    expect(await salvarTexto('a.json', '{}')).toEqual({ tipo: 'download' })
    expect(share).not.toHaveBeenCalled()
    expect(cliques).toHaveBeenCalledOnce()
  })

  it('no toque abre a folha de compartilhar com o arquivo', async () => {
    const share = montarNavegador({ toque: true, compartilha: true })
    share.mockResolvedValue()

    expect(await salvarTexto('a.json', '{"x":1}')).toEqual({ tipo: 'compartilhado' })
    const dados = share.mock.calls[0]![0]
    expect(dados.files?.[0]?.name).toBe('a.json')
    expect(cliques).not.toHaveBeenCalled()
  })

  it('fechar a folha sem escolher é desistir, não baixar nem falhar', async () => {
    const share = montarNavegador({ toque: true, compartilha: true })
    share.mockRejectedValue(new DOMException('fechou', 'AbortError'))

    expect(await salvarTexto('a.json', '{}')).toEqual({ tipo: 'cancelado' })
    expect(cliques).not.toHaveBeenCalled()
  })

  it('se o navegador recusa compartilhar (o toque ficou longe), baixa', async () => {
    const share = montarNavegador({ toque: true, compartilha: true })
    share.mockRejectedValue(new DOMException('sem toque', 'NotAllowedError'))

    expect(await salvarTexto('a.json', '{}')).toEqual({ tipo: 'download' })
    expect(cliques).toHaveBeenCalledOnce()
  })

  it('sem Web Share baixa, também no toque', async () => {
    montarNavegador({ toque: true, compartilha: false })

    expect(await salvarTexto('a.json', '{}')).toEqual({ tipo: 'download' })
  })
})

describe('nomeDoBackup', () => {
  it('leva a data no nome', () => {
    expect(nomeDoBackup(new Date('2026-10-15T12:00:00Z'))).toBe('locus-2026-10-15.json')
  })
})
