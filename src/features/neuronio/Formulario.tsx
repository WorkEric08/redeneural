import { useState } from 'react'

import type { Livro } from '@/core'
import type { NovoNeuronio } from '@/store/palacio'

/**
 * O mesmo formulário serve para criar e para editar.
 *
 * Editar não é um caso menor: mudar o texto refaz o embedding e pode mudar as
 * conexões. Os dois caminhos terminam no mesmo lugar, então usam a mesma tela.
 */

interface Props {
  livros: readonly Livro[]
  inicial?: NovoNeuronio
  ocupado: boolean
  rotuloDeEnvio: string
  onEnviar: (dados: NovoNeuronio) => void
  onCancelar: () => void
}

export function Formulario({
  livros,
  inicial,
  ocupado,
  rotuloDeEnvio,
  onEnviar,
  onCancelar,
}: Props) {
  const [livroEscolhido, setLivroEscolhido] = useState(inicial?.livroId ?? '')
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [conteudo, setConteudo] = useState(inicial?.conteudo ?? '')

  const livroId = livroEscolhido || (livros[0]?.id ?? '')
  const podeEnviar = titulo.trim().length > 0 && livroId !== '' && !ocupado

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (podeEnviar) onEnviar({ livroId, titulo, conteudo })
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-poeira text-xs tracking-wide uppercase">Livro</span>
        <select
          value={livroId}
          onChange={(e) => {
            setLivroEscolhido(e.target.value)
          }}
          className="border-linha bg-parede h-12 rounded-lg border px-3"
        >
          {livros.map((l) => (
            <option key={l.id} value={l.id}>
              {l.titulo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-poeira text-xs tracking-wide uppercase">Conceito</span>
        <input
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value)
          }}
          placeholder="Neuroplasticidade"
          // A tela inteira existe para este campo: abrir o teclado direto poupa um
          // toque em todo neurônio criado no celular.
          autoFocus
          className="border-linha bg-parede font-titulo h-12 rounded-lg border px-3 text-lg"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-poeira text-xs tracking-wide uppercase">Com suas palavras</span>
        <textarea
          value={conteudo}
          onChange={(e) => {
            setConteudo(e.target.value)
          }}
          placeholder="O que é, por que importa, o que você entendeu."
          rows={7}
          className="border-linha bg-parede rounded-lg border px-3 py-2.5 leading-relaxed"
        />
        <span className="text-poeira text-xs">
          Quanto mais você escrever com suas palavras, melhores as conexões — é esse texto que o
          modelo lê.
        </span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!podeEnviar}
          className="bg-papel text-sala h-12 flex-1 rounded-lg font-semibold disabled:opacity-50"
        >
          {ocupado ? 'Processando…' : rotuloDeEnvio}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={ocupado}
          className="border-linha h-12 rounded-lg border px-4 text-sm disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
