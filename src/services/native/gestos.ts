/**
 * O disfarce do navegador.
 *
 * Segurar o dedo num link abre o menu do Chrome — "copiar endereço do link",
 * "abrir no navegador Chrome" — e o app confessa que por baixo era um site. Não
 * há CSS que resolva isso no Android: `-webkit-touch-callout` é só do WebKit. O
 * jeito é recusar o evento.
 *
 * Mora em `services/native/` pelo mesmo motivo de `arquivos.ts` (CLAUDE.md §4):
 * é código que existe porque o ambiente é uma WebView, não lógica do palácio —
 * e `lib/` é reservado a utilidade pura, que isto não é.
 *
 * Só vale onde quem aponta é o dedo, a mesma chave que o `index.css` usa para
 * travar a seleção. No desktop o botão direito é ferramenta de trabalho e
 * continua inteiro. A pergunta é feita a cada toque longo, e não uma vez no
 * início: um tablet ganha e perde teclado, e toque longo é raro o bastante para
 * a consulta não custar nada.
 */

/** O que a pessoa escreveu continua sendo dela: selecionar e copiar seguem valendo. */
const DELA = 'input, textarea, .texto-do-usuario'

export function travarGestosDeNavegador(): void {
  document.addEventListener('contextmenu', (evento) => {
    if (!window.matchMedia('(pointer: coarse)').matches) return

    const alvo = evento.target
    if (alvo instanceof Element && alvo.closest(DELA) !== null) return

    evento.preventDefault()
  })
}
