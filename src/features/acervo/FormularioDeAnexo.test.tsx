import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { TipoDeItem } from '@/core'

import { FormularioDeAnexo } from './FormularioDeAnexo'

// O formulário importa a store (via a miniatura), e a store sobe o Worker do motor —
// que não existe no jsdom. Aqui só se testa o formulário.
vi.mock('@/store/palacio', () => ({ usePalacio: () => vi.fn() }))

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
