// Sobe o servidor com HTTPS na rede local e imprime o endereço do spike.
// HTTPS é obrigatório aqui: sem contexto seguro o Cache API não existe, e o
// celular rebaixaria os modelos a cada teste.
import { spawn } from 'node:child_process'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === 'IPv4' && !a.internal && a.address.startsWith('192.168.'))
  .map((a) => a.address)

console.log('\n  Abra no celular, na mesma rede Wi-Fi:\n')
for (const ip of ips) console.log(`    https://${ip}:5173/spike.html`)
if (ips.length === 0) {
  console.log('    (nenhum IP 192.168.x.x — use o endereço "Network" que o Vite imprimir abaixo)')
}
console.log('\n  O certificado é autoassinado: o Chrome vai avisar.')
console.log('  Toque em "Avançado" e depois em "Ir para o site" — o contexto continua')
console.log('  seguro, que é o que faz o cache dos modelos funcionar.\n')

const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
spawn(process.execPath, [vite, '--host'], {
  stdio: 'inherit',
  env: { ...process.env, HTTPS: '1' },
})
