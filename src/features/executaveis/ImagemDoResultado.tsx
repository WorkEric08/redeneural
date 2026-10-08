import { ImageIcon } from 'lucide-react'

import type { NeuronioNaTela } from '@/core'
import { caixaDaImagem } from '@/lib/caixaDaImagem'

import { useImagemDoResultado } from './useImagemDoResultado'

interface Props {
  neuronio: Pick<NeuronioNaTela, 'id' | 'resultadoImagem' | 'ultimoToque'>
  tamanho?: 'miniatura' | 'inteira'
  /** Quem chama decide a caixa (proporção, cantos); aqui só se preenche. */
  className?: string
  /**
   * Só com `tamanho="inteira"`: até onde a imagem cresce na vertical (um valor CSS, como
   * `24rem`). A caixa encolhe na largura junto, para ser sempre só a imagem.
   */
  alturaMaxima?: string
}

/**
 * A imagem do resultado de uma ideia feita, no desenho de sempre das imagens do app
 * (`Miniatura`): caixa `bg-realce`, cantos redondos, e o glifo no lugar enquanto os
 * bytes não chegam. Decorativa (`alt=""`) — o título da ideia está sempre ao lado.
 *
 * Inteira, a caixa já nasce com a forma da imagem: reserva o espaço antes de os bytes
 * chegarem, nada pula quando ela aparece, e o fundo da caixa nunca sobra nas laterais.
 */
export function ImagemDoResultado({
  neuronio,
  tamanho = 'miniatura',
  className = '',
  alturaMaxima = '70dvh',
}: Props) {
  const url = useImagemDoResultado(neuronio, tamanho)
  const imagem = neuronio.resultadoImagem
  const inteira = tamanho === 'inteira' && imagem !== null

  return (
    <span
      className={`bg-realce text-poeira relative block overflow-hidden ${inteira ? 'mx-auto' : ''} ${className}`}
      style={inteira ? caixaDaImagem(imagem.largura, imagem.altura, alturaMaxima) : undefined}
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
