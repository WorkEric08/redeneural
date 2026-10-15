import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Livro } from '@/core'

import { Formulario } from './Formulario'

function livro(id: string, titulo: string): Livro {
  return {
    id,
    tipo: 'conceitos',
    titulo,
    cor: '#1B2A6B',
    estilo: 'solido',
    prateleira: 0,
    ordem: 0,
    orientacao: 'em-pe',
    nivel: 0,
    emblema: null,
    larguraLombada: null,
    comprimentoLombada: null,
    executavel: false,
    diasParaAdormecer: 30,
    createdAt: new Date('2026-01-01T12:00:00Z'),
  }
}

const LIVROS = [livro('a', 'Experiências'), livro('b', 'Viagens')]

beforeEach(() => {
  // O <dialog> nativo, o medidor de tamanho e as consultas de tela não existem no jsdom.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  )
})

function Endereco() {
  const { search } = useLocation()
  return <output aria-label="endereço">{search}</output>
}

function montar(busca: string, inicial?: { livroId: string }) {
  render(
    <MemoryRouter initialEntries={[`/novo${busca}`]}>
      <Formulario
        livros={LIVROS}
        {...(inicial ? { inicial: { ...inicial, titulo: '', conteudo: '' } } : {})}
        automatico
        ocupado={false}
        rotuloDeEnvio="Criar pensamento"
        voltarPara="/"
        onEnviar={vi.fn()}
      />
      <Endereco />
    </MemoryRouter>,
  )
}

describe('Formulario: a escolha de livro', () => {
  it('abrir a escolha não perde o livro sugerido da URL', async () => {
    montar('?livro=a', { livroId: 'a' })

    await userEvent.click(screen.getByRole('button', { name: 'Livro: Experiências' }))

    // O `?livro=` fica: é dele que a tela de escrever (Novo.tsx) lê o livro sugerido, e sem ele o
    // formulário se refazia em "Automático".
    expect(screen.getByLabelText('endereço').textContent).toBe('?livro=a&livros=1')
  })

  it('o livro do formulário aparece marcado na escolha', async () => {
    montar('?livro=a', { livroId: 'a' })

    await userEvent.click(screen.getByRole('button', { name: 'Livro: Experiências' }))

    const marcados = screen
      .getAllByRole('button', { pressed: true })
      .map((b) => b.textContent.trim())
    expect(marcados).toContain('Experiências')
    expect(marcados).not.toContain('Viagens')
  })

  it('sem livro sugerido, "Automático" é o marcado', async () => {
    montar('')

    await userEvent.click(screen.getByRole('button', { name: 'Livro: Automático' }))

    expect(screen.getByLabelText('endereço').textContent).toBe('?livros=1')
    const marcados = screen
      .getAllByRole('button', { pressed: true })
      .map((b) => b.textContent.trim())
    expect(marcados.some((t) => t.startsWith('Automático'))).toBe(true)
  })
})
