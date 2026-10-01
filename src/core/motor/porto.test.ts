import { describe, expect, it } from 'vitest'

import { no, vetor } from './fixtures'
import { perfilDoPalacio, type NoDoGrafo } from './grafo'
import { livroDoPorto } from './porto'

/** Três livros, cada um num canto: psi no eixo 0, prog no 4, mus no 8. */
const PALACIO: NoDoGrafo[] = [
  no('psi-1', 'psi', { 0: 1, 1: 0.2 }),
  no('psi-2', 'psi', { 0: 1, 2: 0.2 }),
  no('psi-3', 'psi', { 0: 1, 3: 0.2 }),
  no('prog-1', 'prog', { 4: 1, 5: 0.2 }),
  no('prog-2', 'prog', { 4: 1, 6: 0.2 }),
  no('prog-3', 'prog', { 4: 1, 7: 0.2 }),
  no('mus-1', 'mus', { 8: 1, 9: 0.2 }),
  no('mus-2', 'mus', { 8: 1, 10: 0.2 }),
  no('mus-3', 'mus', { 8: 1, 11: 0.2 }),
]
const PERFIL = perfilDoPalacio(PALACIO)

function novo(pares: Record<number, number>) {
  return { id: 'novo', embedding: vetor(pares) }
}

describe('livroDoPorto', () => {
  it('guarda no livro quando três dos cinco mais parecidos são dele', () => {
    expect(livroDoPorto(novo({ 4: 1, 5: 0.1 }), PALACIO, PERFIL)).toBe('prog')
  })

  it('pergunta quando os mais parecidos se dividem entre livros', () => {
    // Igualmente perto de psi e de prog: 3 de um e 2 do outro não acontece.
    const dividido = [...PALACIO.slice(0, 2), ...PALACIO.slice(3, 5), ...PALACIO.slice(6)]
    const perfil = perfilDoPalacio(dividido)
    expect(livroDoPorto(novo({ 0: 1, 4: 1 }), dividido, perfil)).toBeNull()
  })

  it('palácio pequeno demais para três votos sempre pergunta', () => {
    const pequeno = PALACIO.slice(0, 2)
    expect(livroDoPorto(novo({ 0: 1 }), pequeno, perfilDoPalacio(pequeno))).toBeNull()
  })

  it('o próprio neurônio não vota em si mesmo', () => {
    const comEle = [...PALACIO, { ...novo({ 8: 1 }), livroId: 'mus' }]
    expect(livroDoPorto(novo({ 4: 1, 5: 0.1 }), comEle, PERFIL)).toBe('prog')
  })

  it('livro excluído vota mas não vence — aí a pessoa escolhe', () => {
    expect(livroDoPorto(novo({ 4: 1, 5: 0.1 }), PALACIO, PERFIL, new Set(['prog']))).toBeNull()
  })

  it('neurônio no porto vota, mas não leva ninguém para lugar nenhum', () => {
    const comPorto = PALACIO.map((n) => (n.livroId === 'prog' ? { ...n, livroId: null } : n))
    expect(livroDoPorto(novo({ 4: 1, 5: 0.1 }), comPorto, PERFIL)).toBeNull()
  })

  it('não depende da ordem de entrada', () => {
    const alvo = novo({ 8: 1, 9: 0.1 })
    expect(livroDoPorto(alvo, [...PALACIO].reverse(), PERFIL)).toBe(
      livroDoPorto(alvo, PALACIO, PERFIL),
    )
  })
})
