import {
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Redo2,
  Strikethrough,
  Type,
  Undo2,
} from 'lucide-react'

import { botao } from '@/components/botao'

/**
 * A fileira de ferramentas acima do teclado (pedido do usuário, 16/09/2026,
 * com a barra do Samsung Notes como referência).
 *
 * Ela existe enquanto o dedo está no texto — é ali que "acima do teclado" quer
 * dizer alguma coisa. No celular ocupa o lugar do botão de enviar, que volta
 * assim que o teclado fecha: duas faixas presas no pé comeriam metade do que
 * sobra da tela com o teclado aberto.
 *
 * **Nenhum botão daqui tira o foco do campo.** Cada um recusa o `pointerdown`
 * (`preventDefault`), então o `<textarea>` não perde nem o cursor nem a
 * seleção — sem isso, tocar em "negrito" faria a barra sumir antes do toque
 * virar clique, e não haveria seleção para marcar.
 *
 * O que a referência tem e não veio: a caneta de desenho e a caixa de texto
 * (não existem em texto puro), o sublinhado (markdown não tem), o alinhamento
 * e o tamanho em número — `Aa` virou o ciclo de níveis de título, que é o que
 * markdown sabe dizer. Ver `marcacao.ts`.
 */

export type AcaoDeEscrita =
  | 'negrito'
  | 'italico'
  | 'tachado'
  | 'titulo'
  | 'marcador'
  | 'numero'
  | 'tarefa'
  | 'recuar'
  | 'desrecuar'
  | 'desfazer'
  | 'refazer'

const FERRAMENTAS = [
  { acao: 'negrito', rotulo: 'Negrito', Icone: Bold },
  { acao: 'italico', rotulo: 'Itálico', Icone: Italic },
  { acao: 'tachado', rotulo: 'Riscado', Icone: Strikethrough },
  { acao: 'titulo', rotulo: 'Título', Icone: Type },
  { acao: 'marcador', rotulo: 'Lista', Icone: List },
  { acao: 'numero', rotulo: 'Lista numerada', Icone: ListOrdered },
  { acao: 'tarefa', rotulo: 'Lista de tarefas', Icone: ListChecks },
  { acao: 'desrecuar', rotulo: 'Diminuir recuo', Icone: IndentDecrease },
  { acao: 'recuar', rotulo: 'Aumentar recuo', Icone: IndentIncrease },
] as const satisfies readonly { acao: AcaoDeEscrita; rotulo: string; Icone: typeof Bold }[]

interface Props {
  onAcao: (acao: AcaoDeEscrita) => void
  podeDesfazer: boolean
  podeRefazer: boolean
}

export function BarraDeEscrita({ onAcao, podeDesfazer, podeRefazer }: Props) {
  /**
   * Segura o foco no campo. Nos dois eventos de propósito: quem move o foco é
   * o `mousedown` (que o toque também dispara, por compatibilidade), e o
   * `pointerdown` cobre onde o de mouse não vem. Prevenir não impede o
   * `click` — é como qualquer editor mantém a seleção viva sob a barra.
   */
  function segurarOFoco(evento: { preventDefault: () => void }): void {
    evento.preventDefault()
  }

  const classe = `${botao({ tipo: 'fantasma', tamanho: 'icone' })} text-papel shrink-0`

  return (
    <div className="barra-de-escrita" data-barra-de-escrita>
      <div className="faixa-rolavel flex min-w-0 flex-1 items-center">
        {FERRAMENTAS.map(({ acao, rotulo, Icone }) => (
          <button
            key={acao}
            type="button"
            aria-label={rotulo}
            className={classe}
            onPointerDown={segurarOFoco}
            onMouseDown={segurarOFoco}
            onClick={() => {
              onAcao(acao)
            }}
          >
            <Icone size={19} aria-hidden />
          </button>
        ))}
      </div>

      {/* Fora da faixa que rola: desfazer é o botão que mais se procura com
          pressa, e não pode estar escondido além da borda num aparelho de
          320 px. */}
      <div className="border-linha flex shrink-0 items-center border-l pl-1">
        <button
          type="button"
          aria-label="Desfazer"
          disabled={!podeDesfazer}
          className={classe}
          onPointerDown={segurarOFoco}
          onMouseDown={segurarOFoco}
          onClick={() => {
            onAcao('desfazer')
          }}
        >
          <Undo2 size={19} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Refazer"
          disabled={!podeRefazer}
          className={classe}
          onPointerDown={segurarOFoco}
          onMouseDown={segurarOFoco}
          onClick={() => {
            onAcao('refazer')
          }}
        >
          <Redo2 size={19} aria-hidden />
        </button>
      </div>
    </div>
  )
}
