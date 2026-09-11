import {
  OPCOES_SPIKE_PADRAO,
  type CargaDeModelo,
  type Medicao,
  type MensagemDoWorker,
  type MensagemParaWorker,
  type OpcoesSpike,
  type ResultadoSpike,
} from './protocolo'

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`#${id} não existe`)
  return el as T
}

const estado = $('estado')
const saida = $('saida')
const jsonBloco = $('jsonBloco')
const jsonEl = $<HTMLTextAreaElement>('json')
const botaoRodar = $<HTMLButtonElement>('rodar')
const botaoLimpar = $<HTMLButtonElement>('limpar')

const worker = new Worker(new URL('./bench.worker.ts', import.meta.url), { type: 'module' })

// --- memória: só o thread principal enxerga performance.memory ---------------

interface MemoriaChrome {
  usedJSHeapSize: number
}

function heapMb(): number | null {
  const p = performance as Performance & { memory?: MemoriaChrome }
  return p.memory ? Math.round(p.memory.usedJSHeapSize / 1024 / 1024) : null
}

let amostragem: number | undefined
let picoMb = 0
let antesMb = 0

function comecarAmostragem(): void {
  antesMb = heapMb() ?? 0
  picoMb = antesMb
  amostragem = window.setInterval(() => {
    const agora = heapMb()
    if (agora !== null && agora > picoMb) picoMb = agora
  }, 250)
}

function pararAmostragem(): { antesMb: number; picoMb: number; depoisMb: number } | null {
  if (amostragem !== undefined) window.clearInterval(amostragem)
  amostragem = undefined
  const depois = heapMb()
  return depois === null ? null : { antesMb, picoMb, depoisMb: depois }
}

// --- formatação --------------------------------------------------------------

const ms = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(2)} s` : `${Math.round(n)} ms`)
const mb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`

function classe(valor: number, bom: number, ruim: number): string {
  if (valor <= bom) return 'ok'
  if (valor <= ruim) return 'alerta'
  return 'ruim'
}

function cacheLinha(c: CargaDeModelo): [string, string, string] {
  if (c.cacheadoDepois) return ['Guardado no navegador', 'sim', 'ok']
  return ['Guardado no navegador', 'NÃO — rebaixa a cada início a frio', 'ruim']
}

function tabela(titulo: string, linhas: [string, string, string?][]): string {
  const corpo = linhas
    .map(([k, v, cls]) => `<tr><th>${k}</th><td class="${cls ?? ''}">${v}</td></tr>`)
    .join('')
  return `<table><caption>${titulo}</caption><tbody>${corpo}</tbody></table>`
}

function linhaMedicao(
  nome: string,
  m: Medicao,
  bom: number,
  ruim: number,
): [string, string, string] {
  return [
    `${nome} <span style="color:var(--dim)">(p95 ${ms(m.p95)})</span>`,
    ms(m.mediana),
    classe(m.mediana, bom, ruim),
  ]
}

function render(r: ResultadoSpike, memoria: ReturnType<typeof pararAmostragem>): void {
  const a = r.ambiente
  const partes: string[] = []

  partes.push(
    tabela('Aparelho', [
      ['Núcleos', String(a.nucleos)],
      ['Memória declarada', a.memoriaGb ? `${a.memoriaGb} GB` : 'não informada'],
      ['Threads no WASM', a.threadsWasm === null ? 'padrão' : String(a.threadsWasm)],
      [
        'Cross-origin isolated',
        a.crossOriginIsolated ? 'sim' : 'não (WASM sem multithread)',
        a.crossOriginIsolated ? 'ok' : 'alerta',
      ],
      ['WebGPU', a.webgpu ? 'disponível' : 'ausente', a.webgpu ? 'ok' : 'alerta'],
      [
        'Cache de modelos',
        a.cacheDisponivel ? 'disponível' : 'indisponível (contexto inseguro)',
        a.cacheDisponivel ? 'ok' : 'alerta',
      ],
      ['User agent', `<span style="font-size:11px">${a.userAgent}</span>`],
    ]),
  )

  const e = r.embedding
  partes.push(
    tabela('Embedding — ' + e.carga.modelo, [
      [
        'Carregar o modelo',
        `${ms(e.carga.ms)} · ${e.carga.cacheadoAntes ? 'já estava em cache' : mb(e.carga.bytesLidos) + ' da rede'}`,
        classe(e.carga.ms, 5000, 20000),
      ],
      cacheLinha(e.carga),
      ['Dimensão do vetor', String(e.dim)],
      ['Primeira inferência', ms(e.primeiraMs), classe(e.primeiraMs, 500, 2000)],
      linhaMedicao('Texto curto (~200 chars)', e.curto, 60, 250),
      linhaMedicao('Texto longo (~1000 chars)', e.longo, 150, 600),
    ]),
  )

  if (r.reranker) {
    const rr = r.reranker
    partes.push(
      tabela('Reranker — ' + rr.carga.modelo, [
        [
          'Carregar o modelo',
          `${ms(rr.carga.ms)} · ${rr.carga.cacheadoAntes ? 'já estava em cache' : mb(rr.carga.bytesLidos) + ' da rede'}`,
          classe(rr.carga.ms, 8000, 30000),
        ],
        cacheLinha(rr.carga),
        ['Primeira inferência', ms(rr.primeiraMs), classe(rr.primeiraMs, 800, 3000)],
        linhaMedicao('Por par', rr.porPar, 120, 400),
        ['Score de exemplo', rr.exemploScore.toFixed(3)],
      ]),
    )
  } else if (r.rerankerErro) {
    partes.push(tabela('Reranker', [['Falhou', `<span class="ruim">${r.rerankerErro}</span>`]]))
  }

  const c = r.cenario
  partes.push(
    tabela('O que isso significa no uso', [
      [
        `Criar um neurônio (1 embedding + ${OPCOES_SPIKE_PADRAO.paresReranker > 0 ? 6 : 0} pares)`,
        ms(c.criarNeuronioMs),
        classe(c.criarNeuronioMs, 1000, 4000),
      ],
      [
        `Reprocessar ${c.tamanhoPalacio} neurônios`,
        ms(c.reprocessarTudoMs),
        classe(c.reprocessarTudoMs, 30000, 180000),
      ],
      ['Duração total deste teste', ms(r.totalMs)],
    ]),
  )

  if (r.qualidade) {
    const q = r.qualidade
    const linhas = q.arestas
      .map(
        (x) =>
          `<tr><th>${x.a} <span style="color:var(--dim)">↔</span> ${x.b}` +
          (x.cross ? ` <span class="alerta">● ${x.livroA}→${x.livroB}</span>` : '') +
          `</th><td>${x.score.toFixed(3)}<br><span style="color:var(--dim);font-size:11px">emb ${x.emb.toFixed(2)} · rr ${x.rr === null ? '—' : x.rr.toFixed(3)}</span></td></tr>`,
      )
      .join('')

    partes.push(
      `<table><caption>Conexões que os modelos produzem no seed (${ms(q.msTotal)})</caption><tbody>${linhas}</tbody></table>`,
      tabela('Sanidade do grafo', [
        ['Arestas', String(q.arestas.length)],
        ['Douradas (entre livros)', String(q.arestas.filter((x) => x.cross).length)],
        [
          'Órfãos',
          q.orfaos.length === 0 ? 'nenhum' : q.orfaos.join(', '),
          q.orfaos.length === 0 ? 'ok' : 'ruim',
        ],
      ]),
      tabela('Calibração — o divisor derivado contra o cosseno real', [
        ['escalaEmb derivado do corpus', q.escalaEmb.toFixed(4)],
        [
          'Bruto: mediana / p90 / máx',
          `${q.distribuicaoBruto.p50.toFixed(3)} / ${q.distribuicaoBruto.p90.toFixed(3)} / ${q.distribuicaoBruto.max.toFixed(3)}`,
        ],
        [
          'Centralizado: mediana / p90 / máx',
          `${q.distribuicaoCentralizado.p50.toFixed(3)} / ${q.distribuicaoCentralizado.p90.toFixed(3)} / ${q.distribuicaoCentralizado.max.toFixed(3)}`,
          q.distribuicaoCentralizado.max >= 0.3 ? 'ok' : 'ruim',
        ],
        ['Maior cosseno centralizado do corpus', q.distribuicaoCentralizado.max.toFixed(3)],
      ]),
      tabela(
        'Melhores pares por cosseno BRUTO',
        q.topBruto.map((p): [string, string] => [
          `${p.a} ↔ ${p.b}${p.cross ? ' <span class="alerta">●</span>' : ''}`,
          p.cosBruto.toFixed(3),
        ]),
      ),
      tabela(
        'Melhores pares por cosseno CENTRALIZADO',
        q.topCentralizado.map((p): [string, string] => [
          `${p.a} ↔ ${p.b}${p.cross ? ' <span class="alerta">●</span>' : ''}`,
          p.cosCentralizado.toFixed(3),
        ]),
      ),
    )
  }

  if (memoria) {
    partes.push(
      tabela('Heap JS (NÃO mede o WASM — os modelos não aparecem aqui)', [
        ['Antes', `${memoria.antesMb} MB`],
        ['Pico', `${memoria.picoMb} MB`],
        ['Depois', `${memoria.depoisMb} MB`],
        [
          'Proxy real de memória',
          `${mb(e.carga.bytesLidos + (r.reranker?.carga.bytesLidos ?? 0))} de modelo carregado`,
        ],
      ]),
    )
  }

  saida.innerHTML = partes.join('')
  jsonEl.value = JSON.stringify({ ...r, memoria }, null, 1)
  jsonBloco.classList.remove('oculto')
}

// --- orquestração ------------------------------------------------------------

function lerOpcoes(): OpcoesSpike {
  return {
    comReranker: $<HTMLInputElement>('comReranker').checked,
    repeticoesEmbedding: Number($<HTMLInputElement>('repeticoes').value),
    paresReranker: Number($<HTMLInputElement>('pares').value),
    tamanhoPalacio: Number($<HTMLInputElement>('palacio').value),
    medirQualidade: $<HTMLInputElement>('qualidade').checked,
  }
}

function enviar(m: MensagemParaWorker): void {
  worker.postMessage(m)
}

worker.addEventListener('message', (evento: MessageEvent<MensagemDoWorker>) => {
  const m = evento.data

  switch (m.tipo) {
    case 'passo':
      estado.textContent = m.texto
      break
    case 'progresso':
      estado.textContent = `${m.arquivo} — ${m.pct}%`
      break
    case 'cacheLimpo':
      estado.textContent = `Cache limpo. Chaves encontradas: ${m.chaves.join(', ') || 'nenhuma'}`
      botaoLimpar.disabled = false
      break
    case 'pronto': {
      const memoria = pararAmostragem()
      render(m.resultado, memoria)
      estado.textContent = 'Terminou.'
      botaoRodar.disabled = false
      break
    }
    case 'erro':
      pararAmostragem()
      estado.innerHTML = `<span class="ruim">Erro: ${m.mensagem}</span>`
      botaoRodar.disabled = false
      break
  }
})

botaoRodar.addEventListener('click', () => {
  botaoRodar.disabled = true
  saida.innerHTML = ''
  jsonBloco.classList.add('oculto')
  estado.textContent = 'Começando…'
  comecarAmostragem()
  enviar({ tipo: 'rodar', opcoes: lerOpcoes() })
})

botaoLimpar.addEventListener('click', () => {
  botaoLimpar.disabled = true
  estado.textContent = 'Limpando…'
  enviar({ tipo: 'limparCache' })
})

estado.textContent = `Pronto. Padrão: ${OPCOES_SPIKE_PADRAO.repeticoesEmbedding} textos, ${OPCOES_SPIKE_PADRAO.paresReranker} pares.`
