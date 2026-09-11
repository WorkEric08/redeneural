import type { Conexao, Id, Livro, NeuronioNaTela } from '@/core'

/**
 * Onde cada neurônio fica na rede.
 *
 * **Determinístico de propósito, sem simulação viva.** Um palácio da memória só
 * funciona se a mobília não andar: você precisa reencontrar o conceito no mesmo
 * canto amanhã. Nada aqui usa `Math.random` nem relógio — o mesmo grafo dá
 * sempre o mesmo desenho, e reabrir o app não reembaralha a sala.
 *
 * É a mesma promessa que o motor faz com os scores, agora no espaço.
 *
 * Puro: zero DOM, zero canvas. Recebe arrays, devolve pontos.
 */

export interface Ponto {
  x: number
  y: number
}

export interface Mapa {
  posicoes: Map<Id, Ponto>
  /** O centro de cada região. */
  ancoras: Map<Id, Ponto>
  /** Onde o nome do livro é escrito: para fora, longe dos neurônios dele. */
  rotulos: Map<Id, Ponto>
  limites: { minX: number; minY: number; maxX: number; maxY: number }
}

export interface OpcoesMapa {
  iteracoes: number
  /** Raio de um livro com um neurônio só. */
  raioBaseDoLivro: number
  /** O quanto o livro cresce por raiz do número de neurônios — área, não raio. */
  crescimentoDoLivro: number
  /** Folga entre livros vizinhos, em múltiplos do raio de livro. */
  folgaEntreLivros: number
  /** O quanto o livro segura os seus. */
  gravidadeDoLivro: number
  /** O quanto uma conexão forte aproxima. */
  forcaDaAresta: number
  /** O quanto dois neurônios do mesmo livro se empurram. */
  repulsao: number
}

export const OPCOES_MAPA: OpcoesMapa = {
  iteracoes: 90,
  raioBaseDoLivro: 34,
  crescimentoDoLivro: 26,
  folgaEntreLivros: 2.4,
  gravidadeDoLivro: 0.045,
  forcaDaAresta: 0.09,
  repulsao: 900,
}

/**
 * Os raios saem do conteúdo, não de uma constante.
 *
 * Um palácio de nove neurônios num raio fixo de 300 px vira três pontinhos
 * perdidos no vazio; o mesmo raio com quinhentos vira novelo. O livro cresce com
 * a raiz do que tem dentro (área, não raio), e o palácio abre o bastante para os
 * livros não se encostarem.
 */
export function dimensionar(
  nLivros: number,
  maiorLivro: number,
  opcoes: OpcoesMapa,
): { raioDoLivro: number; raioDoPalacio: number } {
  const raioDoLivro =
    opcoes.raioBaseDoLivro + Math.sqrt(Math.max(1, maiorLivro)) * opcoes.crescimentoDoLivro
  const circunferencia = raioDoLivro * opcoes.folgaEntreLivros * Math.max(1, nLivros)

  return {
    raioDoLivro,
    raioDoPalacio: Math.max(raioDoLivro * 1.5, circunferencia / (2 * Math.PI)),
  }
}

/** FNV-1a. Só precisa ser estável e bem espalhado — não é criptografia. */
function embaralhar(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Dois números em [0,1) a partir do id — é a semente do lugar de cada neurônio. */
function semente(id: string): [number, number] {
  const a = embaralhar(id)
  const b = embaralhar(`${id}#2`)
  return [a / 0xffffffff, b / 0xffffffff]
}

export function montarMapa(
  livros: readonly Livro[],
  neuronios: readonly NeuronioNaTela[],
  conexoes: readonly Conexao[],
  opcoes: OpcoesMapa = OPCOES_MAPA,
): Mapa {
  const porLivro = new Map<Id, number>()
  for (const n of neuronios) porLivro.set(n.livroId, (porLivro.get(n.livroId) ?? 0) + 1)

  const { raioDoLivro, raioDoPalacio } = dimensionar(
    livros.length,
    Math.max(0, ...porLivro.values()),
    opcoes,
  )

  const ancoras = new Map<Id, Ponto>()
  const rotulos = new Map<Id, Ponto>()

  // Os livros ficam num círculo, na ordem em que foram criados. Livro novo entra
  // no fim e não empurra os outros de lugar.
  const ordenados = [...livros].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : 1),
  )
  for (const [i, livro] of ordenados.entries()) {
    const angulo = (2 * Math.PI * i) / Math.max(1, ordenados.length) - Math.PI / 2
    const cos = Math.cos(angulo)
    const sen = Math.sin(angulo)

    ancoras.set(livro.id, { x: cos * raioDoPalacio, y: sen * raioDoPalacio })
    // O nome vai para fora, na direção que aponta para longe do centro — assim
    // ele nunca cai em cima dos neurônios do próprio livro.
    rotulos.set(livro.id, {
      x: cos * (raioDoPalacio + raioDoLivro + 26),
      y: sen * (raioDoPalacio + raioDoLivro + 26),
    })
  }

  const centro: Ponto = { x: 0, y: 0 }
  const ancoraDe = (livroId: Id): Ponto => ancoras.get(livroId) ?? centro

  const posicoes = new Map<Id, Ponto>()
  for (const n of neuronios) {
    const [a, b] = semente(n.id)
    const ancora = ancoraDe(n.livroId)
    const angulo = a * 2 * Math.PI
    // Raiz do segundo valor: espalha por área, não por raio — senão tudo empilha
    // perto do centro do livro.
    const raio = Math.sqrt(b) * raioDoLivro
    posicoes.set(n.id, {
      x: ancora.x + Math.cos(angulo) * raio,
      y: ancora.y + Math.sin(angulo) * raio,
    })
  }

  relaxar(neuronios, conexoes, posicoes, ancoraDe, opcoes)

  // Os rótulos entram nos limites com a largura do texto: se entrassem só como
  // ponto, o enquadramento cortaria metade do nome do livro que está na borda.
  const extensoes = ordenados.flatMap((livro) => {
    const r = rotulos.get(livro.id)
    if (!r) return []
    const meia = estimarMeiaLargura(livro.titulo)
    return [
      { x: r.x - meia, y: r.y - ALTURA_DO_ROTULO },
      { x: r.x + meia, y: r.y + ALTURA_DO_ROTULO },
    ]
  })

  return { posicoes, ancoras, rotulos, limites: calcularLimites(posicoes, extensoes) }
}

/**
 * Relaxamento com número fixo de passos.
 *
 * **As forças são acumuladas e só então aplicadas**, todas de uma vez por passo.
 * Aplicá-las em cascata faria o resultado depender da ordem em que os neurônios
 * chegaram — e essa ordem vem do IndexedDB, que não a garante entre sessões. O
 * palácio mudaria de forma sozinho ao reabrir, que é exatamente o que este
 * arquivo existe para impedir.
 *
 * A repulsão só age entre neurônios do mesmo livro: são eles que se sobrepõem.
 * Livros diferentes já estão separados pelas âncoras, e restringir assim tira o
 * O(N²) global do caminho — o que importa numa WebView.
 */
function relaxar(
  neuronios: readonly NeuronioNaTela[],
  conexoes: readonly Conexao[],
  posicoes: Map<Id, Ponto>,
  ancoraDe: (livroId: Id) => Ponto,
  opcoes: OpcoesMapa,
): void {
  const porLivro = new Map<Id, NeuronioNaTela[]>()
  for (const n of neuronios) {
    const lista = porLivro.get(n.livroId)
    if (lista) lista.push(n)
    else porLivro.set(n.livroId, [n])
  }

  const arestas = conexoes.filter((c) => posicoes.has(c.aId) && posicoes.has(c.bId))
  const forca = new Map<Id, Ponto>()
  for (const n of neuronios) forca.set(n.id, { x: 0, y: 0 })

  for (let passo = 0; passo < opcoes.iteracoes; passo++) {
    // Esfria: passos grandes no começo, ajuste fino no fim.
    const resfriamento = 1 - passo / opcoes.iteracoes

    for (const f of forca.values()) {
      f.x = 0
      f.y = 0
    }

    for (const n of neuronios) {
      const p = posicoes.get(n.id)!
      const f = forca.get(n.id)!
      const ancora = ancoraDe(n.livroId)
      f.x += (ancora.x - p.x) * opcoes.gravidadeDoLivro
      f.y += (ancora.y - p.y) * opcoes.gravidadeDoLivro
    }

    for (const c of arestas) {
      const a = posicoes.get(c.aId)!
      const b = posicoes.get(c.bId)!
      const dx = b.x - a.x
      const dy = b.y - a.y
      // Conexão forte puxa mais: a distância no desenho vira força da ligação.
      const puxao = opcoes.forcaDaAresta * (0.25 + c.score) * resfriamento * 0.5

      const fa = forca.get(c.aId)!
      const fb = forca.get(c.bId)!
      fa.x += dx * puxao
      fa.y += dy * puxao
      fb.x -= dx * puxao
      fb.y -= dy * puxao
    }

    for (const lista of porLivro.values()) {
      for (let i = 0; i < lista.length; i++) {
        for (let j = i + 1; j < lista.length; j++) {
          const idA = lista[i]!.id
          const idB = lista[j]!.id
          const a = posicoes.get(idA)!
          const b = posicoes.get(idB)!
          let dx = b.x - a.x
          let dy = b.y - a.y
          let d2 = dx * dx + dy * dy

          // Dois neurônios exatamente no mesmo ponto não têm direção para se
          // separar: a semente do id decide para onde cada um vai.
          if (d2 < 0.01) {
            dx = (semente(idA)[0] - 0.5) * 0.1
            dy = (semente(idB)[1] - 0.5) * 0.1
            d2 = dx * dx + dy * dy || 0.01
          }

          const empurrao = Math.min((opcoes.repulsao / d2) * resfriamento, 4)
          const fa = forca.get(idA)!
          const fb = forca.get(idB)!
          fa.x -= dx * empurrao
          fa.y -= dy * empurrao
          fb.x += dx * empurrao
          fb.y += dy * empurrao
        }
      }
    }

    for (const n of neuronios) {
      const p = posicoes.get(n.id)!
      const f = forca.get(n.id)!
      p.x += f.x
      p.y += f.y
    }
  }
}

/**
 * Largura aproximada do nome do livro no desenho.
 *
 * Medir de verdade exigiria um contexto de canvas, e este arquivo é puro — a
 * estimativa erra por pouco e só é usada para dar folga no enquadramento.
 */
const LARGURA_POR_LETRA = 8
const ALTURA_DO_ROTULO = 10

function estimarMeiaLargura(titulo: string): number {
  return (titulo.length * LARGURA_POR_LETRA) / 2
}

function calcularLimites(
  posicoes: ReadonlyMap<Id, Ponto>,
  extras: readonly Ponto[],
): Mapa['limites'] {
  const pontos = [...posicoes.values(), ...extras]
  if (pontos.length === 0) return { minX: -1, minY: -1, maxX: 1, maxY: 1 }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const p of pontos) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }

  return { minX, minY, maxX, maxY }
}

/** O grau de cada neurônio — é o que faz o hub ser desenhado maior. */
export function grausDoMapa(conexoes: readonly Conexao[]): Map<Id, number> {
  const grau = new Map<Id, number>()
  for (const c of conexoes) {
    grau.set(c.aId, (grau.get(c.aId) ?? 0) + 1)
    grau.set(c.bId, (grau.get(c.bId) ?? 0) + 1)
  }
  return grau
}

/**
 * O neurônio sob o dedo, se houver.
 *
 * Percorre do fim para o começo para que o de cima ganhe, e usa um raio de toque
 * maior que o desenhado — 44 px de alvo continuam valendo aqui.
 */
export function neuronioEm(
  ponto: Ponto,
  posicoes: ReadonlyMap<Id, Ponto>,
  ordem: readonly NeuronioNaTela[],
  raioDeToque: number,
): Id | null {
  for (let i = ordem.length - 1; i >= 0; i--) {
    const n = ordem[i]!
    const p = posicoes.get(n.id)
    if (!p) continue

    const dx = p.x - ponto.x
    const dy = p.y - ponto.y
    if (dx * dx + dy * dy <= raioDeToque * raioDeToque) return n.id
  }
  return null
}
