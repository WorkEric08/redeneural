// Build incluindo a página do spike. Fora daqui ela não entra no dist:
// o runtime ONNX pesa 23 MB e não é o produto.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const r = spawnSync(process.execPath, [vite, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, SPIKE: '1' },
})
process.exit(r.status ?? 1)
