import { useEffect, useState } from 'react'

import type { AnexoNaTela } from '@/core'
import { usePalacio } from '@/store/palacio'

/**
 * O endereço (`blob:`) da imagem de um anexo, ou `null` enquanto ela não
 * chegou — ou se o anexo não é imagem.
 *
 * Os bytes nunca viajam com o estado: são pedidos ao motor só por quem vai
 * desenhar, e o endereço é devolvido ao navegador quando a tela sai.
 */
export function useImagemDoAnexo(
  anexo: AnexoNaTela | undefined,
  tamanho: 'miniatura' | 'inteira',
): string | null {
  const lerImagem = usePalacio((s) => s.lerImagem)
  const [pronta, setPronta] = useState<{ chave: string; url: string } | null>(null)

  const id = anexo?.id
  const mime = anexo?.midia.tipo === 'imagem' ? anexo.midia.mime : null
  // `updatedAt` na chave: trocar a imagem de um item mantém o id dele, e sem isto a tela
  // seguiria mostrando a antiga.
  const quando = anexo?.updatedAt.getTime()
  const chave = id && mime ? `${id}:${tamanho}:${String(quando)}` : null

  useEffect(() => {
    if (!id || !mime || !chave) return

    let viva = true
    let criada: string | null = null
    void lerImagem(id, tamanho).then((bytes) => {
      if (!viva || !bytes) return
      criada = URL.createObjectURL(new Blob([bytes.slice()], { type: mime }))
      setPronta({ chave, url: criada })
    })

    return () => {
      viva = false
      if (criada) URL.revokeObjectURL(criada)
    }
  }, [id, mime, chave, tamanho, lerImagem])

  return pronta?.chave === chave ? pronta.url : null
}
