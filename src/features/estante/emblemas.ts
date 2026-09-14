import { Feather, Flame, Heart, Leaf, Moon, Star, Sun, Zap, type LucideIcon } from 'lucide-react'

/**
 * O emblema de um livro — um ícone extra na lombada, além da cor, para
 * diferenciar livros parecidos sem depender só do nome.
 *
 * Nunca dourado: essa cor é reservada para a ponte entre livros (ver
 * CLAUDE.md, "Direção visual"). Um emblema é decoração do livro, não um
 * achado do palácio.
 */

export interface OpcaoDeEmblema {
  chave: string
  rotulo: string
  Icone: LucideIcon
}

export const EMBLEMAS: readonly OpcaoDeEmblema[] = [
  { chave: 'estrela', rotulo: 'Estrela', Icone: Star },
  { chave: 'coracao', rotulo: 'Coração', Icone: Heart },
  { chave: 'raio', rotulo: 'Raio', Icone: Zap },
  { chave: 'folha', rotulo: 'Folha', Icone: Leaf },
  { chave: 'lua', rotulo: 'Lua', Icone: Moon },
  { chave: 'sol', rotulo: 'Sol', Icone: Sun },
  { chave: 'chama', rotulo: 'Chama', Icone: Flame },
  { chave: 'pena', rotulo: 'Pena', Icone: Feather },
] as const
