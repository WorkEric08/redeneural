import { describe, expect, it } from 'vitest'

import { buscarPorSentido, MAXIMO_DE_RESULTADOS_DA_BUSCA } from './busca'
import { DIM, no, PALACIO, vetor } from './fixtures'
import { perfilDoPalacio, type NoDoGrafo } from './grafo'

const PERFIL = perfilDoPalacio(PALACIO)

describe('buscarPorSentido', () => {
  it('palácio vazio não tem o que achar', () => {
    expect(buscarPorSentido(vetor({ 9: 1 }), [], PERFIL)).toEqual([])
  })

  it('acha os neurônios do assunto, do mais para o menos parecido', () => {
    // 2 de 10: medido contra o palácio inteiro, o próprio assunto inflaria a
    // régua e nenhum dos dois se destacaria — é o caso que o fundo resolve.
    const achados = buscarPorSentido(vetor({ 9: 1, 10: 0.25 }), PALACIO, PERFIL)
    expect(achados).toEqual(['prog-p1', 'prog-p2'])
  })

  it('consulta que não se distingue de nada não devolve nada', () => {
    // Igual ao centroide: centralizada vira o vetor nulo, cosseno 0 com todos.
    expect(buscarPorSentido(Float32Array.from(PERFIL.centroide), PALACIO, PERFIL)).toEqual([])
  })

  it('quem não se destaca do resto do palácio fica de fora', () => {
    // Parece um pouco com a estrela inteira — nenhum neurônio dela se destaca.
    const achados = buscarPorSentido(vetor({ 0: 1 }), PALACIO, PERFIL)
    expect(achados).not.toContain('mus-iso')
    expect(achados).not.toContain('prog-p1')
  })

  it('não depende da ordem de entrada', () => {
    const consulta = vetor({ 9: 1, 10: 0.25 })
    const invertido = [...PALACIO].reverse()
    expect(buscarPorSentido(consulta, invertido, PERFIL)).toEqual(
      buscarPorSentido(consulta, PALACIO, PERFIL),
    )
  })

  it('num palácio pequeno demais para medir destaque, vale estar do lado certo do centroide', () => {
    const pequeno = [no('a', 'l', { 1: 1 }), no('b', 'l', { 2: 1 }), no('c', 'l', { 3: 1 })]
    const perfil = perfilDoPalacio(pequeno)
    expect(buscarPorSentido(vetor({ 2: 1 }), pequeno, perfil)).toEqual(['b'])
  })

  it(`nunca devolve mais que ${String(MAXIMO_DE_RESULTADOS_DA_BUSCA)}`, () => {
    // 30 neurônios do assunto entre 200: todos se destacam, só 20 voltam.
    const assunto = Array.from({ length: 30 }, (_, i) =>
      no(`a${String(i).padStart(2, '0')}`, 'l', { 0: 1, [1 + (i % 3)]: 0.05 * (i + 1) }),
    )
    const resto: NoDoGrafo[] = Array.from({ length: 170 }, (_, i) =>
      no(`r${String(i).padStart(3, '0')}`, 'l', { [4 + (i % (DIM - 4))]: 1, [i % 2 ? 5 : 6]: 0.3 }),
    )
    const palacio = [...assunto, ...resto]
    const achados = buscarPorSentido(vetor({ 0: 1 }), palacio, perfilDoPalacio(palacio))

    expect(achados).toHaveLength(MAXIMO_DE_RESULTADOS_DA_BUSCA)
    expect(achados.every((id) => id.startsWith('a'))).toBe(true)
  })
})
