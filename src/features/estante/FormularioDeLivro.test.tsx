import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { COR_PADRAO, ESTILO_PADRAO, PALETA_NOITE } from '@/core'
import type { NovoLivro } from '@/store/palacio'

import { FormularioDeLivro } from './FormularioDeLivro'

const INICIAL: NovoLivro = {
  titulo: '',
  cor: COR_PADRAO,
  estilo: ESTILO_PADRAO,
  emblema: null,
  larguraLombada: null,
  comprimentoLombada: null,
  executavel: false,
  diasParaAdormecer: 30,
}

function montar(inicial: NovoLivro = INICIAL) {
  const onEnviar = vi.fn()
  render(
    <FormularioDeLivro
      inicial={inicial}
      rotuloDeEnvio="Criar livro"
      intensidadeDaLuz={42}
      onEnviar={onEnviar}
    />,
  )
  return onEnviar
}

describe('FormularioDeLivro: cor e forma', () => {
  it('oferece as dez cores da paleta Noite, cada uma com o nome como rótulo', () => {
    montar()
    const cores = screen.getByRole('radiogroup', { name: 'Cor' })
    expect(cores.querySelectorAll('input[type=radio]')).toHaveLength(10)
    for (const t of PALETA_NOITE) {
      expect(screen.getByRole('radio', { name: t.nome })).toBeInTheDocument()
    }
  })

  it('oferece as dez formas, com o sólido marcado num livro novo', () => {
    montar()
    const formas = screen.getByRole('radiogroup', { name: 'Forma' })
    expect(formas.querySelectorAll('input[type=radio]')).toHaveLength(10)
    expect(screen.getByRole('radio', { name: 'Sólido' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Azul base' })).toBeChecked()
  })

  it('envia a cor e a forma escolhidas', async () => {
    const onEnviar = montar()
    const usuario = userEvent.setup()

    await usuario.type(screen.getByRole('textbox'), 'Psicologia')
    await usuario.click(screen.getByRole('radio', { name: 'Vinho' }))
    await usuario.click(screen.getByRole('radio', { name: 'Duas cores' }))
    await usuario.click(screen.getByRole('button', { name: 'Criar livro' }))

    expect(onEnviar).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Psicologia', cor: '#4A2540', estilo: 'duas-cores' }),
    )
  })

  it('editar carrega a cor e a forma do livro, e salva do mesmo jeito', async () => {
    const onEnviar = montar({
      ...INICIAL,
      titulo: 'Música',
      cor: '#F1EEE6',
      estilo: 'papel',
    })
    const usuario = userEvent.setup()

    expect(screen.getByRole('radio', { name: 'Creme' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Papel' })).toBeChecked()

    await usuario.click(screen.getByRole('radio', { name: 'Bloco' }))
    await usuario.click(screen.getByRole('button', { name: 'Criar livro' }))

    expect(onEnviar).toHaveBeenCalledWith(
      expect.objectContaining({ cor: '#F1EEE6', estilo: 'bloco' }),
    )
  })

  it('a amostra mostra a forma escolhida ao vivo, sem estado', async () => {
    const { container } = render(
      <FormularioDeLivro
        inicial={INICIAL}
        rotuloDeEnvio="Criar livro"
        intensidadeDaLuz={42}
        onEnviar={vi.fn()}
      />,
    )
    const usuario = userEvent.setup()
    const amostra = (): Element | null => container.querySelector('.lombada--amostra')

    expect(amostra()).toHaveAttribute('data-estilo', 'solido')
    await usuario.click(screen.getByRole('radio', { name: 'Faixa' }))
    expect(amostra()).toHaveAttribute('data-estilo', 'faixa')
    expect(amostra()).not.toHaveAttribute('data-ponte')
    expect(amostra()).not.toHaveAttribute('data-estado')
  })
})
