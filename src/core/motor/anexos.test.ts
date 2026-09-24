import { describe, expect, it } from 'vitest'

import { ancorarAnexos, type VinculoCalculado } from './anexos'
import { OPCOES_PADRAO } from './config'
import { PALACIO, vetor } from './fixtures'
import { perfilDoPalacio } from './grafo'

const PERFIL = perfilDoPalacio(PALACIO)

function anexo(id: string, pares: Record<number, number>) {
  return { id, embedding: vetor(pares) }
}

/** Parece com a dupla de programação e com mais nada. */
const SOBRE_PROG = anexo('a-prog', { 9: 1, 10: 0.1 })
/** Parece com o centro da estrela de psicologia. */
const SOBRE_PSI = anexo('a-psi', { 0: 1, 1: 0.3, 2: 0.3 })

function daquele(vinculos: readonly VinculoCalculado[], anexoId: string): VinculoCalculado[] {
  return vinculos.filter((v) => v.anexoId === anexoId)
}

describe('ancorarAnexos', () => {
  it('sem conceitos, ninguém tem onde se prender', () => {
    expect(ancorarAnexos([SOBRE_PROG], [], PERFIL)).toEqual([])
  })

  it('anexo sem vetor — sem legenda, ou ainda processando — não ganha vínculo', () => {
    expect(ancorarAnexos([{ id: 'sem-vetor', embedding: null }], PALACIO, PERFIL)).toEqual([])
  })

  it('anexo que não se distingue de nada fica só na pasta, sem fio forçado', () => {
    // Igual ao centroide: centralizado, vira o vetor nulo — score 0 com todo
    // conceito. Um conceito nesse caso manteria o vizinho menos ruim; um anexo não.
    const indistinto = { id: 'indistinto', embedding: Float32Array.from(PERFIL.centroide) }
    expect(ancorarAnexos([indistinto], PALACIO, PERFIL)).toEqual([])
  })

  it('escolhe os conceitos do assunto dele', () => {
    const escolhidos = ancorarAnexos([SOBRE_PROG], PALACIO, PERFIL).map((v) => v.conceitoId)

    expect(escolhidos[0]).toMatch(/^prog-/)
    expect(escolhidos.some((id) => id.startsWith('psi-'))).toBe(false)
  })

  it('nunca passa do teto de âncoras', () => {
    const vinculos = ancorarAnexos([SOBRE_PSI, SOBRE_PROG], PALACIO, PERFIL)
    for (const id of ['a-psi', 'a-prog']) {
      expect(daquele(vinculos, id).length).toBeLessThanOrEqual(OPCOES_PADRAO.maxAncoras)
    }

    // Sem corte relativo, só o teto decide.
    const soOTeto = { ...OPCOES_PADRAO, razaoCorte: 0, maxAncoras: 2 }
    expect(ancorarAnexos([SOBRE_PSI], PALACIO, PERFIL, soOTeto)).toHaveLength(2)
  })

  it('só fica quem passa do corte relativo ao melhor daquele anexo', () => {
    const vinculos = ancorarAnexos([SOBRE_PSI, SOBRE_PROG], PALACIO, PERFIL)

    for (const id of ['a-psi', 'a-prog']) {
      const meus = daquele(vinculos, id)
      expect(meus.length, `${id} não escolheu ninguém`).toBeGreaterThan(0)
      const melhor = Math.max(...meus.map((v) => v.score))
      for (const v of meus) {
        expect(v.score).toBeGreaterThanOrEqual(OPCOES_PADRAO.razaoCorte * melhor)
        expect(v.score).toBeLessThanOrEqual(1)
      }
    }
  })

  it('um anexo não mexe no que o outro escolhe — cada um é satélite sozinho', () => {
    const sozinho = ancorarAnexos([SOBRE_PSI], PALACIO, PERFIL)
    const junto = ancorarAnexos([SOBRE_PSI, SOBRE_PROG], PALACIO, PERFIL)

    expect(daquele(junto, 'a-psi')).toEqual(sozinho)
  })

  it('não depende da ordem de entrada', () => {
    const normal = ancorarAnexos([SOBRE_PSI, SOBRE_PROG], PALACIO, PERFIL)
    const invertido = ancorarAnexos([SOBRE_PROG, SOBRE_PSI], [...PALACIO].reverse(), PERFIL)

    expect(invertido).toEqual(normal)
  })

  it('não muta as entradas', () => {
    const antesDoAnexo = Float32Array.from(SOBRE_PSI.embedding)
    const antesDoCentroide = Float32Array.from(PERFIL.centroide)
    const antesDoConceito = Float32Array.from(PALACIO[0]!.embedding)

    ancorarAnexos([SOBRE_PSI], PALACIO, PERFIL)

    expect(SOBRE_PSI.embedding).toEqual(antesDoAnexo)
    expect(PERFIL.centroide).toEqual(antesDoCentroide)
    expect(PALACIO[0]!.embedding).toEqual(antesDoConceito)
  })
})
