import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.palaciomental.app',
  appName: 'Palácio Mental',
  webDir: 'dist',
  android: {
    // A inferência roda em Worker/WASM; sem isso a WebView pode matar o processo em background.
    // Preto, para bater com a barra de status e a splash screen do PWA — os
    // três eram Rich Black até 17/09/2026 (ver vite.config.ts).
    backgroundColor: '#000000',
  },
}

export default config
