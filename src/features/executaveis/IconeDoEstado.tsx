import { Circle, CircleCheck, CircleDot } from 'lucide-react'

import type { EstadoDaIdeia } from '@/core'

/**
 * O desenho de cada estado: o círculo vazio, o círculo com o miolo, o círculo
 * marcado. Um `switch` com a tag literal de cada ícone, e não um mapa de
 * componentes — a regra do React Compiler recusa tag vinda de variável (ver
 * `EmblemaDaLombada`).
 */
export function IconeDoEstado({
  estado,
  tamanho = 18,
}: {
  estado: EstadoDaIdeia
  tamanho?: number
}) {
  switch (estado) {
    case 'para_fazer':
      return <Circle size={tamanho} aria-hidden />
    case 'fazendo':
      return <CircleDot size={tamanho} aria-hidden />
    case 'feita':
      return <CircleCheck size={tamanho} aria-hidden />
  }
}
