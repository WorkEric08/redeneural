import { useEffect } from 'react'

/**
 * Trava a rolagem da página enquanto a tela estiver montada.
 *
 * Para telas que cabem inteiras e são objeto, não documento — a estante é a
 * primeira. Serve também a um motivo mecânico: com a página rolando, arrastar
 * um livro disputaria o dedo com a rolagem.
 *
 * Classe no `<html>`, e não `overflow` no `body` direto: o Chrome do Android
 * decide a rolagem pelo elemento raiz (a mesma razão do `overscroll-behavior`
 * em index.css), e a classe sai sozinha quando a tela desmonta.
 */
export function useTravarRolagem(): void {
  useEffect(() => {
    const raiz = document.documentElement

    // Voltando de outra tela, a rolagem de lá ainda pode estar aplicada.
    window.scrollTo(0, 0)
    raiz.classList.add('rolagem-travada')

    return () => {
      raiz.classList.remove('rolagem-travada')
    }
  }, [])
}
