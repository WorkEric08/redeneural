import type { Anexo, EstadoDaIdeia, Id, MidiaDoAnexo, Neuronio } from './types'

/**
 * Um neurônio como a tela o vê.
 *
 * Sem o `embedding`: o vetor não serve para renderizar nada e são ~1,5 KB por
 * neurônio atravessando a fronteira do Worker a cada carga. O que a tela precisa
 * saber sobre ele cabe num booleano.
 */
export interface NeuronioNaTela {
  id: Id
  /** `null` é o porto — ver `Neuronio.livroId`. */
  livroId: Id | null
  titulo: string
  conteudo: string
  /** A inferência ainda não terminou — mostrar como "processando…". */
  processando: boolean
  /** Ver `Neuronio.estado` — a tela só mostra num livro executável (`estadoVisivel`). */
  estado: EstadoDaIdeia | null
  ultimoToque: Date
  resultadoLink: string | null
  createdAt: Date
  updatedAt: Date
}

export function paraTela(n: Neuronio): NeuronioNaTela {
  return {
    id: n.id,
    livroId: n.livroId,
    titulo: n.titulo,
    conteudo: n.conteudo,
    processando: n.embedding === null,
    estado: n.estado,
    ultimoToque: n.ultimoToque,
    resultadoLink: n.resultadoLink,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }
}

/**
 * Um anexo como a tela o vê: sem o vetor e sem os bytes da imagem. A miniatura
 * é pedida à parte, só por quem vai desenhá-la.
 */
export interface AnexoNaTela {
  id: Id
  livroId: Id
  legenda: string
  midia: MidiaDoAnexo
  /** Tem legenda e a inferência ainda não terminou. Sem legenda nunca processa. */
  processando: boolean
  createdAt: Date
  updatedAt: Date
}

export function anexoParaTela(a: Anexo): AnexoNaTela {
  return {
    id: a.id,
    livroId: a.livroId,
    legenda: a.legenda,
    midia: a.midia,
    processando: a.legenda.trim() !== '' && a.embedding === null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}
