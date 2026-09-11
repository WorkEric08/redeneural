import { useState } from 'react'

interface Props {
  onEntrar: () => void
}

/**
 * A porta de entrada — pura atmosfera, sem lógica de domínio nenhuma. Aparece
 * uma vez por carregamento do app, na frente de qualquer rota; tocar (ou
 * Enter/Espaço — é um <button>) abre a folha e revela o palácio.
 *
 * A cena inteira é CSS (ver `.porta-cena` em index.css): parede com lambril,
 * batente, folha de três caixilhos, assoalho e a luz vazando pela fresta. O
 * `setTimeout` acompanha a duração da transição — o pai só desmonta quando a
 * folha terminou de girar, senão a estante apareceria de golpe por baixo.
 *
 * Os elementos são <span> e não <div> porque o conteúdo de um <button> só
 * aceita conteúdo de frase; posicionados em absolute, viram bloco do mesmo
 * jeito.
 */
const DURACAO_ABERTURA_MS = 840

export function Porta({ onEntrar }: Props) {
  const [abrindo, setAbrindo] = useState(false)

  return (
    <button
      type="button"
      aria-label="Entrar no palácio"
      className="porta-cena"
      data-abrindo={abrindo}
      onClick={() => {
        if (abrindo) return
        setAbrindo(true)
        setTimeout(onEntrar, DURACAO_ABERTURA_MS)
      }}
    >
      <span className="porta-parede" aria-hidden>
        <span className="porta-lambril" />
      </span>

      <span className="porta-assoalho" aria-hidden />

      <span className="porta-conjunto" aria-hidden>
        <span className="porta-vao" />

        <span className="porta-folha">
          <span className="porta-caixilho porta-caixilho--topo" />
          <span className="porta-caixilho porta-caixilho--meio" />
          <span className="porta-caixilho porta-caixilho--base" />
          <span className="porta-macaneta" />
          <span className="porta-fechadura" />
        </span>

        <span className="porta-umbral porta-umbral--esq" />
        <span className="porta-umbral porta-umbral--dir" />
        <span className="porta-umbral porta-umbral--verga" />
        <span className="porta-soco porta-soco--esq" />
        <span className="porta-soco porta-soco--dir" />

        <span className="porta-aura" />
        <span className="porta-brilho" />
      </span>

      <span className="porta-derrame" aria-hidden />
      <span className="porta-vinheta" aria-hidden />
      <span className="porta-convite">Toque para entrar</span>
    </button>
  )
}
