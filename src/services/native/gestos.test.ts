import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { travarGestosDeNavegador } from './gestos'

/** O jsdom não tem `matchMedia`, e é ele que diz se quem aponta é o dedo. */
function quemAponta(ponteiro: 'coarse' | 'fine'): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: consulta.includes(ponteiro) }))
}

function segurarODedoEm(html: string): boolean {
  document.body.innerHTML = html
  const alvo = document.body.firstElementChild!
  const evento = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
  alvo.dispatchEvent(evento)
  return evento.defaultPrevented
}

beforeAll(() => {
  travarGestosDeNavegador()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('gestos de navegador', () => {
  it('no toque, segurar um link não abre o menu do navegador', () => {
    quemAponta('coarse')
    expect(segurarODedoEm('<a href="/novo">Novo neurônio</a>')).toBe(true)
  })

  it('no toque, o texto escrito pela pessoa continua copiável', () => {
    quemAponta('coarse')
    expect(segurarODedoEm('<p class="texto-do-usuario">o que eu escrevi</p>')).toBe(false)
  })

  it('no toque, o menu de colar continua dentro do campo', () => {
    quemAponta('coarse')
    expect(segurarODedoEm('<textarea></textarea>')).toBe(false)
  })

  it('no mouse, o botão direito continua inteiro', () => {
    quemAponta('fine')
    expect(segurarODedoEm('<a href="/novo">Novo neurônio</a>')).toBe(false)
  })
})
