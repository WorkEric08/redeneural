// O build que vira APK.
//
// Diferença para o `npm run build`: o modelo vai junto, dentro do pacote. É a
// regra 2 do CLAUDE.md levada a sério — um app que só funciona depois de baixar
// 129 MB não é offline-first, é offline-depois. Aqui a primeira execução já
// acha tudo em disco e nunca toca a rede.
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { modeloLocal } from './modelo-local.mjs'

const raiz = fileURLToPath(new URL('..', import.meta.url))

// Os binários pelo caminho real, não por `npx`: assim o script roda igual no
// Windows e no resto, sem shell no meio.
const bin = (caminho) => fileURLToPath(new URL(`../node_modules/${caminho}`, import.meta.url))

function rodar(caminho, argumentos, env = {}) {
  const r = spawnSync(process.execPath, [bin(caminho), ...argumentos], {
    stdio: 'inherit',
    cwd: raiz,
    env: { ...process.env, ...env },
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

rodar('typescript/bin/tsc', ['-b'])

// A flag diz "isto vai virar APK": o adapter de embedding passa a procurar o
// modelo em `/modelos/`, e o service worker sai de cena — dentro da WebView ele
// só duplicaria, em cache, arquivos que já estão no pacote.
rodar('vite/bin/vite.js', ['build'], { VITE_ANDROID: '1' })

// Depois do build: o `vite build` esvazia o `dist`.
console.log('\nmodelo:')
const { total, baixados } = await modeloLocal(join(raiz, 'dist', 'modelos'))
const MB = 1024 * 1024
console.log(
  `  ${(total / MB).toFixed(1)} MB${baixados > 0 ? ` (${(baixados / MB).toFixed(1)} MB da rede)` : ' (reaproveitado)'}\n`,
)

rodar('@capacitor/cli/bin/capacitor', ['sync', 'android'])

console.log('\nPronto. O projeto Android está em ./android — falta só compilá-lo:')
console.log('  npx cap open android     (Android Studio)')
console.log('  cd android && ./gradlew assembleDebug')
