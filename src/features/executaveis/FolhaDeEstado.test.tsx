import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ImagemParaGuardar, NeuronioNaTela } from '@/core'
import { escolherImagem } from '@/services/native/midia'

import { FolhaDeEstado } from './FolhaDeEstado'

// O <dialog> nativo não existe no jsdom: o que importa aqui é o conteúdo.
vi.mock('@/components/Folha', () => ({
  Folha: ({ aberta, children }: { aberta: boolean; children: ReactNode }) =>
    aberta ? <div role="dialog">{children}</div> : null,
}))

// A miniatura da imagem do resultado pede os bytes à store, que sobe o Worker do motor —
// que não existe no jsdom. E o seletor de imagem é do navegador.
vi.mock('@/store/palacio', () => ({
  usePalacio: (seletor: (s: unknown) => unknown) =>
    seletor({ lerImagemDoResultado: vi.fn().mockResolvedValue(null) }),
}))
vi.mock('@/services/native/midia', () => ({ escolherImagem: vi.fn() }))

const TITULO_COMPRIDO =
  'Uma ideia parada com um título bem comprido para ver como a folha lida com ele sem cortar nada'

function ideia(titulo = TITULO_COMPRIDO, comImagem = false): NeuronioNaTela {
  const t0 = new Date('2026-01-01T12:00:00.000Z')
  return {
    id: 'n1',
    livroId: 'exe',
    titulo,
    conteudo: '',
    processando: false,
    estado: 'para_fazer',
    ultimoToque: t0,
    resultadoLink: null,
    resultadoImagem: comImagem ? { mime: 'image/webp', largura: 40, altura: 20 } : null,
    createdAt: t0,
    updatedAt: t0,
  }
}

function montar(estadoAtual: 'para_fazer' | 'fazendo' | 'feita' = 'para_fazer', comImagem = false) {
  const onDefinir = vi.fn<
    (
      estado: string,
      link: string | null,
      imagem: ImagemParaGuardar | null | undefined,
    ) => Promise<boolean>
  >(() => Promise.resolve(true))
  const onFechar = vi.fn()
  render(
    <FolhaDeEstado
      aberta
      neuronio={ideia(TITULO_COMPRIDO, comImagem)}
      estadoAtual={estadoAtual}
      onDefinir={onDefinir}
      onFechar={onFechar}
    />,
  )
  return { onDefinir, onFechar }
}

describe('FolhaDeEstado', () => {
  it('mostra o título inteiro, sem cortar com reticências', () => {
    montar()
    const titulo = screen.getByRole('heading', { name: TITULO_COMPRIDO })
    expect(titulo).toBeInTheDocument()
    expect(titulo.className).not.toContain('truncate')
  })

  it('põe as três opções numa fileira só, com a atual marcada', () => {
    montar('fazendo')
    const grupo = screen.getByRole('group', { name: 'Andamento' })
    const opcoes = Array.from(grupo.querySelectorAll('button'))
    expect(opcoes.map((b) => b.textContent)).toEqual(['Para fazer', 'Fazendo', 'Feita'])
    expect(screen.getByRole('button', { name: 'Fazendo' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('tocar "Fazendo" muda o andamento e fecha, sem link', async () => {
    const { onDefinir, onFechar } = montar()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Fazendo' }))
    expect(onDefinir).toHaveBeenCalledWith('fazendo', null, undefined)
    await vi.waitFor(() => {
      expect(onFechar).toHaveBeenCalled()
    })
  })

  it('tocar o andamento que já é o atual só fecha', async () => {
    const { onDefinir, onFechar } = montar('para_fazer')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Para fazer' }))
    expect(onDefinir).not.toHaveBeenCalled()
    expect(onFechar).toHaveBeenCalled()
  })

  it('"Feita" abre o link do resultado, e só então confirma', async () => {
    const { onDefinir } = montar()
    const usuario = userEvent.setup()

    expect(screen.queryByLabelText('Link do resultado')).not.toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Feita' }))
    expect(onDefinir).not.toHaveBeenCalled()

    await usuario.type(screen.getByLabelText('Link do resultado'), 'https://exemplo.com/resumo')
    await usuario.click(screen.getByRole('button', { name: 'Marcar como feita' }))
    expect(onDefinir).toHaveBeenCalledWith('feita', 'https://exemplo.com/resumo', undefined)
  })

  it('um link que não é http nem https trava a confirmação e explica', async () => {
    const { onDefinir } = montar()
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Feita' }))
    await usuario.type(screen.getByLabelText('Link do resultado'), 'javascript:alert(1)')

    expect(screen.getByText(/começa com http/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar como feita' })).toBeDisabled()
    expect(onDefinir).not.toHaveBeenCalled()
  })

  describe('a imagem do resultado', () => {
    const IMAGEM: ImagemParaGuardar = { bytes: new Uint8Array([1, 2, 3]), mime: 'image/png' }

    beforeEach(() => {
      vi.stubGlobal(
        'URL',
        Object.assign(URL, {
          createObjectURL: vi.fn(() => 'blob:previa'),
          revokeObjectURL: vi.fn(),
        }),
      )
      vi.mocked(escolherImagem).mockResolvedValue(IMAGEM)
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('"Feita" oferece adicionar uma imagem na mesma linha do link, e sem imagem não manda nenhuma', async () => {
      const { onDefinir } = montar()
      const usuario = userEvent.setup()

      await usuario.click(screen.getByRole('button', { name: 'Feita' }))
      expect(
        screen.getByRole('button', { name: 'Adicionar uma imagem do resultado' }),
      ).toBeVisible()
      expect(
        screen.queryByRole('button', { name: 'Tirar a imagem do resultado' }),
      ).not.toBeInTheDocument()

      await usuario.click(screen.getByRole('button', { name: 'Marcar como feita' }))
      expect(onDefinir).toHaveBeenCalledWith('feita', null, undefined)
    })

    it('escolher uma imagem a leva junto com o andamento, e ela ganha o "tirar"', async () => {
      const { onDefinir } = montar()
      const usuario = userEvent.setup()

      await usuario.click(screen.getByRole('button', { name: 'Feita' }))
      await usuario.click(screen.getByRole('button', { name: 'Adicionar uma imagem do resultado' }))
      expect(
        await screen.findByRole('button', { name: 'Trocar a imagem do resultado' }),
      ).toBeVisible()
      expect(screen.getByRole('button', { name: 'Tirar a imagem do resultado' })).toBeVisible()

      await usuario.click(screen.getByRole('button', { name: 'Marcar como feita' }))
      expect(onDefinir).toHaveBeenCalledWith('feita', null, {
        bytes: IMAGEM.bytes,
        mime: 'image/png',
      })
    })

    it('fechar o seletor sem escolher nada não muda nada', async () => {
      vi.mocked(escolherImagem).mockResolvedValue(null)
      const { onDefinir } = montar()
      const usuario = userEvent.setup()

      await usuario.click(screen.getByRole('button', { name: 'Feita' }))
      await usuario.click(screen.getByRole('button', { name: 'Adicionar uma imagem do resultado' }))
      await usuario.click(screen.getByRole('button', { name: 'Marcar como feita' }))
      expect(onDefinir).toHaveBeenCalledWith('feita', null, undefined)
    })

    it('uma ideia que já tem imagem a mostra; salvar sem mexer mantém, e tirar a apaga', async () => {
      const { onDefinir } = montar('feita', true)
      const usuario = userEvent.setup()

      expect(screen.getByRole('button', { name: 'Tirar a imagem do resultado' })).toBeVisible()
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
      expect(onDefinir).toHaveBeenLastCalledWith('feita', null, undefined)

      await usuario.click(screen.getByRole('button', { name: 'Tirar a imagem do resultado' }))
      expect(
        screen.getByRole('button', { name: 'Adicionar uma imagem do resultado' }),
      ).toBeVisible()
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }))
      expect(onDefinir).toHaveBeenLastCalledWith('feita', null, null)
    })
  })
})
