/**
 * Entrada e saída de arquivo.
 *
 * Fica em `services/native/` porque é exatamente o tipo de coisa que troca no
 * empacotamento (CLAUDE.md §4). Na web é `<a download>`; dentro da WebView do
 * Android esse link não faz absolutamente nada — clicar não abre, não salva,
 * não avisa — e aí o backup passa pelo Filesystem e pela folha de
 * compartilhamento. Quem chama não muda.
 */
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const UM_SEGUNDO = 1000

/**
 * Onde o arquivo foi parar. A frase que o usuário lê muda conforme o caminho, e
 * quem decide a frase é a tela — não este adapter.
 */
export type Destino = { tipo: 'download' } | { tipo: 'compartilhado' }

export async function salvarTexto(
  nome: string,
  conteudo: string,
  tipo = 'application/json',
): Promise<Destino> {
  if (Capacitor.isNativePlatform()) {
    await compartilhar(nome, conteudo)
    return { tipo: 'compartilhado' }
  }

  baixar(nome, conteudo, tipo)
  return { tipo: 'download' }
}

/**
 * `Directory.Cache` de propósito: é a única pasta que não pede permissão em
 * nenhuma versão do Android. O arquivo não fica morando lá — a folha de
 * compartilhamento é que leva a cópia para onde o usuário escolher.
 */
async function compartilhar(nome: string, conteudo: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({
    path: nome,
    data: conteudo,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })

  await Share.share({ title: nome, files: [uri] })
}

function baixar(nome: string, conteudo: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement('a')

  link.href = url
  link.download = nome
  document.body.append(link)
  link.click()
  link.remove()

  // O navegador precisa do blob vivo até começar a gravar; revogar na hora
  // cancela o download em alguns navegadores.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, UM_SEGUNDO)
}

export function lerTexto(arquivo: File): Promise<string> {
  return arquivo.text()
}

/** `palacio-mental-2026-09-10.json` */
export function nomeDoBackup(agora: Date = new Date()): string {
  return `palacio-mental-${agora.toISOString().slice(0, 10)}.json`
}
