/**
 * Entrada e saída de arquivo.
 *
 * Fica em `services/native/` porque é exatamente o tipo de coisa que troca no empacotamento
 * (CLAUDE.md §4). Na web de desktop é `<a download>`; no celular a folha de compartilhar do sistema
 * (é por ela que o arquivo chega ao Drive, ao e-mail ou ao WhatsApp); dentro da WebView do Android
 * o `<a download>` não faz absolutamente nada — não abre, não salva, não avisa —, então o arquivo
 * passa pelo Filesystem e pelo Share do Capacitor. Quem chama não muda.
 */
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const DEZ_SEGUNDOS = 10_000

/**
 * Onde o arquivo foi parar. A frase que a pessoa lê muda conforme o caminho, e quem decide a frase
 * é a tela — não este adapter. `cancelado`: ela fechou a folha de compartilhar sem escolher nada.
 */
export type Destino = { tipo: 'download' } | { tipo: 'compartilhado' } | { tipo: 'cancelado' }

export async function salvarTexto(
  nome: string,
  conteudo: string,
  tipo = 'application/json',
): Promise<Destino> {
  if (Capacitor.isNativePlatform()) {
    return compartilharNoNativo(nome, conteudo)
  }

  // Só no toque: no desktop a folha de compartilhar do sistema atrapalha mais do que ajuda, e quem
  // salva ali espera um arquivo na pasta de downloads.
  const arquivo = new File([conteudo], nome, { type: tipo })
  if (navegadorCompartilhaArquivo(arquivo)) {
    try {
      await navigator.share({ files: [arquivo], title: nome })
      return { tipo: 'compartilhado' }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return { tipo: 'cancelado' }
      // O navegador só deixa compartilhar logo depois de um toque, e exportar uma rede grande pode
      // demorar mais que essa janela: nesse caso (NotAllowedError) o download resolve.
    }
  }

  baixar(nome, conteudo, tipo)
  return { tipo: 'download' }
}

function navegadorCompartilhaArquivo(arquivo: File): boolean {
  if (typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function') {
    return false
  }
  if (!window.matchMedia('(pointer: coarse)').matches) return false
  return navigator.canShare({ files: [arquivo] })
}

/**
 * `Directory.Cache` de propósito: é a única pasta que não pede permissão em nenhuma versão do
 * Android. O arquivo não fica morando lá — a folha de compartilhamento é que leva a cópia para onde
 * a pessoa escolher.
 */
async function compartilharNoNativo(nome: string, conteudo: string): Promise<Destino> {
  const { uri } = await Filesystem.writeFile({
    path: nome,
    data: conteudo,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })

  try {
    await Share.share({ title: nome, files: [uri] })
  } catch (e) {
    // O plugin rejeita quando a folha é fechada sem escolher: não é erro, é desistir.
    if (e instanceof Error && /cancel/i.test(e.message)) return { tipo: 'cancelado' }
    throw e
  }
  return { tipo: 'compartilhado' }
}

function baixar(nome: string, conteudo: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const link = document.createElement('a')

  link.href = url
  link.download = nome
  document.body.append(link)
  link.click()
  link.remove()

  // O navegador precisa do blob vivo até terminar de gravar; revogar cedo demais cancela o download
  // (visto no Chrome com um disco lento), e um backup com imagens pode ter vários MB.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, DEZ_SEGUNDOS)
}

export function lerTexto(arquivo: File): Promise<string> {
  return arquivo.text()
}

/** `locus-2026-10-15.json` */
export function nomeDoBackup(agora: Date = new Date()): string {
  return `locus-${agora.toISOString().slice(0, 10)}.json`
}
