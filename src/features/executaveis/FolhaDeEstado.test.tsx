import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { NeuronioNaTela } from '@/core'

import { FolhaDeEstado } from './FolhaDeEstado'

// O <dialog> nativo não existe no jsdom: o que importa aqui é o conteúdo.
vi.mock('@/components/Folha', () => ({
  Folha: ({ aberta, children }: { aberta: boolean; children: ReactNode }) =>
    aberta ? <div role="dialog">{children}</div> : null,
}))

const TITULO_COMPRIDO =
  'Uma ideia parada com um título bem comprido para ver como a folha lida com ele sem cortar nada'

function ideia(titulo = TITULO_COMPRIDO): NeuronioNaTela {
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
    createdAt: t0,
    updatedAt: t0,
  }
}

function montar(estadoAtual: 'para_fazer' | 'fazendo' | 'feita' = 'para_fazer') {
  const onDefinir = vi.fn<(estado: string, link: string | null) => Promise<boolean>>(() =>
    Promise.resolve(true),
  )
  const onFechar = vi.fn()
  render(
    <FolhaDeEstado
      aberta
      neuronio={ideia()}
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
    expect(onDefinir).toHaveBeenCalledWith('fazendo', null)
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
    expect(onDefinir).toHaveBeenCalledWith('feita', 'https://exemplo.com/resumo')
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
})
