import { Link } from 'react-router-dom'

import type { LivroNaEstante } from './resumo'

const ALTURA_MINIMA = 104
const ALTURA_MAXIMA = 188

/**
 * Um livro visto de fora.
 *
 * A altura vem da quantidade de neurônios — é a única coisa que a estante conta
 * sem você abrir nada. O título vai gravado em ouro, como numa lombada de verdade.
 */
export function Lombada({ item }: { item: LivroNaEstante }) {
  const altura = ALTURA_MINIMA + item.altura * (ALTURA_MAXIMA - ALTURA_MINIMA)

  return (
    <Link
      to={`/livro/${item.livro.id}`}
      style={{
        // A luz da sala lava a cor do pano: de longe você não vê a cor real do
        // livro, vê o livro sob a luz. Perto — dentro do livro — ela volta inteira.
        background: `color-mix(in oklab, ${item.livro.cor} 58%, var(--lavagem))`,
        height: `${String(Math.round(altura))}px`,
      }}
      className="relative flex w-[3.25rem] shrink-0 items-center justify-center rounded-t-[3px] rounded-b-[1px] shadow-[inset_-4px_0_10px_rgb(0_0_0/0.35)] transition-transform active:translate-y-[2px]"
      aria-label={`${item.livro.titulo}, ${String(item.neuronios)} neurônios`}
    >
      <span
        className="font-titulo text-ouro-gravado px-1 text-[0.8rem] font-semibold tracking-wide whitespace-nowrap [writing-mode:vertical-rl]"
        // O título é gravação, não texto de leitura: some antes de vazar da lombada.
        style={{ maxHeight: `${String(Math.round(altura - 20))}px`, overflow: 'hidden' }}
      >
        {item.livro.titulo}
      </span>

      {item.saindo > 0 && (
        <span
          className="bg-ouro-gravado brilho-ouro absolute top-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full"
          aria-hidden
        />
      )}
    </Link>
  )
}
