import { useSyncExternalStore } from 'react'

import { ehTemaPadrao, temaOuPadrao } from '@/core'

/**
 * Se o tema em uso é uma das versões do "Padrão". Só para o que muda de **estrutura** (outra
 * ordem, outro ícone, uma peça a mais); o que muda só de acabamento vive no CSS
 * (`tema-padrao.css`), sem passar por aqui.
 *
 * Lê o mesmo atributo que o CSS lê (`<html data-tema>`, ligado por `services/native/tema.ts`), e não
 * a store: assim o desenho de uma peça e o do CSS nunca discordam — nem por um quadro —, e uma peça
 * pequena não puxa a store do palácio (e o Worker dela) só para saber o tema.
 */

function assinar(aoMudar: () => void): () => void {
  const observador = new MutationObserver(aoMudar)
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
  return () => {
    observador.disconnect()
  }
}

function ler(): boolean {
  return ehTemaPadrao(temaOuPadrao(document.documentElement.dataset.tema))
}

export function useTemaPadrao(): boolean {
  return useSyncExternalStore(assinar, ler, () => false)
}
