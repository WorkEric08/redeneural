import { ALTURA_UTIL_DA_PILHA_PX, larguraDoLivroGravado } from './medidas'
import type { DadosDoEnfeite, EnfeiteGravado, Id, OrientacaoDoLivro, Vaga } from './types'

/**
 * Os lugares de uma prateleira.
 *
 * Desde 14/09/2026 a prateleira é uma **fileira de lugares fixos**, e não mais
 * uma lista compacta: `ordem` é o lugar (0..`LUGARES_POR_PRATELEIRA`-1) e pode
 * haver buraco entre dois livros. Tirar um livro não faz ninguém andar — a
 * vaga fica aberta, e é a pessoa que decide o que vai nela (ver `Vaga` em
 * `types.ts`).
 *
 * Puras de propósito: a store usa para mostrar o movimento antes de o banco
 * confirmar, e o repositório usa para gravar — os dois precisam chegar
 * exatamente no mesmo resultado, ou a estante pisca para um lado e volta para
 * o outro.
 */

/**
 * Quantos lugares uma prateleira tem.
 *
 * O mesmo 26 que era a quantidade de enfeites decorativos: é o bastante para
 * transbordar a prateleira mais larga que a tela permite (o `max-w-2xl` do
 * `<main>`, 672 px) e ser cortado na pilastra da direita, como numa estante
 * cheia. Um número maior só criaria lugar que ninguém alcança.
 */
export const LUGARES_POR_PRATELEIRA = 26

/** O teto que Ajustes deixa escolher — decisão do usuário (15/09/2026). */
export const MAXIMO_DE_PRATELEIRAS = 6

interface NoLugar {
  id: Id
  prateleira: number
  ordem: number
  /** Ausente é de pé. Só os testes e fixtures mínimos omitem; todo `Livro` tem. */
  orientacao?: OrientacaoDoLivro
  /** A posição na pilha do lugar (0 embaixo). Ausente é 0. */
  nivel?: number
  larguraLombada?: number | null
}

/**
 * **Pilha** (08/10/2026): vários livros deitados no mesmo lugar, um sobre o outro. O lugar
 * continua sendo um só — com a largura do livro mais largo —, e a regra de ocupação passa a ser:
 * **um livro de pé sozinho, ou uma pilha só de livros deitados**. Nunca os dois.
 *
 * Quanto cabe numa pilha vem da altura: a soma das espessuras (a largura de cada livro, que o
 * deitado gira para baixo) não passa de `ALTURA_UTIL_DA_PILHA_PX`, a mesma em toda tela.
 */
function deitado(l: NoLugar): boolean {
  return l.orientacao === 'deitado'
}

function espessuraDe(l: NoLugar): number {
  return larguraDoLivroGravado({ id: l.id, larguraLombada: l.larguraLombada ?? null })
}

/** Uma pilha com estas espessuras (px) cabe na altura que a fileira garante? */
export function cabeNaPilha(espessuras: readonly number[]): boolean {
  return espessuras.reduce((total, e) => total + e, 0) <= ALTURA_UTIL_DA_PILHA_PX
}

/**
 * Quanto a pilha do lugar `(prateleira, ordem)` pesa de altura, em px: a soma das espessuras dos
 * livros dele. Um lugar com algum livro de pé não é pilha (o de pé é o que aparece), e pesa 0.
 */
export function alturaDaPilhaNoLugar(
  livros: readonly NoLugar[],
  prateleira: number,
  ordem: number,
): number {
  const nele = livros.filter((l) => l.prateleira === prateleira && l.ordem === ordem)
  if (!nele.every(deitado)) return 0
  return nele.reduce((total, l) => total + espessuraDe(l), 0)
}

/**
 * Uma mudança que não passa por mover (editar a largura de um livro, por exemplo) deixa a pilha
 * do lugar dele alta demais? A pilha acima do teto ficaria cortada pela prateleira de cima: o livro
 * do topo apareceria mais fino que a largura que ele tem. Quem já passava do teto pode ser mexido,
 * desde que não piore — a mesma regra de `cabeNaPrateleira`.
 */
export function cabeNaPilhaDepoisDeMudar(
  antes: readonly NoLugar[],
  depois: readonly NoLugar[],
  prateleira: number,
  ordem: number,
): boolean {
  const alturaDepois = alturaDaPilhaNoLugar(depois, prateleira, ordem)
  return (
    alturaDepois <= ALTURA_UTIL_DA_PILHA_PX ||
    alturaDepois <= alturaDaPilhaNoLugar(antes, prateleira, ordem)
  )
}

/** A ordem dentro da pilha: de baixo para cima; o id desempata para a ordem nunca variar. */
function daPilha(a: NoLugar, b: NoLugar): number {
  return (a.nivel ?? 0) - (b.nivel ?? 0) || (a.id < b.id ? -1 : 1)
}

/** O livro deitado `movido` pode subir nesta pilha (só de deitados, e com altura de sobra)? */
function podeEmpilhar(movido: NoLugar, pilha: readonly NoLugar[]): boolean {
  return (
    deitado(movido) &&
    pilha.length > 0 &&
    pilha.every(deitado) &&
    cabeNaPilha([...pilha.map(espessuraDe), espessuraDe(movido)])
  )
}

/**
 * De que lado do livro embaixo do dedo o livro na mão foi solto: na metade da esquerda ele entra
 * **antes** (entre o vizinho da esquerda e esse livro), na da direita **depois**.
 */
export type LadoDoLivro = 'antes' | 'depois'

/**
 * O que o dedo apontou além do lugar: o andar de inserção numa pilha (`posicao`) e o lado de um livro
 * (`lado`). Os dois são opcionais; sem eles, o livro toma o lugar (ou sobe no topo da pilha).
 */
export interface PontoDeSoltura {
  /** Numa pilha de deitados: entre quais livros dela (0 embaixo; a quantidade deles, o topo). */
  posicao?: number
  /** Num lugar com livro (de pé, ou uma pilha que não o aceita): antes ou depois dele. */
  lado?: LadoDoLivro
}

/** Para comparar lugares num `Set` — um par de números não tem igualdade de valor. */
export function chaveDoLugar(l: { prateleira: number; ordem: number }): string {
  return `${String(l.prateleira)}:${String(l.ordem)}`
}

/**
 * Lugar → os livros dele (a pilha, de baixo para cima), só da prateleira pedida. Enfeite e vaga
 * não ocupam nada aqui.
 */
function ocupacao<T extends NoLugar>(
  livros: readonly T[],
  prateleira: number,
  exceto?: Id,
): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const l of livros) {
    if (l.prateleira !== prateleira || l.id === exceto) continue
    const pilha = mapa.get(l.ordem)
    if (pilha) pilha.push(l)
    else mapa.set(l.ordem, [l])
  }
  for (const pilha of mapa.values()) pilha.sort(daPilha)
  return mapa
}

function dentro(lugar: number): number {
  return Math.min(Math.max(0, Math.trunc(lugar)), LUGARES_POR_PRATELEIRA - 1)
}

/**
 * O primeiro lugar sem livro a partir de `apartirDe` e, se não houver nenhum
 * depois dele, o último livre antes. `null` só numa prateleira cheia de livros.
 *
 * É por onde um livro novo entra quando ninguém escolheu o lugar.
 */
export function primeiroLugarLivre(
  livros: readonly NoLugar[],
  prateleira: number,
  apartirDe = 0,
): number | null {
  const ocupados = ocupacao(livros, prateleira)
  const inicio = dentro(apartirDe)

  for (let i = inicio; i < LUGARES_POR_PRATELEIRA; i += 1) if (!ocupados.has(i)) return i
  for (let i = inicio - 1; i >= 0; i -= 1) if (!ocupados.has(i)) return i
  return null
}

/**
 * O primeiro lugar sem livro da estante inteira, da prateleira de cima para
 * baixo. É onde nasce um livro criado sem ninguém ter tocado num lugar — o
 * livro novo que a pergunta do porto oferece. `null` com a estante cheia.
 */
export function primeiroLugarDaEstante(
  livros: readonly NoLugar[],
  quantidadeDePrateleiras: number,
): { prateleira: number; lugar: number } | null {
  for (let prateleira = 0; prateleira < quantidadeDePrateleiras; prateleira += 1) {
    const lugar = primeiroLugarLivre(livros, prateleira)
    if (lugar !== null) return { prateleira, lugar }
  }
  return null
}

/** O buraco mais perto do alvo: primeiro à direita, senão à esquerda. */
function vagaMaisProxima(ocupados: ReadonlyMap<number, unknown>, alvo: number): number | null {
  for (let i = alvo + 1; i < LUGARES_POR_PRATELEIRA; i += 1) if (!ocupados.has(i)) return i
  for (let i = alvo - 1; i >= 0; i -= 1) if (!ocupados.has(i)) return i
  return null
}

/** Há lugar sem livro à direita de `de`? */
function haVagaADireita(ocupados: ReadonlyMap<number, unknown>, de: number): boolean {
  for (let i = de + 1; i < LUGARES_POR_PRATELEIRA; i += 1) if (!ocupados.has(i)) return true
  return false
}

/**
 * Em que lugar o livro cai, dado o lado do livro `k` em que o dedo estava. Soltar na metade de um
 * livro é soltar **na fresta** entre ele e o vizinho daquele lado:
 *
 * - vizinho sem livro (vazio ou enfeite): o livro cai ali, encostado, e **ninguém anda**;
 * - vizinho com livro: o livro toma o lugar de quem fica do lado de lá da fresta e a fila anda para
 *   a direita (como sempre); sem buraco à direita, a fila anda para a esquerda e ele toma o outro
 *   lugar da fresta — a ordem entre os dois livros é a mesma nos dois casos;
 * - sem vizinho (ponta da prateleira): toma o próprio lugar.
 *
 * Num lugar sem livro, ou sem lado, é o próprio lugar.
 */
function lugarDaFresta(
  ocupados: ReadonlyMap<number, unknown>,
  k: number,
  lado: LadoDoLivro | undefined,
): number {
  if (lado === undefined || !ocupados.has(k)) return k

  if (lado === 'depois') {
    const n = k + 1
    if (n >= LUGARES_POR_PRATELEIRA) return k
    if (!ocupados.has(n)) return n
    return haVagaADireita(ocupados, n) ? n : k
  }

  const n = k - 1
  if (n < 0) return k
  if (!ocupados.has(n)) return n
  return haVagaADireita(ocupados, k) ? k : n
}

/**
 * Quem anda para o lugar `alvo` ficar livre: a fila inteira até o buraco mais
 * perto, um lugar para o lado. Mapa vazio se o lugar já estava livre; `null` se
 * a prateleira não tem buraco nenhum.
 */
function empurrarParaAbrir(
  ocupados: ReadonlyMap<number, readonly NoLugar[]>,
  alvo: number,
): Map<Id, number> | null {
  const novoLugar = new Map<Id, number>()
  if (!ocupados.has(alvo)) return novoLugar

  const livre = vagaMaisProxima(ocupados, alvo)
  if (livre === null) return null

  // Uma pilha anda inteira: todos os livros dela vão para o mesmo lugar novo.
  const empurrar = (k: number, para: number): void => {
    for (const empurrado of ocupados.get(k) ?? []) novoLugar.set(empurrado.id, para)
  }
  if (livre > alvo) {
    for (let k = livre - 1; k >= alvo; k -= 1) empurrar(k, k + 1)
  } else {
    for (let k = livre + 1; k <= alvo; k += 1) empurrar(k, k - 1)
  }
  return novoLugar
}

/**
 * Põe `movido` na pilha `pilha` (os outros livros do lugar, de baixo para cima) na posição
 * `posicao`, e renumera os andares de todos: 0 é a base. A posição conta só os outros livros,
 * então `pilha.length` é o topo.
 */
function reinserirNaPilha<T extends NoLugar>(
  livros: readonly T[],
  movido: T,
  prateleira: number,
  alvo: number,
  pilha: readonly T[],
  posicao: number,
): T[] {
  const indice = Math.min(Math.max(0, Math.trunc(posicao)), pilha.length)
  const sequencia = [...pilha.slice(0, indice), movido, ...pilha.slice(indice)]
  const andar = new Map(sequencia.map((l, i) => [l.id, i]))
  return livros.map((l) => {
    const nivel = andar.get(l.id)
    return nivel === undefined ? l : { ...l, prateleira, ordem: alvo, nivel }
  })
}

/** Os livros do lugar na ordem da pilha, de baixo para cima. */
function idsDaPilha(livros: readonly NoLugar[], prateleira: number, ordem: number): Id[] {
  return livros
    .filter((l) => l.prateleira === prateleira && l.ordem === ordem)
    .sort(daPilha)
    .map((l) => l.id)
}

/**
 * Põe o livro no lugar pedido. `ponto.posicao` só importa quando o destino é uma pilha de livros
 * deitados e o livro movido é deitado: é o ponto de inserção entre os outros livros dela (0
 * embaixo, a quantidade de livros no topo). Sem ela, o livro sobe para o topo — como sempre foi.
 * `ponto.lado` só importa num lugar com livro que **não** recebe o movido: é a fresta antes ou
 * depois dele (ver `lugarDaFresta`). Sem ele, o livro toma o lugar.
 *
 * - Lugar livre (vazio, ou com enfeite — que é cenário, não objeto que ocupe):
 *   só o livro se move, ninguém mais anda.
 * - Lugar com outro livro: empurra a fila até o primeiro buraco à direita;
 *   sem buraco à direita, empurra para a esquerda. É a "bandeja de apps do
 *   Android", agora dentro de uma grade em vez de uma lista.
 * - Pilha de deitados que comporta o livro deitado: ele entra nela, na posição pedida (ou no topo),
 *   e ninguém anda. **Na própria pilha** só reordena: nenhum livro sai do lugar, e a conta de altura
 *   não se refaz (o conjunto é o mesmo, e pilhas já gravadas acima do teto seguem valendo).
 * - Prateleira cheia de livros: `null` — e nada muda.
 *
 * O lugar que o livro deixou **fica sem livro e sem vaga**: volta a mostrar o enfeite do sorteio
 * (ver `vagasDepoisDeMover`); ninguém volta sozinho para ele.
 */
export function moverLivroNaEstante<T extends NoLugar>(
  livros: readonly T[],
  id: Id,
  prateleiraDestino: number,
  lugar: number,
  ponto: PontoDeSoltura = {},
): T[] | null {
  const { posicao, lado } = ponto
  const movido = livros.find((l) => l.id === id)
  if (!movido) return [...livros]

  const alvo = dentro(lugar)
  const ocupados = ocupacao(livros, prateleiraDestino, id)
  const pilha = ocupados.get(alvo)
  const noProprioLugar = movido.prateleira === prateleiraDestino && movido.ordem === alvo

  if (noProprioLugar) {
    // Largar no próprio lugar não muda nada — nem leva o livro do meio da pilha para o topo — a
    // não ser que a pessoa tenha apontado outro ponto da própria pilha: aí é reordenar.
    if (posicao === undefined || !pilha || pilha.length === 0 || !deitado(movido)) {
      return [...livros]
    }
    const depois = reinserirNaPilha(livros, movido, prateleiraDestino, alvo, pilha, posicao)
    const antes = idsDaPilha(livros, prateleiraDestino, alvo)
    const agora = idsDaPilha(depois, prateleiraDestino, alvo)
    return antes.every((x, i) => x === agora[i]) ? [...livros] : depois
  }

  // Um livro deitado sobre uma pilha de deitados com altura de sobra entra nela: ninguém anda.
  if (pilha && podeEmpilhar(movido, pilha)) {
    if (posicao !== undefined && posicao < pilha.length) {
      return reinserirNaPilha(livros, movido, prateleiraDestino, alvo, pilha, posicao)
    }
    const nivel = Math.max(...pilha.map((l) => l.nivel ?? 0)) + 1
    return livros.map((l) =>
      l.id === id ? { ...l, prateleira: prateleiraDestino, ordem: alvo, nivel } : l,
    )
  }

  // Senão o livro toma o lugar, e quem estava nele (um livro de pé, ou uma pilha cheia ou de
  // pé) anda inteiro até o buraco mais perto.
  const ondeCai = lugarDaFresta(ocupados, alvo, lado)
  const novoLugar = empurrarParaAbrir(ocupados, ondeCai)
  if (novoLugar === null) return null

  novoLugar.set(id, ondeCai)

  return livros.map((l) => {
    const destino = novoLugar.get(l.id)
    if (destino === undefined) return l
    return {
      ...l,
      prateleira: prateleiraDestino,
      ordem: destino,
      nivel: l.id === id ? 0 : (l.nivel ?? 0),
    }
  })
}

/**
 * O livro, solto aí, **entra na pilha** que está no lugar (em vez de tomar o lugar e empurrar
 * quem estava nele)? É o que a tela precisa para desenhar a linha de inserção só quando ela vale:
 * uma pilha cheia, ou um livro de pé, não aceitam.
 */
export function entraNaPilha(
  livros: readonly NoLugar[],
  id: Id,
  prateleira: number,
  lugar: number,
  posicao: number | undefined,
): boolean {
  const alvo = dentro(lugar)
  const donos = ocupacao(livros, prateleira, id).get(alvo)
  if (!donos || donos.length === 0) return false
  const depois = moverLivroNaEstante(
    livros,
    id,
    prateleira,
    alvo,
    posicao === undefined ? {} : { posicao },
  )
  if (!depois) return false
  const movido = depois.find((l) => l.id === id)
  if (movido?.prateleira !== prateleira || movido.ordem !== alvo) return false
  return donos.every((d) => {
    const agora = depois.find((l) => l.id === d.id)
    return agora?.prateleira === prateleira && agora.ordem === alvo
  })
}

/**
 * Onde um livro que **chega de fora** (um backup importado) fica, perto do lugar que traz: o
 * próprio lugar se ele está livre, ou se o livro é deitado e sobe na pilha que já está lá; senão
 * o buraco mais perto. `null` numa prateleira sem buraco. Nunca empurra ninguém.
 */
export function lugarParaChegar(
  colocados: readonly NoLugar[],
  livro: NoLugar,
): { ordem: number; nivel: number } | null {
  const pilha = ocupacao(colocados, livro.prateleira).get(livro.ordem)
  if (pilha && podeEmpilhar(livro, pilha)) {
    return { ordem: livro.ordem, nivel: Math.max(...pilha.map((l) => l.nivel ?? 0)) + 1 }
  }
  const ordem = primeiroLugarLivre(colocados, livro.prateleira, livro.ordem)
  return ordem === null ? null : { ordem, nivel: 0 }
}

/**
 * Vira o livro (de pé ↔ deitado). Sozinho no lugar, só vira. Dividindo o lugar com outros — uma
 * pilha —, ele sai do meio e vai para o lugar livre mais perto, porque um lugar nunca mistura
 * livro de pé com deitado. `null` se não há lugar livre na prateleira.
 *
 * A mesma conta na store (otimismo) e no motor; as vagas e os enfeites saem de
 * `vagasDepoisDeMover` e `enfeitesSemLivroEmCima`, como num mover.
 */
export function mudarOrientacaoNaEstante<T extends NoLugar>(
  livros: readonly T[],
  id: Id,
  orientacao: OrientacaoDoLivro,
): T[] | null {
  const livro = livros.find((l) => l.id === id)
  if (!livro) return [...livros]
  if ((livro.orientacao ?? 'em-pe') === orientacao) return [...livros]

  const dividem = livros.some(
    (l) => l.id !== id && l.prateleira === livro.prateleira && l.ordem === livro.ordem,
  )
  let ordem = livro.ordem
  if (dividem) {
    const livre = primeiroLugarLivre(
      livros.filter((l) => l.id !== id),
      livro.prateleira,
      livro.ordem,
    )
    if (livre === null) return null
    ordem = livre
  }
  return livros.map((l) => (l.id === id ? { ...l, orientacao, ordem, nivel: 0 } : l))
}

/**
 * As vagas depois de `moverLivroNaEstante`: fecha a de todo lugar onde um livro chegou.
 *
 * **O lugar de onde o livro saiu não vira vaga** (14/10/2026): sem vaga gravada, o lugar volta a
 * mostrar o enfeite que o sorteio dá a ele — e é o que a prévia ao vivo da estante já mostra enquanto
 * o livro está na mão, então a soltura não muda a cara do lugar. Vaga só nasce de "tirar o enfeite"
 * e de apagar um livro.
 */
export function vagasDepoisDeMover(vagas: readonly Vaga[], depois: readonly NoLugar[]): Vaga[] {
  const ocupados = new Set(depois.map(chaveDoLugar))
  return vagas.filter((v) => !ocupados.has(chaveDoLugar(v)))
}

/** O que a estante grava além dos livros: os lugares abertos e os enfeites definidos. */
export interface LugaresDaEstante<T extends NoLugar> {
  livros: T[]
  vagas: Vaga[]
  enfeites: EnfeiteGravado[]
}

/**
 * Os enfeites gravados depois de livros chegarem a lugares: nenhum sobrevive
 * embaixo de um livro — a mesma regra das vagas (`vagasDepoisDeMover`).
 */
export function enfeitesSemLivroEmCima(
  enfeites: readonly EnfeiteGravado[],
  livros: readonly NoLugar[],
): EnfeiteGravado[] {
  const ocupados = new Set(livros.map(chaveDoLugar))
  return enfeites.filter((e) => !ocupados.has(chaveDoLugar(e)))
}

/**
 * Põe o enfeite do lugar `origem` no lugar `destino`, com as mesmas regras do
 * livro (escolha do usuário, 07/10/2026):
 *
 * - Destino sem livro (outro enfeite, ou vaga): só o enfeite se move, e o que
 *   estava ali — o enfeite de lá, ou a vaga — dá lugar a ele.
 * - Destino com livro: a fila empurra até o buraco mais perto, como entre livros.
 *   Prateleira sem buraco: `null`, e nada muda.
 *
 * O lugar de onde o enfeite saiu **fica aberto** (vaga) — nada anda sozinho —, a
 * não ser que um livro empurrado tenha chegado a ele. `dados` é o que a tela
 * mostrava no enfeite: sorteado ou gravado, ele vai com a mesma cara.
 */
export function moverEnfeiteNaEstante<T extends NoLugar>(
  estado: {
    livros: readonly T[]
    vagas: readonly Vaga[]
    enfeites: readonly EnfeiteGravado[]
  },
  origem: Vaga,
  destino: Vaga,
  dados: DadosDoEnfeite,
): LugaresDaEstante<T> | null {
  const alvo = dentro(destino.ordem)
  if (origem.prateleira === destino.prateleira && origem.ordem === alvo) {
    return {
      livros: [...estado.livros],
      vagas: [...estado.vagas],
      enfeites: [...estado.enfeites],
    }
  }

  const novoLugar = empurrarParaAbrir(ocupacao(estado.livros, destino.prateleira), alvo)
  if (novoLugar === null) return null

  const livros = estado.livros.map((l) => {
    const lugar = novoLugar.get(l.id)
    return lugar === undefined ? l : { ...l, prateleira: destino.prateleira, ordem: lugar }
  })
  const ocupados = new Set(livros.map(chaveDoLugar))
  const chaveDaOrigem = chaveDoLugar(origem)
  const chaveDoAlvo = chaveDoLugar({ prateleira: destino.prateleira, ordem: alvo })

  const enfeites = estado.enfeites.filter((e) => {
    const chave = chaveDoLugar(e)
    return chave !== chaveDaOrigem && chave !== chaveDoAlvo && !ocupados.has(chave)
  })
  enfeites.push({ ...dados, prateleira: destino.prateleira, ordem: alvo })

  const vagas = estado.vagas.filter((v) => {
    const chave = chaveDoLugar(v)
    return chave !== chaveDoAlvo && !ocupados.has(chave)
  })
  if (!ocupados.has(chaveDaOrigem) && !vagas.some((v) => chaveDoLugar(v) === chaveDaOrigem)) {
    vagas.push({ prateleira: origem.prateleira, ordem: origem.ordem })
  }

  return { livros, vagas, enfeites }
}
