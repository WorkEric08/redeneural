import { useMemo } from 'react'

import { Movel } from '@/features/estante/Movel'
import { montarEstante } from '@/features/estante/resumo'
import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * A estante: seus livros vistos de fora.
 *
 * A porta de entrada ainda fica para depois — o resto do acabamento
 * (madeira, ouro como luz) já chegou aqui.
 */
export default function Estante() {
  const { livros, neuronios, conexoes, carregado, erro } = usePalacio()

  const estante = useMemo(
    () => montarEstante(livros, neuronios, conexoes),
    [livros, neuronios, conexoes],
  )

  return (
    <div className="animar-entrada flex flex-col gap-5">
      {erro && (
        <p className="text-destructive border-destructive/40 bg-parede sombra-superficie rounded-lg border p-3 text-sm">
          {erro}
        </p>
      )}

      {/* A altura mínima é a tela inteira menos o respiro do topo (pt-6): o
          `mt-auto` empurra a contagem até a mesma altura do botão de criar
          (h-14, como .dial-botao).

          Só abaixo de 1024 px: no desktop não existe dial para alinhar (a
          navegação é a coluna fixa — ver Dial.tsx). */}
      <div className="flex min-h-[calc(100dvh_-_48px_-_env(safe-area-inset-bottom))] flex-col lg:min-h-0">
        <Movel estante={estante} />

        <p className="text-poeira mt-auto flex h-14 items-center text-xs">
          {carregado
            ? `${contar(livros.length, 'livro', 'livros')} · ${contar(neuronios.length, 'neurônio', 'neurônios')} · ${contar(conexoes.length, 'conexão', 'conexões')}`
            : 'Abrindo o palácio…'}
        </p>
      </div>
    </div>
  )
}
