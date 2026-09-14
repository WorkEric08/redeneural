import { z } from 'zod'

/** CLAUDE.md §7: validar a entrada antes de gravar no IndexedDB. */

const id = z.string().min(1)
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'cor deve ser hex #rrggbb')
const unitInterval = z.number().min(0).max(1)

const ordem = z.number().int().min(0)
const emblema = z.string().min(1).max(30).nullable()
const larguraLombada = z.number().min(16).max(120).nullable()
const comprimentoLombada = z.number().min(20).max(100).nullable()

export const livroSchema = z.object({
  id,
  titulo: z.string().trim().min(1).max(120),
  cor: hexColor,
  prateleira: ordem,
  ordem,
  emblema,
  larguraLombada,
  comprimentoLombada,
  createdAt: z.date(),
})

export const vagaSchema = z.object({
  prateleira: ordem,
  ordem,
})

export const etiquetaSchema = z.object({
  prateleira: ordem,
  texto: z.string().trim().min(1).max(60),
})

export const neuronioSchema = z.object({
  id,
  livroId: id,
  titulo: z.string().trim().min(1).max(200),
  conteudo: z.string().max(20_000),
  embedding: z.instanceof(Float32Array).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const conexaoSchema = z
  .object({
    id,
    aId: id,
    bId: id,
    score: unitInterval,
    emb: unitInterval,
    rr: unitInterval.nullable(),
    cross: z.boolean(),
    mantidaPorA: z.boolean(),
    mantidaPorB: z.boolean(),
    updatedAt: z.date(),
  })
  .refine((c) => c.mantidaPorA || c.mantidaPorB, {
    message: 'aresta que nenhum dos dois lados mantém não deveria existir',
  })
  .refine((c) => c.aId < c.bId, {
    message: 'conexão precisa estar em ordem canônica (aId < bId)',
    path: ['aId'],
  })
  .refine((c) => c.aId !== c.bId, { message: 'conexão não pode ligar um neurônio a si mesmo' })

const isoDate = z.string().refine((s) => !Number.isNaN(new Date(s).getTime()), 'data ISO inválida')
const base64 = z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, 'base64 inválido')

export const snapshotSchema = z.object({
  version: z.literal(1),
  exportedAt: isoDate,
  livros: z.array(
    z.object({
      id,
      titulo: z.string(),
      cor: hexColor,
      // Opcional: backup de antes de 12/09/2026 não tinha ordem de estante.
      ordem: ordem.optional(),
      // Opcional: backup de antes da Fase 10 (13-14/09/2026) não tinha prateleira.
      prateleira: ordem.optional(),
      // Opcional: backup de antes da Fase 16 não tinha emblema.
      emblema: emblema.optional(),
      // Opcional: backup de antes da Fase 19 não tinha largura própria.
      larguraLombada: larguraLombada.optional(),
      // Opcional: backup de antes de 14/09/2026 não tinha comprimento próprio.
      comprimentoLombada: comprimentoLombada.optional(),
      createdAt: isoDate,
    }),
  ),
  neuronios: z.array(
    z.object({
      id,
      livroId: id,
      titulo: z.string(),
      conteudo: z.string(),
      embedding: base64.nullable(),
      createdAt: isoDate,
      updatedAt: isoDate,
    }),
  ),
  conexoes: z.array(
    z.object({
      id,
      aId: id,
      bId: id,
      score: unitInterval,
      emb: unitInterval,
      rr: unitInterval.nullable(),
      cross: z.boolean(),
      mantidaPorA: z.boolean(),
      mantidaPorB: z.boolean(),
      updatedAt: isoDate,
    }),
  ),
  // Ausente em backup de antes da Fase 15 — trata como estante sem etiqueta nenhuma.
  etiquetas: z.array(etiquetaSchema).optional().default([]),
  // Ausente em backup de antes dos lugares fixos (14/09/2026) — nenhuma vaga aberta.
  vagas: z.array(vagaSchema).optional().default([]),
})
