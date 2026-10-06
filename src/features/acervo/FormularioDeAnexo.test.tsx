import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AnexoNaTela, TipoDeItem } from '@/core'

import { FormularioDeAnexo } from './FormularioDeAnexo'

// O formulário importa a store (via a miniatura), e a store sobe o Worker do motor —
// que não existe no jsdom. Aqui só se testa o formulário.
vi.mock('@/store/palacio', () => ({ usePalacio: () => vi.fn().mockResolvedValue(null) }))

function montar(opcoes: { tipoInicial?: TipoDeItem; cheios?: TipoDeItem[] } = {}) {
  const onCriar = vi.fn()
  render(
    <FormularioDeAnexo
      modo="novo"
      ocupado={false}
      tipoInicial={opcoes.tipoInicial}
      cheios={opcoes.cheios ?? []}
      onCriar={onCriar}
    />,
  )
  return onCriar
}

describe('FormularioDeAnexo: o tipo vem do "+" da pasta', () => {
  it('abre em Link por padrão', () => {
    montar()
    expect(screen.getByRole('button', { name: 'Link', pressed: true })).toBeInTheDocument()
  })

  it('abre em Imagem quando o "+" tocado foi o das imagens', () => {
    montar({ tipoInicial: 'imagem' })
    expect(screen.getByRole('button', { name: 'Imagem', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Escolher uma imagem')).toBeInTheDocument()
  })

  it('um tipo que encheu a pasta não se escolhe, e o outro continua livre', () => {
    montar({ cheios: ['imagem'] })
    expect(screen.getByRole('button', { name: 'Imagem' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Link' })).toBeEnabled()
  })

  it('guarda um link com a legenda', async () => {
    const onCriar = montar({ tipoInicial: 'link' })
    await userEvent.type(screen.getByPlaceholderText('https://…'), 'https://exemplo.com/a')
    await userEvent.type(screen.getByRole('textbox', { name: 'Legenda' }), 'Um artigo')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar na pasta' }))

    expect(onCriar).toHaveBeenCalledWith('Um artigo', {
      tipo: 'link',
      url: 'https://exemplo.com/a',
    })
  })
})

describe('FormularioDeAnexo: trocar um item da pasta', () => {
  const T0 = new Date('2026-01-01T12:00:00.000Z')
  const imagem: AnexoNaTela = {
    id: 'a1',
    livroId: 'p',
    legenda: 'Uma foto',
    midia: { tipo: 'imagem', mime: 'image/webp', largura: 40, altura: 20 },
    processando: false,
    createdAt: T0,
    updatedAt: T0,
  }
  const link: AnexoNaTela = {
    ...imagem,
    id: 'a2',
    legenda: 'Um artigo',
    midia: { tipo: 'link', url: 'https://exemplo.com/a' },
  }

  it('uma imagem se troca por outra: oferece "Trocar imagem", e salvar sem escolher mantém a atual', async () => {
    const onSalvar = vi.fn()
    render(<FormularioDeAnexo modo="editar" anexo={imagem} ocupado={false} onSalvar={onSalvar} />)

    expect(screen.getByRole('button', { name: 'Trocar imagem' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledWith('Uma foto', undefined, undefined)
  })

  it('um link se troca pelo endereço: vem preenchido e o tipo não muda', async () => {
    const onSalvar = vi.fn()
    render(<FormularioDeAnexo modo="editar" anexo={link} ocupado={false} onSalvar={onSalvar} />)

    const campo = screen.getByPlaceholderText('https://…')
    expect(campo).toHaveValue('https://exemplo.com/a')
    expect(screen.queryByRole('group', { name: 'O que guardar' })).not.toBeInTheDocument()

    await userEvent.clear(campo)
    await userEvent.type(campo, 'https://exemplo.com/b')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSalvar).toHaveBeenCalledWith('Um artigo', 'https://exemplo.com/b', undefined)
  })
})
