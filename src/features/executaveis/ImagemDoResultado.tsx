import { ImageIcon } from 'lucide-react'

import type { NeuronioNaTela } from '@/core'

import { useImagemDoResultado } from './useImagemDoResultado'

interface Props {
  neuronio: Pick<NeuronioNaTela, 'id' | 'resultadoImagem' | 'ultimoToque'>
  tamanho?: 'miniatura' | 'inteira'
  /** Quem chama decide a caixa (proporção, cantos); aqui só se preenche. */
  className?: string
}

/**
 * A imagem do resultado de uma ideia feita, no desenho de sempre das imagens do app
 * (`Miniatura`): caixa `bg-realce`, cantos redondos, e o glifo no lugar enquanto os
 * bytes não chegam. Decorativa (`alt=""`) — o título da ideia está sempre ao lado.
 *
 * Inteira, a caixa já nasce na proporção da imagem: reserva o espaço antes de os bytes
 * chegarem, e nada pula quando ela aparece.
 */
export function ImagemDoResultado({ neuronio, tamanho = 'miniatura', className = '' }: Props) {
  const url = useImagemDoResultado(neuronio, tamanho)
  const imagem = neuronio.resultadoImagem
  const proporcao =
    tamanho === 'inteira' && imagem
      ? { aspectRatio: `${String(imagem.largura)} / ${String(imagem.altura)}` }
      : undefined

  return (
    <span
      className={`bg-realce text-poeira relative block overflow-hidden ${className}`}
      style={proporcao}
    >
      {url ? (
        <img
          src={url}
          alt=""
          draggable={false}
          className={`size-full ${tamanho === 'inteira' ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          <ImageIcon size={22} aria-hidden />
        </span>
      )}
    </span>
  )
}
