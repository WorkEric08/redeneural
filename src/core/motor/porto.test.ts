import { describe, expect, it } from 'vitest'

import { no, vetor } from './fixtures'
import { perfilDoPalacio, type NoDoGrafo } from './grafo'
import { livroAutomatico } from './porto'

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
const TODOS = ['psi', 'prog', 'mus']

function novo(pares: Record<number, number>) {
  return { id: 'novo', embedding: vetor(pares) }
}

describe('livroAutomatico', () => {
  it('vai para o livro dos vizinhos mais parecidos', () => {
    expect(livroAutomatico(novo({ 4: 1, 5: 0.1 }), PALACIO, PERFIL, TODOS)).toBe('prog')
    expect(livroAutomatico(novo({ 8: 1, 9: 0.1 }), PALACIO, PERFIL, TODOS)).toBe('mus')
  })

  it('nunca devolve o porto: mesmo dividido entre dois livros, escolhe um', () => {
    // Igualmente perto de psi e de prog — antes, sem 3 votos, isto ia para o porto.
    const dividido = [...PALACIO.slice(0, 2), ...PALACIO.slice(3, 5), ...PALACIO.slice(6)]
    const perfil = perfilDoPalacio(dividido)
    const escolhido = livroAutomatico(novo({ 0: 1, 4: 1 }), dividido, perfil, TODOS)
    expect(['psi', 'prog']).toContain(escolhido)
  })

  it('dividido, vence o livro com mais votos entre os cinco', () => {
    const alvo = novo({ 0: 1, 4: 0.9 })
    // 3 de psi e 2 de prog entre os cinco mais parecidos.
    const nos = [...PALACIO.slice(0, 3), ...PALACIO.slice(3, 5)]
    const perfil = perfilDoPalacio(nos)
    expect(livroAutomatico(alvo, nos, perfil, TODOS)).toBe('psi')
  })

  it('palácio pequeno: com poucos neurônios o mais parecido já decide', () => {
    const pequeno = PALACIO.slice(0, 2)
    expect(livroAutomatico(novo({ 0: 1 }), pequeno, perfilDoPalacio(pequeno), TODOS)).toBe('psi')
  })

  it('empate de votos: o livro mais perto do texto', () => {
    // Um voto de cada: o texto está bem mais perto de prog.
    const dois = [no('psi-1', 'psi', { 0: 1, 1: 0.9 }), no('prog-1', 'prog', { 4: 1, 5: 0.1 })]
    const perfil = perfilDoPalacio(dois)
    expect(livroAutomatico(novo({ 4: 1, 5: 0.1 }), dois, perfil, TODOS)).toBe('prog')
  })

  it('palácio sem neurônio nenhum para votar: o primeiro livro da estante', () => {
    expect(livroAutomatico(novo({ 0: 1 }), [], PERFIL, ['mus', 'psi'])).toBe('mus')
  })

  it('o próprio neurônio não vota em si mesmo', () => {
    const comEle = [...PALACIO, { ...novo({ 8: 1 }), livroId: 'mus' }]
    expect(livroAutomatico(novo({ 4: 1, 5: 0.1 }), comEle, PERFIL, TODOS)).toBe('prog')
  })

  it('livro que não pode receber (executável) não vota nem vence: vai para o que mais se parece entre os outros', () => {
    // O texto é de programação, mas prog não está entre os disponíveis.
    const escolhido = livroAutomatico(novo({ 4: 1, 5: 0.1 }), PALACIO, PERFIL, ['psi', 'mus'])
    expect(['psi', 'mus']).toContain(escolhido)
    expect(escolhido).not.toBe('prog')
  })

  it('neurônio no porto não vota', () => {
    const comPorto = PALACIO.map((n) => (n.livroId === 'prog' ? { ...n, livroId: null } : n))
    const escolhido = livroAutomatico(novo({ 4: 1, 5: 0.1 }), comPorto, PERFIL, TODOS)
    expect(escolhido).not.toBeNull()
    expect(escolhido).not.toBe('prog')
  })

  it('sem nenhum livro que possa receber, não há o que escolher: null', () => {
    expect(livroAutomatico(novo({ 0: 1 }), PALACIO, PERFIL, [])).toBeNull()
  })

  it('não depende da ordem de entrada', () => {
    const alvo = novo({ 8: 1, 9: 0.1 })
    expect(livroAutomatico(alvo, [...PALACIO].reverse(), PERFIL, TODOS)).toBe(
      livroAutomatico(alvo, PALACIO, PERFIL, TODOS),
    )
  })
})
