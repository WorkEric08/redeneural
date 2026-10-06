import { useState } from 'react'

import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import type { EstadoDaIdeia, NeuronioNaTela } from '@/core'

import { ROTULO_DO_ESTADO } from './estados'
import { IconeDoEstado } from './IconeDoEstado'

/** Na ordem do andamento, e não na das seções do livro. */
const OPCOES: readonly EstadoDaIdeia[] = ['para_fazer', 'fazendo', 'feita']

interface Props {
  aberta: boolean
  neuronio: NeuronioNaTela | undefined
  /** O estado que a tela mostra agora (`estadoVisivel`). */
  estadoAtual: EstadoDaIdeia | null
  onDefinir: (estado: EstadoDaIdeia, resultadoLink: string | null) => Promise<boolean>
  onFechar: () => void
}

/** Um link do resultado vale se é http ou https — a mesma regra do motor. */
function linkValido(texto: string): boolean {
  if (texto === '') return true
  try {
    const url = new URL(texto)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Mudar o andamento de uma ideia: tocar "Para fazer" ou "Fazendo" muda e
 * fecha. "Feita" abre o link do resultado — opcional — antes de confirmar, que
 * é o momento de dizer onde o que saiu da ideia está.
 */
export function FolhaDeEstado({ aberta, neuronio, estadoAtual, onDefinir, onFechar }: Props) {
  return (
    <Folha aberta={aberta && neuronio !== undefined} rotulo="Andamento" onFechar={onFechar}>
      {/* Montado só aberto, e por ideia: a escolha e o link recomeçam do que
          está gravado a cada abertura. */}
      {aberta && neuronio && estadoAtual && (
        <Conteudo
          key={neuronio.id}
          neuronio={neuronio}
          estadoAtual={estadoAtual}
          onDefinir={onDefinir}
          onFechar={onFechar}
        />
      )}
    </Folha>
  )
}

function Conteudo({
  neuronio,
  estadoAtual,
  onDefinir,
  onFechar,
}: {
  neuronio: NeuronioNaTela
  estadoAtual: EstadoDaIdeia
  onDefinir: (estado: EstadoDaIdeia, resultadoLink: string | null) => Promise<boolean>
  onFechar: () => void
}) {
  const [escolhido, setEscolhido] = useState<EstadoDaIdeia>(estadoAtual)
  const [link, setLink] = useState(neuronio.resultadoLink ?? '')
  const [gravando, setGravando] = useState(false)
  const valido = linkValido(link.trim())

  function definir(estado: EstadoDaIdeia, resultadoLink: string | null): void {
    setGravando(true)
    void onDefinir(estado, resultadoLink).then((ok) => {
      setGravando(false)
      if (ok) onFechar()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* O título inteiro, quebrando em linhas: a folha existe para mudar o
          andamento DESTA ideia, e cortar o nome com reticências esconde qual é. */}
      <h2 className="font-titulo px-1 text-xl leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
        {neuronio.titulo}
      </h2>

      {/* As três opções numa fileira só (e não numa lista de três linhas): a
          folha inteira cabe sem rolar mesmo numa tela baixa ou com o teclado
          aberto para digitar o link. */}
      <div role="group" aria-label="Andamento" className="segmentado">
        {OPCOES.map((estado) => (
          <button
            key={estado}
            type="button"
            disabled={gravando}
            aria-pressed={escolhido === estado}
            onClick={() => {
              if (estado === 'feita') setEscolhido('feita')
              else if (estado === estadoAtual) onFechar()
              else definir(estado, null)
            }}
            className="segmento h-12"
          >
            <IconeDoEstado estado={estado} tamanho={16} />
            {ROTULO_DO_ESTADO[estado]}
          </button>
        ))}
      </div>

      {escolhido === 'feita' && (
        <form
          autoComplete="off"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (valido && !gravando) definir('feita', link.trim() || null)
          }}
        >
          {/* Sem rótulo à parte: o placeholder já diz o que é, e uma linha a menos é o
              que deixa a folha caber inteira com o teclado aberto numa tela baixa. */}
          <input
            value={link}
            onChange={(e) => {
              setLink(e.target.value)
            }}
            type="url"
            inputMode="url"
            autoComplete="off"
            enterKeyHint="done"
            aria-label="Link do resultado"
            placeholder="Link do resultado (opcional)"
            aria-invalid={!valido}
            className="campo h-11 px-4"
          />
          {!valido && (
            <p className="text-destructive px-1 text-xs">Um link começa com http:// ou https://.</p>
          )}
          <button
            type="submit"
            disabled={!valido || gravando}
            className={botao({ tipo: 'primario', largo: true, tamanho: 'pequeno' })}
          >
            {estadoAtual === 'feita' ? 'Salvar' : 'Marcar como feita'}
          </button>
        </form>
      )}
    </div>
  )
}
