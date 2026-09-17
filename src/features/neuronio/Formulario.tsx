import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import type { Livro } from '@/core'
import type { NovoNeuronio } from '@/store/palacio'

/**
 * A folha de escrever — o mesmo formulário serve para criar e para editar.
 *
 * Editar não é um caso menor: mudar o texto refaz o embedding e pode mudar as
 * conexões. Os dois caminhos terminam no mesmo lugar, então usam a mesma tela.
 *
 * Desenhada como um app de notas (pedido do usuário, 16/09/2026, com o Samsung
 * Notes como referência), e não como um formulário empilhado:
 *
 * - **o título mora na barra de topo**, no lugar do nome da tela — é o que a
 *   barra do Notes faz, e devolve uma tela inteira para o texto;
 * - **o livro é uma etiqueta**, não um campo de 52 px com rótulo por cima;
 * - **o texto não tem caixa**: sem borda e sem fundo, ele é a folha, e a folha
 *   é o que sobra da tela. Uma caixa dentro de uma tela que já é só escrever
 *   desenha uma moldura em volta do nada.
 *
 * Por isso esta tela é a única sem `.rotulo-de-secao`: o `placeholder` de cada
 * campo já diz o que ele é, e três rótulos sobre uma folha de escrever são três
 * linhas a menos de folha.
 *
 * Sair é o "fechar" da barra, como o voltar do Android — não há "Cancelar" ao
 * lado do enviar, que fica preso no pé no celular (`.barra-de-acao`), onde o
 * Notes põe a própria barra de ferramentas.
 */

interface Props {
  livros: readonly Livro[]
  inicial?: NovoNeuronio
  ocupado: boolean
  rotuloDeEnvio: string
  /** Para onde o "fechar" leva quando o app abriu direto nesta tela. */
  voltarPara: string
  /** Uma linha acima da folha. Só o editar tem uma — criar entra limpo. */
  aviso?: string
  onEnviar: (dados: NovoNeuronio) => void
}

export function Formulario({
  livros,
  inicial,
  ocupado,
  rotuloDeEnvio,
  voltarPara,
  aviso,
  onEnviar,
}: Props) {
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
      className="flex min-h-dvh flex-col"
    >
      <BarraDeTopo
        voltarPara={voltarPara}
        icone="fechar"
        titulo={
          // A fonte da barra não atravessa para dentro de um `input` (o
          // navegador dá a dele), então as classes repetem o que
          // `.barra-de-topo-titulo` já diz para o texto comum.
          <input
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value)
            }}
            aria-label="Título"
            placeholder="Título"
            // A lista de preenchimento do navegador é coisa de formulário web.
            autoComplete="off"
            className="font-titulo placeholder:text-poeira min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:font-normal"
          />
        }
      />

      <div className="animar-entrada flex flex-1 flex-col">
        <div className="flex items-center pt-3">
          {livros.length === 0 ? (
            <span className="text-poeira text-xs leading-relaxed">
              Nenhum livro na estante ainda. Toque numa lombada escura para criar o primeiro.
            </span>
          ) : (
            <span className="relative flex min-w-0 items-center">
              <span
                className="pointer-events-none absolute left-3.5 size-2 shrink-0 rounded-full"
                style={{ background: livro?.cor }}
                aria-hidden
              />
              <select
                value={livroId}
                onChange={(e) => {
                  setLivroEscolhido(e.target.value)
                }}
                aria-label="Livro"
                className="chip text-papel min-w-0 appearance-none truncate pr-8 pl-7"
              >
                {livros.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.titulo}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                aria-hidden
                className="text-poeira pointer-events-none absolute right-3"
              />
            </span>
          )}
        </div>

        {aviso !== undefined && <p className="text-poeira pt-3 text-xs leading-relaxed">{aviso}</p>}

        {/* A folha: cresce com o texto e, enquanto o texto é curto, ocupa o que
            sobra da tela — tocar em qualquer ponto dela já põe o cursor. */}
        <textarea
          value={conteudo}
          onChange={(e) => {
            setConteudo(e.target.value)
          }}
          aria-label="Com suas palavras"
          placeholder="Escreva com suas palavras."
          className="placeholder:text-poeira [field-sizing:content] w-full flex-1 resize-none bg-transparent px-1 pt-4 pb-2 text-base leading-relaxed outline-none"
        />
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
