import { useEffect, useState } from 'react'

import type { NeuronioNaTela } from '@/core'
import { usePalacio } from '@/store/palacio'

/**
 * O endereço (`blob:`) da imagem do resultado de uma ideia, ou `null` enquanto ela não
 * chegou — ou se a ideia não tem imagem. É o `useImagemDoAnexo` para o resultado: os
 * bytes nunca viajam com o estado, são pedidos ao motor por quem vai desenhar, e o
 * endereço é devolvido ao navegador quando a tela sai.
 */
export function useImagemDoResultado(
  neuronio: Pick<NeuronioNaTela, 'id' | 'resultadoImagem' | 'ultimoToque'> | undefined,
  tamanho: 'miniatura' | 'inteira',
): string | null {
  const lerImagem = usePalacio((s) => s.lerImagemDoResultado)
  const [pronta, setPronta] = useState<{ chave: string; url: string } | null>(null)

  const id = neuronio?.id
  const mime = neuronio?.resultadoImagem?.mime ?? null
  // `ultimoToque` na chave: trocar a imagem mantém o id da ideia, e salvar o andamento é
  // um toque — sem isto a tela seguiria mostrando a imagem antiga.
  const quando = neuronio?.ultimoToque.getTime()
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
