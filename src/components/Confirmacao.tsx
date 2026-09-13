import { botao } from './botao'

interface Props {
  titulo: string
  explicacao: string
  rotulo: string
  /** O que o botão diz enquanto espera — "Apagando…". */
  rotuloOcupado: string
  ocupado: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Confirmação de ação sem volta, dentro de uma `Folha`.
 *
 * O botão de perigo fica à direita, no alcance do polegar, e com o mesmo peso
 * do "Cancelar": confirmar tem que ser uma escolha, não o caminho mais fácil.
 */
export function Confirmacao({
  titulo,
  explicacao,
  rotulo,
  rotuloOcupado,
  ocupado,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="font-titulo text-xl leading-snug font-semibold tracking-tight">{titulo}</h2>
        <p className="text-poeira text-sm leading-relaxed">{explicacao}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={ocupado}
          onClick={onCancelar}
          className={botao({ tipo: 'secundario', largo: true })}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={onConfirmar}
          className={botao({ tipo: 'perigo', largo: true })}
        >
          {ocupado ? rotuloOcupado : rotulo}
        </button>
      </div>
    </div>
  )
}
