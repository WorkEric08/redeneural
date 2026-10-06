import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VisorDeImagens, type ImagemDoVisor } from './VisorDeImagens'

const IMAGENS: ImagemDoVisor[] = [
  { id: 'a', mime: 'image/png', rotulo: 'Foto A' },
  { id: 'b', mime: 'image/png', rotulo: 'Foto B' },
  { id: 'c', mime: 'image/png', rotulo: 'Foto C' },
]

beforeEach(() => {
  // O <dialog> nativo e os endereços de arquivo não existem no jsdom.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }),
  )
})

function montar(indice: number, imagens: ImagemDoVisor[] = IMAGENS) {
  const onIndice = vi.fn()
  const onFechar = vi.fn()
  const carregar = vi.fn<(id: string) => Promise<Uint8Array | null>>(() =>
    Promise.resolve(new Uint8Array([1, 2, 3])),
  )
  render(
    <VisorDeImagens
      aberto
      imagens={imagens}
      indice={indice}
      onIndice={onIndice}
      carregar={carregar}
      onFechar={onFechar}
    />,
  )
  return { onIndice, onFechar, carregar }
}

describe('VisorDeImagens', () => {
  it('com várias imagens mostra o contador e as duas setas', () => {
    montar(1)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imagem anterior' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Próxima imagem' })).toBeEnabled()
  })

  it('com uma imagem só não há contador nem setas', () => {
    montar(0, [IMAGENS[0]!])
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Imagem anterior' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Próxima imagem' })).not.toBeInTheDocument()
  })

  it('no começo a anterior fica desabilitada, e no fim a próxima', () => {
    montar(0)
    expect(screen.getByRole('button', { name: 'Imagem anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima imagem' })).toBeEnabled()
  })

  it('as setas pedem a imagem vizinha', async () => {
    const { onIndice } = montar(1)
    await userEvent.click(screen.getByRole('button', { name: 'Próxima imagem' }))
    expect(onIndice).toHaveBeenLastCalledWith(2)
    await userEvent.click(screen.getByRole('button', { name: 'Imagem anterior' }))
    expect(onIndice).toHaveBeenLastCalledWith(0)
  })

  it('as teclas ← e → também trocam, e nunca passam das pontas', async () => {
    const { onIndice } = montar(1)
    await userEvent.keyboard('{ArrowRight}')
    expect(onIndice).toHaveBeenLastCalledWith(2)
    await userEvent.keyboard('{ArrowLeft}')
    expect(onIndice).toHaveBeenLastCalledWith(0)
  })

  it('no fim, → não faz nada', async () => {
    const { onIndice } = montar(2)
    await userEvent.keyboard('{ArrowRight}')
    expect(onIndice).not.toHaveBeenCalled()
  })

  it('o × fecha', async () => {
    const { onFechar } = montar(0)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar a imagem' }))
    expect(onFechar).toHaveBeenCalledTimes(1)
  })

  it('só desenha a imagem à mostra e as vizinhas — as outras não carregam', async () => {
    const { carregar } = montar(0)
    await vi.waitFor(() => {
      expect(carregar).toHaveBeenCalledTimes(2)
    })
    expect(carregar.mock.calls.map(([id]) => id).sort()).toEqual(['a', 'b'])
  })

  it('a imagem à mostra carrega e aparece com o rótulo dela', async () => {
    montar(1)
    expect(await screen.findByAltText('Foto B')).toBeInTheDocument()
  })

  it('fechado, não desenha nada dentro', () => {
    render(
      <VisorDeImagens
        aberto={false}
        imagens={IMAGENS}
        indice={0}
        onIndice={vi.fn()}
        carregar={() => Promise.resolve(null)}
        onFechar={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Fechar a imagem' })).not.toBeInTheDocument()
  })
})
