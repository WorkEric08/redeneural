import {
  BookOpen,
  Feather,
  Flame,
  Hammer,
  Heart,
  Leaf,
  Moon,
  Paperclip,
  Star,
  Sun,
  Zap,
} from 'lucide-react'

/**
 * O emblema, já como ícone na lombada — ou nada, se `chave` for `null` ou
 * não for mais reconhecida (ver `emblemas.ts`).
 *
 * De propósito não é um lookup devolvendo o componente escolhido: o
 * `react-hooks/static-components` do ESLint recusa uma tag JSX vinda de uma
 * variável calculada em tempo de render (mesmo quando, como aqui, ela só
 * aponta para um de oito ícones fixos). Um `switch` com a tag literal de
 * cada ícone escapa da regra e é só código a mais.
 */
export function EmblemaDaLombada({ chave }: { chave: string | null }) {
  const icone = iconeElemento(chave)
  if (!icone) return null
  return (
    <span className="lombada-emblema" aria-hidden>
      {icone}
    </span>
  )
}

function iconeElemento(chave: string | null) {
  switch (chave) {
    case 'estrela':
      return <Star size={11} aria-hidden />
    case 'coracao':
      return <Heart size={11} aria-hidden />
    case 'raio':
      return <Zap size={11} aria-hidden />
    case 'folha':
      return <Leaf size={11} aria-hidden />
    case 'lua':
      return <Moon size={11} aria-hidden />
    case 'sol':
      return <Sun size={11} aria-hidden />
    case 'chama':
      return <Flame size={11} aria-hidden />
    case 'pena':
      return <Feather size={11} aria-hidden />
    // A espécie do livro, que não é escolha de ninguém (08/10/2026): o mesmo ícone do tipo
    // na tela de criar — livro, executável (martelo) ou pasta (clipe). É o que distingue
    // um livro do outro sem abrir (ver Lombada).
    case 'livro':
      return <BookOpen size={11} aria-hidden />
    case 'executavel':
      return <Hammer size={11} aria-hidden />
    case 'pasta':
      return <Paperclip size={11} aria-hidden />
    default:
      return null
  }
}
