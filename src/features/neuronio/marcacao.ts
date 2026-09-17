/**
 * A marcação que a barra de escrita aplica ao texto do neurônio.
 *
 * Markdown em texto puro, e não formatação de verdade (decisão do usuário,
 * 16/09/2026): `conteudo` continua sendo a mesma `string` de sempre — o
 * contrato do núcleo, o que o modelo lê e o que viaja no backup não mudam.
 * O preço é a marcação ficar à vista enquanto se escreve; o ganho é nenhuma
 * migração, nenhum HTML para sanitizar e nenhum risco para o Android.
 *
 * Tudo aqui é função pura sobre `{ texto, início, fim }` — a mesma tripla que
 * um `<textarea>` entrega e recebe. Quem chama não precisa saber de DOM, e o
 * comportamento fica testável sem navegador.
 */

export interface Selecao {
  texto: string
  inicio: number
  fim: number
}

export type TipoDeLista = 'marcador' | 'numero' | 'tarefa'

/** Qualquer marcador de lista no começo da linha — para não empilhar dois. */
const PREFIXO_DE_LISTA = /^(?:- \[[ xX]\] |- |\d+\. )/
const RECUO = '  '
const NIVEIS_DE_TITULO = ['', '# ', '## ', '### ']

/** Separa o recuo do resto: o marcador de lista vem depois dos espaços. */
function partirRecuo(linha: string): [string, string] {
  const recuo = /^[ \t]*/.exec(linha)?.[0] ?? ''
  return [recuo, linha.slice(recuo.length)]
}

/**
 * As linhas que a seleção toca, com onde elas começam e terminam no texto.
 * Uma marcação de linha (lista, título, recuo) age na linha inteira, mesmo que
 * o dedo só tenha pegado uma palavra no meio dela.
 */
function blocoDeLinhas(texto: string, inicio: number, fim: number) {
  const comeco = texto.lastIndexOf('\n', inicio - 1) + 1
  const quebra = texto.indexOf('\n', fim)
  const termino = quebra === -1 ? texto.length : quebra
  return { comeco, termino, linhas: texto.slice(comeco, termino).split('\n') }
}

/**
 * Troca as linhas tocadas e devolve a seleção de novo por cima delas.
 *
 * Com o cursor parado (sem seleção) ele anda junto com o que entrou na frente
 * da linha, em vez de virar uma seleção da linha inteira — quem tocou "lista"
 * quer continuar digitando, não quer o texto marcado.
 */
function aplicarNasLinhas(s: Selecao, transformar: (linhas: string[]) => string[]): Selecao {
  const { comeco, termino, linhas } = blocoDeLinhas(s.texto, s.inicio, s.fim)
  const novas = transformar(linhas)
  const trecho = novas.join('\n')
  const texto = s.texto.slice(0, comeco) + trecho + s.texto.slice(termino)

  if (s.inicio === s.fim) {
    const delta = (novas[0]?.length ?? 0) - (linhas[0]?.length ?? 0)
    const cursor = Math.max(comeco, s.inicio + delta)
    return { texto, inicio: cursor, fim: cursor }
  }
  return { texto, inicio: comeco, fim: comeco + trecho.length }
}

/**
 * Negrito, itálico e tachado: envolve a seleção, ou desfaz se ela já estiver
 * envolvida — por dentro (`|**isto**|`) ou por fora (`**|isto|**`), porque o
 * dedo acerta os dois jeitos e os dois querem dizer "tira".
 *
 * Sem nada selecionado, deixa o par pronto e o cursor no meio dele.
 */
export function alternarEnvolvido({ texto, inicio, fim }: Selecao, marca: string): Selecao {
  const n = marca.length
  const antes = texto.slice(0, inicio)
  const dentro = texto.slice(inicio, fim)
  const depois = texto.slice(fim)

  if (antes.endsWith(marca) && depois.startsWith(marca)) {
    return {
      texto: antes.slice(0, -n) + dentro + depois.slice(n),
      inicio: inicio - n,
      fim: fim - n,
    }
  }

  if (dentro.length >= 2 * n && dentro.startsWith(marca) && dentro.endsWith(marca)) {
    const limpo = dentro.slice(n, -n)
    return { texto: antes + limpo + depois, inicio, fim: inicio + limpo.length }
  }

  return {
    texto: antes + marca + dentro + marca + depois,
    inicio: inicio + n,
    fim: fim + n,
  }
}

function marcadorDe(tipo: TipoDeLista, indice: number): string {
  if (tipo === 'numero') return `${String(indice + 1)}. `
  return tipo === 'tarefa' ? '- [ ] ' : '- '
}

function jaEDoTipo(resto: string, tipo: TipoDeLista): boolean {
  if (tipo === 'numero') return /^\d+\. /.test(resto)
  if (tipo === 'tarefa') return /^- \[[ xX]\] /.test(resto)
  return /^- (?!\[[ xX]\] )/.test(resto)
}

/**
 * Lista com marcador, numerada ou de tarefas.
 *
 * Só tira quando **todas** as linhas tocadas já são daquele tipo; com uma
 * linha de fora, marca todas — é o que qualquer editor faz, e evita o botão
 * virar uma loteria numa seleção de cinco linhas. Trocar de tipo troca o
 * marcador em vez de empilhar um na frente do outro.
 */
export function alternarLista(s: Selecao, tipo: TipoDeLista): Selecao {
  return aplicarNasLinhas(s, (linhas) => {
    const partes = linhas.map(partirRecuo)
    const todas = partes.every(([, resto]) => jaEDoTipo(resto, tipo))

    return partes.map(([recuo, resto], i) => {
      const limpo = resto.replace(PREFIXO_DE_LISTA, '')
      return todas ? recuo + limpo : recuo + marcadorDe(tipo, i) + limpo
    })
  })
}

/**
 * O "Aa" da referência, que aqui é um botão só: nenhum → `#` → `##` → `###` →
 * nenhum. Markdown não tem tamanho de fonte em número, tem nível de título —
 * e um ciclo cabe onde um menu suspenso não caberia.
 */
export function ciclarTitulo(s: Selecao): Selecao {
  return aplicarNasLinhas(s, (linhas) => {
    const [, primeira] = partirRecuo(linhas[0] ?? '')
    const atual = /^(#{1,3}) /.exec(primeira)?.[1]?.length ?? 0
    const proximo = NIVEIS_DE_TITULO[(atual + 1) % NIVEIS_DE_TITULO.length] ?? ''

    return linhas.map((linha) => {
      const [recuo, resto] = partirRecuo(linha)
      return recuo + proximo + resto.replace(/^#{1,3} /, '')
    })
  })
}

/** Dois espaços por passo — o recuo que o markdown lê como lista aninhada. */
export function mudarRecuo(s: Selecao, direcao: 1 | -1): Selecao {
  return aplicarNasLinhas(s, (linhas) =>
    linhas.map((linha) => {
      if (direcao === 1) return RECUO + linha
      if (linha.startsWith(RECUO)) return linha.slice(RECUO.length)
      return linha.replace(/^[ \t]/, '')
    }),
  )
}
