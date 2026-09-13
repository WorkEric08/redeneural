import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.palaciomental.app',
  appName: 'Palácio Mental',
  webDir: 'dist',
  android: {
    // A inferência roda em Worker/WASM; sem isso a WebView pode matar o processo em background.
    backgroundColor: '#0d1b2a',
  },
}

export default config
