import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { botao } from '@/components/botao'
import type { Livro } from '@/core'
import type { NovoNeuronio } from '@/store/palacio'

/**
 * O mesmo formulário serve para criar e para editar.
 *
 * Editar não é um caso menor: mudar o texto refaz o embedding e pode mudar as
 * conexões. Os dois caminhos terminam no mesmo lugar, então usam a mesma tela.
 *
 * Sair é o "fechar" da barra de topo, como o voltar do Android — não há
 * "Cancelar" ao lado do botão de enviar, que fica preso no pé da tela no
 * celular (`.barra-de-acao`). O campo do texto cresce com o que se escreve, e
 * no celular ocupa a tela que sobra: é uma folha de escrever, não uma caixa.
 */

interface Props {
  livros: readonly Livro[]
  inicial?: NovoNeuronio
  ocupado: boolean
  rotuloDeEnvio: string
  onEnviar: (dados: NovoNeuronio) => void
}

export function Formulario({ livros, inicial, ocupado, rotuloDeEnvio, onEnviar }: Props) {
  const [livroEscolhido, setLivroEscolhido] = useState(inicial?.livroId ?? '')
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [conteudo, setConteudo] = useState(inicial?.conteudo ?? '')

  const livroId = livroEscolhido || (livros[0]?.id ?? '')
  const livro = livros.find((l) => l.id === livroId)
  const podeEnviar = titulo.trim().length > 0 && livroId !== '' && !ocupado

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (podeEnviar) onEnviar({ livroId, titulo, conteudo })
      }}
      className="flex flex-1 flex-col"
    >
      <div className="flex flex-1 flex-col gap-5 pt-5 pb-2">
        <label className="flex flex-col">
          <span className="rotulo-de-secao">Livro</span>
          {livros.length === 0 ? (
            <span className="cartao text-poeira px-4 py-3.5 text-sm">
              Nenhum livro na estante ainda. Toque numa lombada escura para criar o primeiro.
            </span>
          ) : (
            <span className="relative flex items-center">
              <span
                className="pointer-events-none absolute left-4 h-5 w-1 rounded-full"
                style={{ background: livro?.cor }}
                aria-hidden
              />
              <select
                value={livroId}
                onChange={(e) => {
                  setLivroEscolhido(e.target.value)
                }}
                className="campo h-13 appearance-none pr-11 pl-8 text-base"
              >
                {livros.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.titulo}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                aria-hidden
                className="text-poeira pointer-events-none absolute right-4"
              />
            </span>
          )}
        </label>

        <label className="flex flex-col">
          <span className="rotulo-de-secao">Título</span>
          <input
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
            }}
            // Curto de propósito: a 320 px, na fonte de título, um texto maior
            // é cortado no meio da palavra.
            placeholder="Curto, para achar depois"
            // A lista de preenchimento do navegador é coisa de formulário web.
            autoComplete="off"
            className="campo font-titulo h-13 px-4 text-lg"
          />
        </label>

        <label className="flex flex-1 flex-col">
          <span className="rotulo-de-secao">Com suas palavras</span>
          <textarea
            value={conteudo}
            onChange={(e) => {
              setConteudo(e.target.value)
            }}
            placeholder="Um roteiro, um pensamento desenvolvido — o que vier."
            className="campo [field-sizing:content] min-h-56 flex-1 resize-none px-4 py-3 text-base leading-relaxed md:min-h-80"
          />
          <span className="text-poeira mt-2 px-1 text-xs leading-relaxed">
            Escreva livre e à vontade — é esse texto que o modelo lê para achar as conexões.
          </span>
        </label>
      </div>

      <div className="barra-de-acao md:flex md:justify-end">
        <button
          type="submit"
          disabled={!podeEnviar}
          className={`${botao({ tipo: 'primario', largo: true })} md:w-auto md:min-w-44`}
        >
          {ocupado ? 'Processando…' : rotuloDeEnvio}
        </button>
      </div>
    </form>
  )
}
