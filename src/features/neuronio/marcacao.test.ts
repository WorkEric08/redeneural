import { describe, expect, it } from 'vitest'

import { alternarEnvolvido, alternarLista, ciclarTitulo, mudarRecuo } from './marcacao'

/** Lê "abc[def]ghi" como o texto "abcdefghi" com "def" selecionado. */
function sel(marcado: string) {
  const inicio = marcado.indexOf('[')
  const fim = marcado.indexOf(']') - 1
  return { texto: marcado.replace(/[[\]]/g, ''), inicio, fim }
}

/** O inverso: devolve o texto com a seleção marcada, para comparar de olho. */
function mostrar({ texto, inicio, fim }: { texto: string; inicio: number; fim: number }) {
  return `${texto.slice(0, inicio)}[${texto.slice(inicio, fim)}]${texto.slice(fim)}`
}

describe('alternarEnvolvido', () => {
  it('envolve a seleção e continua com ela selecionada', () => {
    expect(mostrar(alternarEnvolvido(sel('o [gato] dorme'), '**'))).toBe('o **[gato]** dorme')
  })

  it('tira a marca quando ela está por dentro da seleção', () => {
    expect(mostrar(alternarEnvolvido(sel('o [**gato**] dorme'), '**'))).toBe('o [gato] dorme')
  })

  it('tira a marca quando ela está por fora da seleção', () => {
    expect(mostrar(alternarEnvolvido(sel('o **[gato]** dorme'), '**'))).toBe('o [gato] dorme')
  })

  it('sem seleção, deixa o par pronto com o cursor no meio', () => {
    const r = alternarEnvolvido({ texto: 'oi', inicio: 2, fim: 2 }, '**')
    expect(r.texto).toBe('oi****')
    expect(r.inicio).toBe(4)
    expect(r.fim).toBe(4)
  })
})

describe('alternarLista', () => {
  it('marca todas as linhas tocadas', () => {
    const r = alternarLista(sel('[um\ndois]\ntres'), 'marcador')
    expect(r.texto).toBe('- um\n- dois\ntres')
  })

  it('numera em ordem dentro da seleção', () => {
    const r = alternarLista(sel('[um\ndois\ntres]'), 'numero')
    expect(r.texto).toBe('1. um\n2. dois\n3. tres')
  })

  it('tira quando todas as linhas já são do tipo', () => {
    const r = alternarLista(sel('[- um\n- dois]'), 'marcador')
    expect(r.texto).toBe('um\ndois')
  })

  it('marca todas quando uma está de fora, em vez de virar loteria', () => {
    const r = alternarLista(sel('[- um\ndois]'), 'marcador')
    expect(r.texto).toBe('- um\n- dois')
  })

  it('troca de tipo em vez de empilhar marcador', () => {
    const r = alternarLista(sel('[- um\n- dois]'), 'numero')
    expect(r.texto).toBe('1. um\n2. dois')
  })

  it('guarda o recuo: o marcador entra depois dos espaços', () => {
    const r = alternarLista(sel('[  um]'), 'tarefa')
    expect(r.texto).toBe('  - [ ] um')
  })

  it('com o cursor parado, ele anda junto com o marcador', () => {
    const r = alternarLista({ texto: 'um', inicio: 2, fim: 2 }, 'marcador')
    expect(r.texto).toBe('- um')
    expect(r.inicio).toBe(4)
    expect(r.fim).toBe(4)
  })

  it('a linha tocada no meio vale inteira', () => {
    const r = alternarLista({ texto: 'um\ndois', inicio: 4, fim: 4 }, 'marcador')
    expect(r.texto).toBe('um\n- dois')
  })
})

describe('ciclarTitulo', () => {
  it('sobe um nível a cada toque e volta ao normal no quarto', () => {
    let s = { texto: 'Recursão', inicio: 0, fim: 0 }
    s = ciclarTitulo(s)
    expect(s.texto).toBe('# Recursão')
    s = ciclarTitulo(s)
    expect(s.texto).toBe('## Recursão')
    s = ciclarTitulo(s)
    expect(s.texto).toBe('### Recursão')
    s = ciclarTitulo(s)
    expect(s.texto).toBe('Recursão')
  })

  it('leva as linhas tocadas para o nível da primeira', () => {
    const r = ciclarTitulo(sel('[# um\ndois]'))
    expect(r.texto).toBe('## um\n## dois')
  })
})

describe('mudarRecuo', () => {
  it('recua e desrecua as linhas tocadas', () => {
    const recuado = mudarRecuo(sel('[um\ndois]'), 1)
    expect(recuado.texto).toBe('  um\n  dois')
    expect(mudarRecuo({ ...recuado, inicio: 0, fim: recuado.texto.length }, -1).texto).toBe(
      'um\ndois',
    )
  })

  it('desrecuar uma linha sem recuo não mexe nela', () => {
    expect(mudarRecuo({ texto: 'um', inicio: 0, fim: 0 }, -1).texto).toBe('um')
  })
})
