import { ImageIcon, Link2, Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import type { AnexoNaTela } from '@/core'
import { caixaDaImagem } from '@/lib/caixaDaImagem'

import { dominioDe, miniaturaDoLink } from './links'
import { useImagemDoAnexo } from './useImagemDoAnexo'

interface Props {
  anexo: AnexoNaTela
  tamanho?: 'miniatura' | 'inteira'
  /** Quem chama decide a caixa (proporção, cantos); aqui só se preenche. */
  className?: string
  /** Pequena demais para texto: o link mostra só o ícone, sem o domínio embaixo. */
  compacta?: boolean
  /**
   * Só com `tamanho="inteira"`: até onde a imagem cresce na vertical (um valor CSS, como
   * `18rem`). A caixa encolhe na largura junto, para ser sempre só a imagem.
   */
  alturaMaxima?: string
}

/**
 * O rosto de um anexo: a imagem gravada, a miniatura do vídeo ou o domínio do
 * link. Decorativo (`alt=""`) — a legenda está sempre ao lado.
 */
export function Miniatura({
  anexo,
  tamanho = 'miniatura',
  className = '',
  compacta = false,
  alturaMaxima = '70dvh',
}: Props) {
  // Inteira, a caixa já nasce com a forma da imagem: reserva o espaço antes de os bytes
  // chegarem, nada pula quando ela aparece, e o fundo da caixa nunca sobra nas laterais.
  const inteira = tamanho === 'inteira' && anexo.midia.tipo === 'imagem'

  return (
    <span
      className={`bg-realce text-poeira relative block overflow-hidden ${inteira ? 'mx-auto' : ''} ${className}`}
      style={
        anexo.midia.tipo === 'imagem' && inteira
          ? caixaDaImagem(anexo.midia.largura, anexo.midia.altura, alturaMaxima)
          : undefined
      }
    >
      {anexo.midia.tipo === 'imagem' ? (
        <ImagemGravada anexo={anexo} tamanho={tamanho} />
      ) : (
        <RostoDoLink url={anexo.midia.url} compacta={compacta} />
      )}
    </span>
  )
}

function ImagemGravada({
  anexo,
  tamanho,
}: {
  anexo: AnexoNaTela
  tamanho: 'miniatura' | 'inteira'
}) {
  const url = useImagemDoAnexo(anexo, tamanho)
  if (!url) return <Glifo icone={<ImageIcon size={22} aria-hidden />} />
  // Inteira não recorta nada; a miniatura preenche o cartão.
  const ajuste = tamanho === 'inteira' ? 'object-contain' : 'object-cover'
  return <img src={url} alt="" draggable={false} className={`size-full ${ajuste}`} />
}

/**
 * A miniatura do YouTube vem da rede: offline, ou se o vídeo sumiu, o `<img>`
 * falha e fica o glifo com o domínio — o link continua sendo o que é.
 */
function RostoDoLink({ url, compacta }: { url: string; compacta: boolean }) {
  const [falhou, setFalhou] = useState(false)
  const miniatura = miniaturaDoLink(url)

  if (!miniatura || falhou) {
    return (
      <Glifo
        icone={<Link2 size={22} aria-hidden />}
        {...(compacta ? {} : { legenda: dominioDe(url) })}
      />
    )
  }

  return (
    <>
      <img
        src={miniatura}
        alt=""
        loading="lazy"
        draggable={false}
        referrerPolicy="no-referrer"
        onError={() => {
          setFalhou(true)
        }}
        className="size-full object-cover"
      />
      <span className="bg-sala/70 text-papel absolute right-2 bottom-2 grid size-7 place-items-center rounded-full">
        <Play size={14} aria-hidden className="translate-x-px" />
      </span>
    </>
  )
}

function Glifo({ icone, legenda }: { icone: ReactNode; legenda?: string }) {
  return (
    <span className="flex size-full flex-col items-center justify-center gap-1.5 px-3 text-center">
      {icone}
      {legenda && <span className="w-full truncate text-xs">{legenda}</span>}
    </span>
  )
}
