import { semente } from '@/lib/semente'

import type { Id } from '../domain/types'

/**
 * Onde cada neurônio fica na Rede — por significado, não por livro.
 *
 * Até a Fase 23-1 os livros ficavam num círculo e os neurônios em volta da
 * âncora do próprio livro; a partir daqui os aglomerados nascem só das
 * conexões, de qualquer livro. É por isso que este algoritmo mora no núcleo, e
 * não em `features/rede`: ele roda dentro do Worker (cálculo pesado fora da
 * thread da interface, pedido do usuário) e a UI só lê o resultado gravado.
 *
 * **Determinístico com memória, não sem estado.** O grafo antigo já garantia
 * "mesmo grafo, mesmo desenho" recomeçando do zero toda vez. Aqui isso não
 * bastaria: um grafo de significado reorganizado do zero a cada neurônio novo
 * reembaralharia todo mundo, não só quem chegou. Por isso `calcularLayoutDaRede`
 * recebe as posições de antes como ponto de partida (`posicoesAnteriores`) — um
 * neurônio já colocado começa exatamente onde estava, e só se move o quanto a
 * física do passo mandar. Sem histórico nenhum (primeira vez), cai de volta no
 * espalhamento por semente do id, como o layout antigo.
 *
 * As forças continuam acumuladas e só então aplicadas, todas de uma vez por
 * passo — pela mesma razão de sempre: aplicar em cascata faria o resultado
 * depender da ordem de chegada do IndexedDB, que não é garantida entre sessões.
 *
 * Puro: zero DOM, zero canvas, zero Worker. Recebe arrays e o mapa de antes,
 * devolve um mapa novo.
 */

export interface Ponto {
  x: number
  y: number
}

export interface NoParaLayout {
  id: Id
}

export interface ArestaParaLayout {
  aId: Id
  bId: Id
  /** 0..1 — conexão forte aproxima mais. */
  score: number
}

export interface OpcoesLayoutDaRede {
  iteracoes: number
  /** O quanto uma conexão puxa, por unidade de distância e de score. */
  forcaDaAresta: number
  /** O quanto dois neurônios quaisquer se empurram, por unidade de distância². */
  repulsao: number
  /**
   * Além desta distância a repulsão é tratada como zero — é o que faz o custo
   * ficar perto de O(n) por passo em vez de O(n²): só quem está perto de
   * verdade entra na conta (grade espacial, ver `repelir`).
   */
  raioDeRepulsao: number
  /**
   * Puxão fraco para o centro do que já existia — só para quem **não** tem
   * posição de antes (nó novo, sem âncora própria ainda). Sem isso um nó novo
   * ficaria livre para derivar para qualquer canto.
   */
  gravidadeCentral: number
  /**
   * Puxão fraco de volta para **a própria** posição de antes — a âncora de
   * verdade de "mobília não anda". Um nó já colocado responde às arestas e à
   * repulsão normalmente, mas tem uma leve preferência por continuar onde
   * estava; sem isso, um grafo com muitos ciclos pode assentar numa rotação ou
   * num rearranjo local diferente a cada recálculo, mesmo com as mesmas
   * arestas — o sistema tem mais de um equilíbrio válido, e nada dizia qual
   * escolher.
   */
  ancoragemPropria: number
}

export const OPCOES_LAYOUT_DA_REDE: OpcoesLayoutDaRede = {
  iteracoes: 160,
  forcaDaAresta: 0.09,
  repulsao: 620,
  raioDeRepulsao: 260,
  gravidadeCentral: 0.012,
  // Medido num grafo de 179 nós/620 arestas (ver CLAUDE.md, "A Rede como
  // constelação"): com 0,05 o próprio recálculo sobre um grafo praticamente
  // igual já deslocava ~65px em média — o sistema tem mais de um equilíbrio
  // válido, e uma âncora fraca não decidia qual. Em 0,4 isso cai para ~7px,
  // pequeno o bastante para não se notar, e ainda bem mais fraco que o puxão
  // de uma aresta de verdade — quem tem motivo real para se mover, se move.
  ancoragemPropria: 0.4,
}

/** Reprocessar tudo: ninguém tem posição de referência confiável, assenta com calma. */
export const ITERACOES_LAYOUT_COMPLETO = OPCOES_LAYOUT_DA_REDE.iteracoes

/**
 * Uma escrita incremental: quase todo mundo já está no lugar, só o alvo (e
 * talvez seus vizinhos diretos) precisa se acomodar — "assenta e para", não uma
 * reorganização do zero.
 */
export const ITERACOES_LAYOUT_INCREMENTAL = 26

/** O raio do espalhamento inicial escala com a raiz da quantidade — mesma
 *  lógica de `dimensionar` no layout antigo: área, não raio, cresce com n. */
const REFERENCIA_DE_NOS = 20
const RAIO_DE_ESPALHAMENTO = 200

function raioInicial(totalDeNosSemPosicao: number): number {
  return RAIO_DE_ESPALHAMENTO * Math.sqrt(Math.max(1, totalDeNosSemPosicao) / REFERENCIA_DE_NOS)
}

function centroideDe(posicoes: ReadonlyMap<Id, Ponto>): Ponto {
  if (posicoes.size === 0) return { x: 0, y: 0 }
  let x = 0
  let y = 0
  for (const p of posicoes.values()) {
    x += p.x
    y += p.y
  }
  return { x: x / posicoes.size, y: y / posicoes.size }
}

/**
 * A posição de partida de cada nó: a de antes, se houver; senão perto de um
 * vizinho que já tem lugar (o mais próximo por ordem de id — determinístico,
 * não depende da ordem em que os arrays chegaram); senão, espalhado por
 * semente do id ao redor do centro do que já existia.
 *
 * Não precisa achar o lugar perfeito — só um ponto de partida razoável. Quem
 * refina é a relaxação logo depois.
 */
function posicoesDePartida(
  nos: readonly NoParaLayout[],
  vizinhosDe: ReadonlyMap<Id, Id[]>,
  posicoesAnteriores: ReadonlyMap<Id, Ponto>,
): Map<Id, Ponto> {
  // Só a posição de quem ainda existe: copiar `posicoesAnteriores` inteiro
  // deixaria a posição de um neurônio apagado presa no mapa para sempre — ele
  // não recebe força nenhuma (as passadas do laço principal só olham `nos`),
  // então ficaria congelado ali e vazando para o que for gravado depois.
  //
  // E copiado em objetos NOVOS, não pelas mesmas referências: o laço principal
  // muda `p.x`/`p.y` no lugar (é mais barato que recriar o ponto a cada passo),
  // e `posicoesAnteriores` é do dono da chamada — sem isto, rodar o cálculo já
  // alteraria escondido o mapa "de antes" de quem chamou, no meio do cálculo.
  const idsAtuais = new Set(nos.map((n) => n.id))
  const posicoes = new Map<Id, Ponto>(
    [...posicoesAnteriores]
      .filter(([id]) => idsAtuais.has(id))
      .map(([id, p]) => [id, { x: p.x, y: p.y }]),
  )
  const semLugar = new Set(nos.map((n) => n.id).filter((id) => !posicoes.has(id)))
  const centro = centroideDe(posicoesAnteriores)

  // Propaga a partir de quem já tem lugar: um punhado de passadas alcança
  // qualquer neurônio a poucos saltos de alguém conhecido. O que sobrar depois
  // disso é ilha nova de verdade, e cai no espalhamento por semente.
  const MAX_PASSADAS = 6
  for (let passada = 0; passada < MAX_PASSADAS && semLugar.size > 0; passada++) {
    let progrediu = false

    for (const id of semLugar) {
      const vizinhosComLugar = (vizinhosDe.get(id) ?? []).filter((v) => posicoes.has(v)).sort()
      const referencia = vizinhosComLugar[0]
      if (referencia === undefined) continue

      const base = posicoes.get(referencia)!
      const [a, b] = semente(id)
      posicoes.set(id, {
        x: base.x + (a - 0.5) * 40,
        y: base.y + (b - 0.5) * 40,
      })
      semLugar.delete(id)
      progrediu = true
    }

    if (!progrediu) break
  }

  const raio = raioInicial(semLugar.size || nos.length)
  for (const id of semLugar) {
    const [a, b] = semente(id)
    const angulo = a * 2 * Math.PI
    const r = Math.sqrt(b) * raio
    posicoes.set(id, { x: centro.x + Math.cos(angulo) * r, y: centro.y + Math.sin(angulo) * r })
  }

  return posicoes
}

/** `id → ids dos vizinhos`, os dois lados de cada aresta. */
function mapaDeVizinhos(
  nos: readonly NoParaLayout[],
  arestas: readonly ArestaParaLayout[],
): Map<Id, Id[]> {
  const vizinhos = new Map<Id, Id[]>(nos.map((n) => [n.id, []]))
  for (const a of arestas) {
    vizinhos.get(a.aId)?.push(a.bId)
    vizinhos.get(a.bId)?.push(a.aId)
  }
  return vizinhos
}

export function calcularLayoutDaRede(
  nos: readonly NoParaLayout[],
  arestas: readonly ArestaParaLayout[],
  posicoesAnteriores: ReadonlyMap<Id, Ponto>,
  opcoes: OpcoesLayoutDaRede = OPCOES_LAYOUT_DA_REDE,
): Map<Id, Ponto> {
  if (nos.length === 0) return new Map()

  const vizinhosDe = mapaDeVizinhos(nos, arestas)
  const posicoes = posicoesDePartida(nos, vizinhosDe, posicoesAnteriores)
  const arestasValidas = arestas.filter((a) => posicoes.has(a.aId) && posicoes.has(a.bId))

  const forca = new Map<Id, Ponto>(nos.map((n) => [n.id, { x: 0, y: 0 }]))
  // Fixo entre os passos: é a âncora do que já existia, não do que está se
  // movendo agora — senão a gravidade perseguiria o próprio centro de massa.
  const centro = centroideDe(posicoesAnteriores)

  for (let passo = 0; passo < opcoes.iteracoes; passo++) {
    const resfriamento = 1 - passo / opcoes.iteracoes

    for (const f of forca.values()) {
      f.x = 0
      f.y = 0
    }

    // Âncora: quem já tinha lugar puxa fraco de volta para o próprio lugar —
    // é o que impede o aglomerado de girar ou se rearranjar sozinho entre um
    // recálculo e outro, mesmo com as arestas praticamente iguais. Quem é
    // novo usa o centro do que já existia, só para não derivar para longe.
    for (const n of nos) {
      const p = posicoes.get(n.id)!
      const f = forca.get(n.id)!
      const propria = posicoesAnteriores.get(n.id)
      if (propria) {
        f.x += (propria.x - p.x) * opcoes.ancoragemPropria
        f.y += (propria.y - p.y) * opcoes.ancoragemPropria
      } else {
        f.x += (centro.x - p.x) * opcoes.gravidadeCentral
        f.y += (centro.y - p.y) * opcoes.gravidadeCentral
      }
    }

    // Arestas: puxa proporcional à distância atual e ao score — quanto mais
    // forte a conexão, mais perto os dois querem ficar.
    for (const a of arestasValidas) {
      const pa = posicoes.get(a.aId)!
      const pb = posicoes.get(a.bId)!
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const puxao = opcoes.forcaDaAresta * (0.25 + a.score) * resfriamento * 0.5

      const fa = forca.get(a.aId)!
      const fb = forca.get(a.bId)!
      fa.x += dx * puxao
      fa.y += dy * puxao
      fb.x -= dx * puxao
      fb.y -= dy * puxao
    }

    repelir(nos, posicoes, forca, opcoes, resfriamento)

    for (const n of nos) {
      const p = posicoes.get(n.id)!
      const f = forca.get(n.id)!
      p.x += f.x
      p.y += f.y
    }
  }

  return posicoes
}

/**
 * Repulsão entre todos os pares, mas só quem está perto de verdade entra na
 * conta — uma grade espacial (o mesmo truque de qualquer motor de partículas)
 * troca O(n²) por algo perto de O(n): cada nó só olha a própria célula e as 8
 * vizinhas, em vez do grafo inteiro.
 *
 * Cada par é processado uma única vez, escolhido por comparação de índice no
 * array `nos` — não pela ordem em que a grade os encontra — para a soma final
 * não depender de qual célula foi varrida primeiro.
 */
function repelir(
  nos: readonly NoParaLayout[],
  posicoes: ReadonlyMap<Id, Ponto>,
  forca: ReadonlyMap<Id, Ponto>,
  opcoes: OpcoesLayoutDaRede,
  resfriamento: number,
): void {
  const indice = new Map(nos.map((n, i) => [n.id, i]))
  const tamanhoDaCelula = opcoes.raioDeRepulsao
  const chave = (x: number, y: number): string =>
    `${String(Math.floor(x / tamanhoDaCelula))}:${String(Math.floor(y / tamanhoDaCelula))}`

  const grade = new Map<string, Id[]>()
  for (const n of nos) {
    const p = posicoes.get(n.id)!
    const c = chave(p.x, p.y)
    const lista = grade.get(c)
    if (lista) lista.push(n.id)
    else grade.set(c, [n.id])
  }

  const raio2 = opcoes.raioDeRepulsao * opcoes.raioDeRepulsao

  for (const n of nos) {
    const idA = n.id
    const a = posicoes.get(idA)!
    const cx = Math.floor(a.x / tamanhoDaCelula)
    const cy = Math.floor(a.y / tamanhoDaCelula)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const vizinhos = grade.get(`${String(cx + dx)}:${String(cy + dy)}`)
        if (!vizinhos) continue

        for (const idB of vizinhos) {
          if (indice.get(idB)! <= indice.get(idA)!) continue // cada par, uma vez

          const b = posicoes.get(idB)!
          let vx = b.x - a.x
          let vy = b.y - a.y
          let d2 = vx * vx + vy * vy
          if (d2 >= raio2) continue

          if (d2 < 0.01) {
            vx = (semente(idA)[0] - 0.5) * 0.1
            vy = (semente(idB)[1] - 0.5) * 0.1
            d2 = vx * vx + vy * vy || 0.01
          }

          const empurrao = Math.min((opcoes.repulsao / d2) * resfriamento, 4)
          const fa = forca.get(idA)!
          const fb = forca.get(idB)!
          fa.x -= vx * empurrao
          fa.y -= vy * empurrao
          fb.x += vx * empurrao
          fb.y += vy * empurrao
        }
      }
    }
  }
}
