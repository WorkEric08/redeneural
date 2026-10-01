import { Check } from 'lucide-react'
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
    <div className="flex flex-col gap-4">
      <h2 className="font-titulo truncate px-1 text-xl leading-snug font-semibold tracking-tight">
        {neuronio.titulo}
      </h2>

      <ul className="cartao flex flex-col">
        {OPCOES.map((estado) => (
          <li key={estado} className="linha-de-lista p-0">
            <button
              type="button"
              disabled={gravando}
              aria-pressed={escolhido === estado}
              onClick={() => {
                if (estado === 'feita') setEscolhido('feita')
                else if (estado === estadoAtual) onFechar()
                else definir(estado, null)
              }}
              className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
            >
              <span className="text-poeira shrink-0">
                <IconeDoEstado estado={estado} />
              </span>
              <span className="min-w-0 flex-1 truncate">{ROTULO_DO_ESTADO[estado]}</span>
              {escolhido === estado && (
                <Check size={18} aria-hidden className="text-papel shrink-0" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {escolhido === 'feita' && (
        <form
          autoComplete="off"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (valido && !gravando) definir('feita', link.trim() || null)
          }}
        >
          <label className="flex flex-col">
            <span className="rotulo-de-secao">Link do resultado</span>
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
              }}
              type="url"
              inputMode="url"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="https://… (opcional)"
              aria-invalid={!valido}
              className="campo h-12 px-4"
            />
          </label>
          {!valido && (
            <p className="text-destructive px-1 text-xs">Um link começa com http:// ou https://.</p>
          )}
          <button
            type="submit"
            disabled={!valido || gravando}
            className={botao({ tipo: 'primario', largo: true })}
          >
            {estadoAtual === 'feita' ? 'Salvar' : 'Marcar como feita'}
          </button>
        </form>
      )}
    </div>
  )
}
