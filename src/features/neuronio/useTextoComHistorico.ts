import { useCallback, useRef, useState } from 'react'

/**
 * O texto que se escreve, com desfazer e refazer.
 *
 * O `<textarea>` tem o desfazer do navegador, mas ele morre no instante em que
 * o valor passa a vir do React: para o navegador, cada `setState` é um texto
 * novo caído do céu, não uma edição. Como a barra de escrita reescreve o campo
 * o tempo todo (ver `marcacao.ts`), o histórico precisa ser nosso.
 *
 * Digitar agrupa: teclas dentro da mesma janela viram um passo só, senão
 * desfazer apagaria uma letra por toque. Um botão da barra sempre abre um
 * passo próprio — marcar em negrito e desfazer tem que tirar o negrito, e não
 * a palavra que veio antes dele.
 */

export interface PassoDeTexto {
  texto: string
  inicio: number
  fim: number
}

const JANELA_DE_AGRUPAMENTO_MS = 600
/** Teto do histórico: um palácio inteiro de passos não cabe na memória à toa. */
const LIMITE_DE_PASSOS = 120

export function useTextoComHistorico(inicial: string) {
  const [historico, setHistorico] = useState(() => ({
    passos: [{ texto: inicial, inicio: inicial.length, fim: inicial.length }] as PassoDeTexto[],
    indice: 0,
    /** Sobe só quando o passo veio de um botão, nunca ao digitar: é o sinal de
     *  que o cursor precisa ser reposto na mão (ver Formulario.tsx). */
    acao: 0,
  }))
  const ultimoEm = useRef(0)

  const registrar = useCallback((proximo: PassoDeTexto, agrupar: boolean) => {
    // `Date.now()` fora do atualizador: ele tem que ser função pura do estado.
    const agora = Date.now()
    const juntar = agrupar && agora - ultimoEm.current < JANELA_DE_AGRUPAMENTO_MS
    ultimoEm.current = agora

    setHistorico(({ passos, indice, acao }) => {
      const ate = passos.slice(0, indice + 1)
      // Nunca engole o passo inicial: é ele que deixa desfazer até o começo.
      const base = juntar && ate.length > 1 ? ate.slice(0, -1) : ate
      const novos = [...base, proximo].slice(-LIMITE_DE_PASSOS)
      return { passos: novos, indice: novos.length - 1, acao: agrupar ? acao : acao + 1 }
    })
  }, [])

  const andar = useCallback((direcao: 1 | -1) => {
    // O que vier a seguir começa um passo novo: desfazer e continuar digitando
    // não pode reescrever o passo para onde acabamos de voltar.
    ultimoEm.current = 0
    setHistorico((h) => {
      const indice = h.indice + direcao
      if (indice < 0 || indice >= h.passos.length) return h
      return { ...h, indice, acao: h.acao + 1 }
    })
  }, [])

  const digitar = useCallback(
    (passo: PassoDeTexto) => {
      registrar(passo, true)
    },
    [registrar],
  )

  const aplicar = useCallback(
    (passo: PassoDeTexto) => {
      registrar(passo, false)
    },
    [registrar],
  )

  const desfazer = useCallback(() => {
    andar(-1)
  }, [andar])

  const refazer = useCallback(() => {
    andar(1)
  }, [andar])

  return {
    passo: historico.passos[historico.indice] ?? { texto: '', inicio: 0, fim: 0 },
    acao: historico.acao,
    digitar,
    aplicar,
    desfazer,
    refazer,
    podeDesfazer: historico.indice > 0,
    podeRefazer: historico.indice < historico.passos.length - 1,
  }
}
