import type { Id } from '../domain/types'

import type { NoDoGrafo, PerfilDoPalacio } from './grafo'
import { centralizar, produtoInterno } from './vetores'

/**
 * Quantos desvios-padrão acima do **fundo** do palácio um neurônio precisa
 * ficar, para aquela consulta, para entrar no resultado.
 *
 * Relativo à consulta, e não um cosseno fixo, porque um cosseno fixo não
 * separa nada aqui. Medido com o e5 de verdade (30/09/2026, 33 notas e 25
 * consultas): "previsão do tempo para amanhã", sem resposta nenhuma no
 * palácio, teve o primeiro colocado mais parecido (0,13) que "função que chama
 * a si mesma" com a Recursão (0,10). Frase curta tem um "fundo" próprio, que o
 * centroide do palácio não tira. O que distingue uma consulta com resposta é o
 * resultado **se destacar** do resto — "medo de falar em público" acha a nota
 * certa muito acima de todas as outras; o melhor de uma consulta sem resposta
 * fica perto do pelotão.
 *
 * 3,5 é onde as cinco consultas sem resposta pararam de devolver qualquer
 * coisa, tanto no seed (9 neurônios) quanto nas 33 notas, mantendo o primeiro
 * colocado de quase toda consulta com resposta.
 */
export const DESTAQUE_MINIMO_DA_BUSCA = 3.5

export const MAXIMO_DE_RESULTADOS_DA_BUSCA = 20

/**
 * A régua do destaque é medida só sobre os 80% menos parecidos com a consulta.
 *
 * Medida sobre o palácio inteiro, um assunto que ocupa uma fatia grande dele
 * puxaria a média e o desvio para cima — e justamente os neurônios desse
 * assunto deixariam de se destacar: com 2 de 10 batendo, nenhum passava de 2
 * desvios. Os 80% de baixo são o "fundo": o que a consulta certamente não é.
 */
const FRACAO_DO_FUNDO = 0.8

/**
 * Abaixo disso não há fundo para medir destaque: vale só estar do lado certo
 * do centroide (cosseno centralizado positivo).
 */
const MINIMO_PARA_MEDIR_DESTAQUE = 5

const EPS = 1e-8

function comparar(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function passaDoDestaque(cossenos: readonly number[]): (cos: number) => boolean {
  if (cossenos.length < MINIMO_PARA_MEDIR_DESTAQUE) return (cos) => cos > 0

  const fundo = [...cossenos]
    .sort((a, b) => a - b)
    .slice(0, Math.ceil(FRACAO_DO_FUNDO * cossenos.length))
  const media = fundo.reduce((soma, c) => soma + c, 0) / fundo.length
  const desvio = Math.sqrt(fundo.reduce((soma, c) => soma + (c - media) ** 2, 0) / fundo.length)

  // Ninguém se distingue de ninguém — uma consulta que coincide com o
  // centroide, ou um palácio de textos iguais.
  if (desvio < EPS) return () => false
  return (cos) => (cos - media) / desvio >= DESTAQUE_MINIMO_DA_BUSCA
}

/**
 * Os neurônios mais parecidos com a consulta, do mais para o menos parecido.
 *
 * Ordena pelo cosseno centralizado no perfil congelado — a mesma régua das
 * conexões; o cosseno bruto dá ~0,9 para qualquer par e não ordena nada — e
 * corta pelo destaque (ver `DESTAQUE_MINIMO_DA_BUSCA`). O vetor da consulta
 * tem que vir do mesmo modelo, com o mesmo prefixo, que gerou os do palácio.
 */
export function buscarPorSentido(
  consulta: Float32Array,
  nos: readonly Pick<NoDoGrafo, 'id' | 'embedding'>[],
  perfil: Pick<PerfilDoPalacio, 'centroide'>,
): Id[] {
  if (nos.length === 0) return []

  const minha = centralizar(consulta, perfil.centroide)
  const cossenos = nos.map((no) =>
    produtoInterno(minha, centralizar(no.embedding, perfil.centroide)),
  )
  const passa = passaDoDestaque(cossenos)

  return nos
    .map((no, i) => ({ id: no.id, cos: cossenos[i]! }))
    .filter((r) => passa(r.cos))
    .sort((x, y) => y.cos - x.cos || comparar(x.id, y.id))
    .slice(0, MAXIMO_DE_RESULTADOS_DA_BUSCA)
    .map((r) => r.id)
}
