import { medidaReduzida, type Medida } from '@/lib/imagem'

/** A imagem que o acervo guarda — o bastante para ler numa tela de celular grande. */
const LADO_DA_IMAGEM = 1600
/** Para a grade da pasta e o cartão da Rede. */
const LADO_DA_MINIATURA = 320
const QUALIDADE = 0.82

export interface ImagemReduzida {
  imagem: Uint8Array
  miniatura: Uint8Array
  /** `image/webp`, ou o que o navegador souber codificar se não souber WebP. */
  mime: string
  largura: number
  altura: number
}

async function codificar(bitmap: ImageBitmap, medida: Medida): Promise<Blob> {
  const tela = new OffscreenCanvas(medida.largura, medida.altura)
  const ctx = tela.getContext('2d')
  if (!ctx) throw new Error('este navegador não desenha em OffscreenCanvas')
  ctx.drawImage(bitmap, 0, 0, medida.largura, medida.altura)
  return tela.convertToBlob({ type: 'image/webp', quality: QUALIDADE })
}

/**
 * Reduz a foto que veio da galeria antes de gravar: uma foto de celular tem
 * 3-8 MB, e cem delas encheriam a cota do navegador à toa. Reescrever os
 * pixels também deixa para trás os metadados da câmera — inclusive o GPS.
 *
 * Roda dentro do Worker (`createImageBitmap` e `OffscreenCanvas` existem lá),
 * para decodificar uma foto grande não travar a tela. No nativo, isto vira as
 * opções de tamanho do plugin de câmera — outro arquivo, a mesma assinatura.
 */
export async function reduzirImagem(bytes: Uint8Array, mime: string): Promise<ImagemReduzida> {
  const bitmap = await createImageBitmap(new Blob([bytes.slice()], { type: mime }))

  try {
    const medida = medidaReduzida(bitmap.width, bitmap.height, LADO_DA_IMAGEM)
    const [imagem, miniatura] = await Promise.all([
      codificar(bitmap, medida),
      codificar(bitmap, medidaReduzida(bitmap.width, bitmap.height, LADO_DA_MINIATURA)),
    ])

    return {
      imagem: new Uint8Array(await imagem.arrayBuffer()),
      miniatura: new Uint8Array(await miniatura.arrayBuffer()),
      mime: imagem.type,
      largura: medida.largura,
      altura: medida.altura,
    }
  } finally {
    bitmap.close()
  }
}
