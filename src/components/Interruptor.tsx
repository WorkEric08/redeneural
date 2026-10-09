interface Props {
  ligado: boolean
  onMudar: (ligado: boolean) => void
  /** O que ele liga, para o leitor de tela — o texto ao lado é só decoração. */
  rotulo: string
  desabilitado?: boolean
}

/**
 * Um liga/desliga. `role="switch"`, e não uma caixa de marcar: é uma preferência que vale na
 * hora, sem "salvar" (como os controles de luz de Ajustes). A área de toque é a da linha
 * inteira que o guarda — aqui só a chave tem 44 px de altura.
 */
export function Interruptor({ ligado, onMudar, rotulo, desabilitado = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => {
        onMudar(!ligado)
      }}
      className="grid h-11 w-14 shrink-0 place-items-center"
    >
      <span
        aria-hidden
        className={`border-linha relative block h-7 w-12 rounded-full border transition-colors ${
          ligado ? 'bg-papel' : 'bg-realce'
        }`}
      >
        <span
          // `left` explícito: sem ele a posição "automática" de um absoluto soma o deslocamento
          // e a bolinha saía da chave.
          className={`absolute top-0.5 left-0.5 size-5 rounded-full transition-transform ${
            ligado ? 'bg-sala translate-x-[1.375rem]' : 'bg-poeira translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
