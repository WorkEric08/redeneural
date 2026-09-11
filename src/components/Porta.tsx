import { useState } from 'react'

interface Props {
  onEntrar: () => void
}

/**
 * A porta de entrada — pura atmosfera, sem lógica de domínio nenhuma. Aparece
 * uma vez por carregamento do app, na frente de qualquer rota; tocar (ou
 * Enter/Espaço — é um <button>) abre a fresta e revela o palácio por trás.
 *
 * Duração da animação e o `setTimeout` andam juntos de propósito: o pai só
 * desmonta a porta quando a transição CSS termina, senão a estante apareceria
 * de golpe por baixo antes da porta acabar de abrir.
 */
const DURACAO_ABERTURA_MS = 650

export function Porta({ onEntrar }: Props) {
  const [abrindo, setAbrindo] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        setAbrindo(true)
        setTimeout(onEntrar, DURACAO_ABERTURA_MS)
      }}
      aria-label="Entrar no palácio"
      className={`bg-sala fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-[650ms] ease-in ${
        abrindo ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="bg-estante relative h-[68vh] w-56 max-w-[68vw] rounded-[2px] shadow-[inset_6px_0_18px_rgb(0_0_0/0.45)] transition-transform duration-[650ms] ease-in"
        style={{
          transformOrigin: 'left center',
          transform: abrindo ? 'perspective(1400px) rotateY(-52deg) translateX(-8px)' : 'none',
        }}
      >
        {/* A fresta: luz quente vazando pela borda oposta à dobradiça — a
            referência visual do projeto (ver CLAUDE.md, "Direção visual"). */}
        <div
          aria-hidden
          className="animar-luz-da-porta absolute top-0 right-0 h-full w-3"
          style={{
            background: 'linear-gradient(90deg, transparent, oklch(0.95 0.05 85))',
            boxShadow:
              '0 0 40px 14px oklch(0.84 0.13 82 / 0.55), 0 0 100px 46px oklch(0.84 0.13 82 / 0.22)',
          }}
        />
      </div>

      <p className="text-poeira absolute bottom-[14%] text-sm tracking-wide">Toque para entrar</p>
    </button>
  )
}
