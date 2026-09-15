import { describe, expect, it } from 'vitest'

import {
  calcularLayoutDaRede,
  OPCOES_LAYOUT_DA_REDE,
  type ArestaParaLayout,
  type NoParaLayout,
  type Ponto,
} from './redeLayout'

const PARTIDA_QUENTE = { ...OPCOES_LAYOUT_DA_REDE, iteracoes: 26 }

function no(id: string): NoParaLayout {
  return { id }
}

function aresta(aId: string, bId: string, score = 0.6): ArestaParaLayout {
  return { aId, bId, score }
}

function distancia(a: Ponto, b: Ponto): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

const VAZIO: ReadonlyMap<string, Ponto> = new Map()

// Dois aglomerados de 4, ligados por uma única ponte fraca — a mesma forma de
// grafo que uma "conexão que atravessa livros" tem na vida real.
const NOS = ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'].map(no)
const ARESTAS: ArestaParaLayout[] = [
  aresta('a1', 'a2', 0.9),
  aresta('a2', 'a3', 0.85),
  aresta('a3', 'a4', 0.8),
  aresta('a4', 'a1', 0.75),
  aresta('b1', 'b2', 0.9),
  aresta('b2', 'b3', 0.85),
  aresta('b3', 'b4', 0.8),
  aresta('b4', 'b1', 0.75),
  aresta('a1', 'b1', 0.2),
]

describe('calcularLayoutDaRede', () => {
  it('dá sempre o mesmo desenho para o mesmo grafo (a promessa da mobília)', () => {
    const x = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)
    const y = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)

    for (const n of NOS) expect(x.get(n.id)).toEqual(y.get(n.id))
  })

  it('não depende da ordem em que os nós e as arestas chegam', () => {
    const x = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)
    const y = calcularLayoutDaRede([...NOS].reverse(), [...ARESTAS].reverse(), VAZIO)

    for (const n of NOS) expect(distancia(x.get(n.id)!, y.get(n.id)!)).toBeLessThan(1)
  })

  it('posiciona todo nó, e nenhum em NaN', () => {
    const posicoes = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)

    expect(posicoes.size).toBe(NOS.length)
    for (const p of posicoes.values()) {
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
    }
  })

  it('aglomerados nascem das conexões: quem se conecta fica mais perto que quem não se conecta', () => {
    const posicoes = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)

    const dentro = distancia(posicoes.get('a1')!, posicoes.get('a3')!)
    const fora = distancia(posicoes.get('a1')!, posicoes.get('b3')!)

    expect(dentro).toBeLessThan(fora)
  })

  it('nunca muda os pontos de `posicoesAnteriores` — o mapa é de quem chamou', () => {
    // A armadilha real: `new Map(anteriores)` copia as chaves, mas os OBJETOS
    // `{x,y}` continuam sendo os mesmos — o laço principal muda `p.x`/`p.y` no
    // lugar, e sem cópia isso vazaria para o mapa de quem chamou, no meio do
    // cálculo. Um teste que comparasse "antes" com o resultado usando esses
    // mesmos objetos passaria mesmo com o bug — por isso aqui a cópia é feita
    // antes de chamar, e comparada byte a byte depois.
    const original = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)
    const copia = new Map([...original].map(([id, p]) => [id, { x: p.x, y: p.y }]))

    calcularLayoutDaRede(NOS, ARESTAS, original, { ...OPCOES_LAYOUT_DA_REDE, iteracoes: 26 })

    for (const [id, p] of copia) expect(original.get(id)).toEqual(p)
  })

  it('não empilha dois nós exatamente no mesmo ponto', () => {
    const pontos = [...calcularLayoutDaRede(NOS, ARESTAS, VAZIO).values()]

    for (let i = 0; i < pontos.length; i++) {
      for (let j = i + 1; j < pontos.length; j++) {
        expect(distancia(pontos[i]!, pontos[j]!)).toBeGreaterThan(1)
      }
    }
  })

  it('aguenta um grafo vazio', () => {
    expect(calcularLayoutDaRede([], [], VAZIO).size).toBe(0)
  })

  it('a posição de um nó apagado não sobrevive no resultado', () => {
    const antes = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)
    // 'a4' saiu do grafo — o mapa devolvido não pode carregar a posição dele.
    const semA4 = NOS.filter((n) => n.id !== 'a4')
    const arestasSemA4 = ARESTAS.filter((a) => a.aId !== 'a4' && a.bId !== 'a4')
    const depois = calcularLayoutDaRede(semA4, arestasSemA4, antes)

    expect(depois.has('a4')).toBe(false)
    expect(depois.size).toBe(NOS.length - 1)
  })

  it('um nó sozinho, sem aresta nenhuma, ainda ganha um lugar finito', () => {
    const posicoes = calcularLayoutDaRede([no('solo')], [], VAZIO)
    const p = posicoes.get('solo')!

    expect(Number.isFinite(p.x)).toBe(true)
    expect(Number.isFinite(p.y)).toBe(true)
  })

  it('não quebra com uma aresta apontando para um nó que não existe', () => {
    const posicoes = calcularLayoutDaRede(NOS, [...ARESTAS, aresta('a1', 'fantasma')], VAZIO)
    expect(Number.isFinite(posicoes.get('a1')!.x)).toBe(true)
  })

  it('um grafo maior abre mais espaço, em vez de virar novelo', () => {
    const grande = Array.from({ length: 60 }, (_, i) => no(`x${String(i)}`))
    const arestasEmCadeia = grande.slice(1).map((n, i) => aresta(grande[i]!.id, n.id, 0.6))

    const pequeno = calcularLayoutDaRede(NOS.slice(0, 4), ARESTAS.slice(0, 3), VAZIO)
    const grandeMapa = calcularLayoutDaRede(grande, arestasEmCadeia, VAZIO)

    const raioMedio = (m: ReadonlyMap<string, Ponto>): number => {
      const pontos = [...m.values()]
      const cx = pontos.reduce((s, p) => s + p.x, 0) / pontos.length
      const cy = pontos.reduce((s, p) => s + p.y, 0) / pontos.length
      return pontos.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / pontos.length
    }

    expect(raioMedio(grandeMapa)).toBeGreaterThan(raioMedio(pequeno))
  })

  describe('a mobília não anda: partida quente', () => {
    it('recalcular sobre o próprio resultado, sem nada mudar, quase não move ninguém', () => {
      const assentado = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)
      const denovo = calcularLayoutDaRede(NOS, ARESTAS, assentado, PARTIDA_QUENTE)

      // Pequeno, mas não zero: a âncora própria (ancoragemPropria) é um puxão,
      // não uma trava — o sistema tem mais de um equilíbrio válido para um
      // grafo com ciclos, e o ponto aqui é só não deslizar longe.
      for (const n of NOS) {
        expect(distancia(assentado.get(n.id)!, denovo.get(n.id)!)).toBeLessThan(5)
      }
    })

    it('um nó novo nasce perto do vizinho, sem reembaralhar quem já estava lá', () => {
      const antes = calcularLayoutDaRede(NOS, ARESTAS, VAZIO)

      const comNovo = [...NOS, no('a5')]
      const arestasComNovo = [...ARESTAS, aresta('a5', 'a1', 0.9)]
      const depois = calcularLayoutDaRede(comNovo, arestasComNovo, antes, PARTIDA_QUENTE)

      // Quem já existia se move pouco.
      for (const n of NOS) {
        expect(distancia(antes.get(n.id)!, depois.get(n.id)!)).toBeLessThan(15)
      }

      // O novo nasce perto de quem o trouxe, não solto em outro canto do mapa.
      const distanciaAoVizinho = distancia(depois.get('a5')!, depois.get('a1')!)
      const distanciaAoOutroAglomerado = distancia(depois.get('a5')!, depois.get('b3')!)
      expect(distanciaAoVizinho).toBeLessThan(distanciaAoOutroAglomerado)
    })

    it('dois nós que chegam colados na mesma posição de antes se separam', () => {
      const colados = new Map<string, Ponto>([
        ['a1', { x: 10, y: 10 }],
        ['a2', { x: 10, y: 10 }],
      ])
      const posicoes = calcularLayoutDaRede([no('a1'), no('a2')], [aresta('a1', 'a2')], colados)

      expect(distancia(posicoes.get('a1')!, posicoes.get('a2')!)).toBeGreaterThan(1)
    })
  })
})
