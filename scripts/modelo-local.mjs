// Baixa o modelo do HuggingFace e o deixa dentro do `dist`, no formato que o
// transformers.js espera de um modelo local: `<localModelPath>/<id>/<arquivo>`.
//
// Só o build do Android usa isto. No app da web o modelo continua vindo do
// HuggingFace na primeira execução — 129 MB no `dist` fariam o deploy inteiro
// carregar um peso que só o APK precisa.
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODELO = 'Xenova/multilingual-e5-small'

/**
 * Os quatro arquivos que o `pipeline('feature-extraction', …, { dtype: 'q8' })`
 * pede. Conferidos no `transformers-cache` depois de uma carga a frio: não há
 * um quinto, e baixar a mais só engorda o APK.
 */
const ARQUIVOS = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'onnx/model_quantized.onnx',
]

const raiz = fileURLToPath(new URL('..', import.meta.url))

// Fora do `dist`, que o `vite build` apaga inteiro: 129 MB não podem ser
// rebaixados a cada build.
const guardados = join(raiz, 'node_modules', '.cache', 'palacio-modelo')

const MB = 1024 * 1024

async function tamanho(caminho) {
  try {
    return (await stat(caminho)).size
  } catch {
    return -1
  }
}

async function baixar(arquivo) {
  const destino = join(guardados, arquivo)
  const url = `https://huggingface.co/${MODELO}/resolve/main/${arquivo}`

  const resposta = await fetch(url)
  if (!resposta.ok) {
    throw new Error(`${arquivo}: ${String(resposta.status)} ${resposta.statusText}`)
  }

  const bytes = Buffer.from(await resposta.arrayBuffer())
  await mkdir(dirname(destino), { recursive: true })

  // Grava num temporário e renomeia: um Ctrl-C no meio não deixa um arquivo
  // truncado que a próxima execução aceitaria como pronto.
  const parcial = `${destino}.parcial`
  await writeFile(parcial, bytes)
  await rename(parcial, destino)

  return bytes.length
}

/** Deixa os arquivos do modelo em `destinoRaiz/<id>/…`. */
export async function modeloLocal(destinoRaiz) {
  let baixados = 0
  let total = 0

  for (const arquivo of ARQUIVOS) {
    const guardado = join(guardados, arquivo)
    let bytes = await tamanho(guardado)

    if (bytes < 0) {
      process.stdout.write(`  baixando ${arquivo}… `)
      bytes = await baixar(arquivo)
      baixados += bytes
      process.stdout.write(`${(bytes / MB).toFixed(1)} MB\n`)
    }

    total += bytes

    const destino = join(destinoRaiz, MODELO, arquivo)
    await mkdir(dirname(destino), { recursive: true })
    await writeFile(destino, await readFile(guardado))
  }

  return { total, baixados }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const destino = process.argv[2] ?? join(raiz, 'dist', 'modelos')
  const { total, baixados } = await modeloLocal(destino)
  console.log(
    `modelo em ${destino} — ${(total / MB).toFixed(1)} MB` +
      (baixados > 0 ? ` (${(baixados / MB).toFixed(1)} MB da rede)` : ' (tudo reaproveitado)'),
  )
}
