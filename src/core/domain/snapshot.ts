import { base64ToBytes, base64ToEmbedding, bytesToBase64, embeddingToBase64 } from './base64'
import { clampDiasParaAdormecer, DIAS_PARA_ADORMECER_PADRAO } from './executavel'
import type {
  Anexo,
  AnexoSnapshot,
  ArquivoDoAnexo,
  Conexao,
  ConexaoSnapshot,
  Livro,
  LivroSnapshot,
  Neuronio,
  NeuronioSnapshot,
} from './types'

export const SNAPSHOT_VERSION = 1 as const

function toIso(d: Date): string {
  return d.toISOString()
}

function fromIso(s: string, campo: string): Date {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) throw new Error(`data inválida em ${campo}: ${s}`)
  return d
}

export function livroToSnapshot(l: Livro): LivroSnapshot {
  return {
    id: l.id,
    tipo: l.tipo,
    titulo: l.titulo,
    cor: l.cor,
    prateleira: l.prateleira,
    ordem: l.ordem,
    emblema: l.emblema,
    larguraLombada: l.larguraLombada,
    comprimentoLombada: l.comprimentoLombada,
    executavel: l.executavel,
    diasParaAdormecer: l.diasParaAdormecer,
    createdAt: toIso(l.createdAt),
  }
}

/**
 * `prateleira`/`ordem` vêm de fora, e não do arquivo: o lugar de um livro só
 * faz sentido junto com os livros que já estão na estante de destino, e quem
 * enxerga os dois lados é o import.
 */
export function livroFromSnapshot(s: LivroSnapshot, prateleira: number, ordem: number): Livro {
  return {
    id: s.id,
    tipo: s.tipo ?? 'conceitos',
    titulo: s.titulo,
    cor: s.cor,
    prateleira,
    ordem,
    emblema: s.emblema ?? null,
    larguraLombada: s.larguraLombada ?? null,
    comprimentoLombada: s.comprimentoLombada ?? null,
    // Uma pasta nunca é executável, nem vinda de um arquivo mexido à mão.
    executavel: (s.tipo ?? 'conceitos') === 'conceitos' && s.executavel === true,
    diasParaAdormecer: clampDiasParaAdormecer(s.diasParaAdormecer ?? DIAS_PARA_ADORMECER_PADRAO),
    createdAt: fromIso(s.createdAt, `livro ${s.id}.createdAt`),
  }
}

export function neuronioToSnapshot(n: Neuronio): NeuronioSnapshot {
  return {
    id: n.id,
    livroId: n.livroId,
    titulo: n.titulo,
    conteudo: n.conteudo,
    embedding: n.embedding ? embeddingToBase64(n.embedding) : null,
    estado: n.estado,
    ultimoToque: toIso(n.ultimoToque),
    resultadoLink: n.resultadoLink,
    createdAt: toIso(n.createdAt),
    updatedAt: toIso(n.updatedAt),
  }
}

export function neuronioFromSnapshot(s: NeuronioSnapshot): Neuronio {
  const updatedAt = fromIso(s.updatedAt, `neuronio ${s.id}.updatedAt`)
  return {
    id: s.id,
    livroId: s.livroId,
    titulo: s.titulo,
    conteudo: s.conteudo,
    embedding: s.embedding === null ? null : base64ToEmbedding(s.embedding),
    estado: s.estado ?? null,
    // Backup de antes dos executáveis: o último toque é a última edição, a
    // mesma regra da migração do banco.
    ultimoToque:
      s.ultimoToque === undefined
        ? updatedAt
        : fromIso(s.ultimoToque, `neuronio ${s.id}.ultimoToque`),
    resultadoLink: s.resultadoLink ?? null,
    createdAt: fromIso(s.createdAt, `neuronio ${s.id}.createdAt`),
    updatedAt,
  }
}

export function conexaoToSnapshot(c: Conexao): ConexaoSnapshot {
  return {
    id: c.id,
    aId: c.aId,
    bId: c.bId,
    score: c.score,
    emb: c.emb,
    rr: c.rr,
    cross: c.cross,
    mantidaPorA: c.mantidaPorA,
    mantidaPorB: c.mantidaPorB,
    updatedAt: toIso(c.updatedAt),
  }
}

export function conexaoFromSnapshot(s: ConexaoSnapshot): Conexao {
  return {
    id: s.id,
    aId: s.aId,
    bId: s.bId,
    score: s.score,
    emb: s.emb,
    rr: s.rr,
    cross: s.cross,
    mantidaPorA: s.mantidaPorA,
    mantidaPorB: s.mantidaPorB,
    updatedAt: fromIso(s.updatedAt, `conexao ${s.id}.updatedAt`),
  }
}

/** Os bytes da imagem entram no arquivo em base64, como o embedding: o backup restaura tudo. */
export function anexoToSnapshot(a: Anexo, arquivo: ArquivoDoAnexo | undefined): AnexoSnapshot {
  return {
    id: a.id,
    livroId: a.livroId,
    legenda: a.legenda,
    midia: a.midia,
    embedding: a.embedding ? embeddingToBase64(a.embedding) : null,
    ...(arquivo && {
      arquivo: {
        imagem: bytesToBase64(arquivo.imagem),
        miniatura: bytesToBase64(arquivo.miniatura),
      },
    }),
    createdAt: toIso(a.createdAt),
    updatedAt: toIso(a.updatedAt),
  }
}

export function anexoFromSnapshot(s: AnexoSnapshot): {
  anexo: Anexo
  arquivo: ArquivoDoAnexo | undefined
} {
  return {
    anexo: {
      id: s.id,
      livroId: s.livroId,
      legenda: s.legenda,
      midia: s.midia,
      embedding: s.embedding === null ? null : base64ToEmbedding(s.embedding),
      createdAt: fromIso(s.createdAt, `anexo ${s.id}.createdAt`),
      updatedAt: fromIso(s.updatedAt, `anexo ${s.id}.updatedAt`),
    },
    arquivo: s.arquivo && {
      imagem: base64ToBytes(s.arquivo.imagem),
      miniatura: base64ToBytes(s.arquivo.miniatura),
    },
  }
}
