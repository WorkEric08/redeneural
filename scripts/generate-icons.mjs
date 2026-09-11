// Gera os PNGs de ícone do PWA a partir de um retângulo sólido + glifo simples.
// Sala e ouro da paleta Encadernação. O ícone desenhado entra na passada final.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const BG = [10, 18, 38]
const FG = [245, 200, 96]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, safeRatio) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  const c = size / 2
  const r = (size / 2) * safeRatio
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c + 0.5, y - c + 0.5)
      // anel simples: dois círculos concêntricos, marcando "neurônio + conexão"
      const onRing = Math.abs(d - r * 0.72) < size * 0.035 || d < r * 0.22
      const px = onRing ? FG : BG
      const o = row + 1 + x * 3
      raw[o] = px[0]
      raw[o + 1] = px[1]
      raw[o + 2] = px[2]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/logo-192.png', png(192, 1))
writeFileSync('public/logo-512.png', png(512, 1))
writeFileSync('public/logo-maskable-512.png', png(512, 0.8))
writeFileSync('public/apple-touch-icon.png', png(180, 1))
console.log('ícones placeholder gerados em public/')
