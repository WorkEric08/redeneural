/**
 * Escolher uma imagem da galeria ou da câmera.
 *
 * Mora em `services/native/` pelo mesmo critério de `gestos.ts` (CLAUDE.md §4):
 * no navegador — e na WebView do Capacitor, que também sabe abrir o seletor —
 * é um `<input type="file">`; quando o app virar APK de verdade, isto pode
 * virar `@capacitor/camera` sem quem chama saber.
 *
 * Precisa ser chamado dentro do toque (o navegador só abre o seletor num gesto
 * da pessoa).
 */
export interface ImagemEscolhida {
  bytes: Uint8Array
  mime: string
}

export function escolherImagem(): Promise<ImagemEscolhida | null> {
  return new Promise((resolver) => {
    const campo = document.createElement('input')
    campo.type = 'file'
    campo.accept = 'image/*'

    campo.addEventListener('change', () => {
      const arquivo = campo.files?.[0]
      if (!arquivo) {
        resolver(null)
        return
      }
      void arquivo.arrayBuffer().then(
        (buffer) => {
          resolver({ bytes: new Uint8Array(buffer), mime: arquivo.type || 'image/jpeg' })
        },
        () => {
          resolver(null)
        },
      )
    })
    // Fechar o seletor sem escolher nada. Navegador que não dispara `cancel`
    // só deixa a promessa esperando — quem chama não fica travado por isso.
    campo.addEventListener('cancel', () => {
      resolver(null)
    })

    campo.click()
  })
}
