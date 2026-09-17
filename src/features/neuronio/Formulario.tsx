import { Check, ChevronDown, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import type { Livro } from '@/core'
import type { NovoNeuronio } from '@/store/palacio'

const FONTE_MINIMA_PX = 14
const FONTE_MAXIMA_PX = 28
const FONTE_PADRAO_PX = 16
const PASSO_DA_FONTE_PX = 2

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
 * - **o livro é uma etiqueta** que abre uma folha de escolha (pedido do
 *   usuário, 17/09/2026) — não um campo de 52 px com rótulo por cima, e não
 *   mais o `<select>` nativo do navegador, que destoava do resto do app;
 * - **o texto não tem caixa**: sem borda e sem fundo, ele é a folha, e a folha
 *   é o que sobra da tela. Uma caixa dentro de uma tela que já é só escrever
 *   desenha uma moldura em volta do nada.
 *
 * Por isso esta tela é a única sem `.rotulo-de-secao`: o `placeholder` de cada
 * campo já diz o que ele é, e três rótulos sobre uma folha de escrever são três
 * linhas a menos de folha.
 *
 * Sair é o "fechar" da barra, como o voltar do Android — não há "Cancelar" ao
 * lado do enviar, que fica preso no pé no celular (`.barra-de-acao`).
 *
 * **Sem barra de formatação** (removida em 17/09/2026, pedido do usuário — ver
 * CLAUDE.md, "A barra de escrita sai"): o único controle fora do texto em si é
 * o tamanho de fonte, sempre visível junto da etiqueta do livro — não um
 * acessório que aparece com o teclado, porque ajustar a leitura faz sentido
 * também com o teclado fechado.
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
  const [fontePx, setFontePx] = useState(FONTE_PADRAO_PX)

  // A folha de escolher livro mora na URL, como qualquer outro painel do app
  // (filtros da Rede, apagar do neurônio): o voltar do Android fecha a folha
  // antes de sair do formulário.
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()
  const escolhendoLivro = busca.get('livros') === '1'

  const livroId = livroEscolhido || (livros[0]?.id ?? '')
  const livro = livros.find((l) => l.id === livroId)
  const podeEnviar = titulo.trim().length > 0 && livroId !== '' && !ocupado

  function abrirEscolhaDeLivro(): void {
    void navegar({ search: '?livros=1' })
  }

  function fecharEscolhaDeLivro(): void {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
  }

  function mudarFonte(delta: number): void {
    setFontePx((atual) => Math.min(FONTE_MAXIMA_PX, Math.max(FONTE_MINIMA_PX, atual + delta)))
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (podeEnviar) onEnviar({ livroId, titulo, conteudo })
        }}
        // O `autocomplete` do form, e não só de cada campo: é o sinal mais
        // forte que a web tem contra o autofill do Android/Gboard (chave,
        // cartão, localização) — pedido do usuário, 17/09/2026. Nenhum campo
        // daqui é login, pagamento ou endereço.
        autoComplete="off"
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
          <div className="flex items-center justify-between gap-3 pt-3">
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
                <button
                  type="button"
                  onClick={abrirEscolhaDeLivro}
                  aria-label={livro ? `Livro: ${livro.titulo}` : 'Escolher livro'}
                  className="chip text-papel min-w-0 truncate pr-8 pl-7"
                >
                  {livro?.titulo}
                </button>
                <ChevronDown
                  size={14}
                  aria-hidden
                  className="text-poeira pointer-events-none absolute right-3"
                />
              </span>
            )}

            {/* Tamanho de fonte: sempre à mostra, e não um acessório do
                teclado — ajustar a leitura faz sentido mesmo de tela
                fechada (pedido do usuário, 17/09/2026). */}
            <span className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  mudarFonte(-PASSO_DA_FONTE_PX)
                }}
                disabled={fontePx <= FONTE_MINIMA_PX}
                aria-label="Diminuir a fonte"
                className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
              >
                <Minus size={16} aria-hidden />
              </button>
              <span className="text-poeira w-6 text-center text-xs tabular-nums" aria-hidden>
                {fontePx}
              </span>
              <button
                type="button"
                onClick={() => {
                  mudarFonte(PASSO_DA_FONTE_PX)
                }}
                disabled={fontePx >= FONTE_MAXIMA_PX}
                aria-label="Aumentar a fonte"
                className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
              >
                <Plus size={16} aria-hidden />
              </button>
            </span>
          </div>

          {aviso !== undefined && (
            <p className="text-poeira pt-3 text-xs leading-relaxed">{aviso}</p>
          )}

          {/* A folha: cresce com o texto e, enquanto o texto é curto, ocupa o que
            sobra da tela — tocar em qualquer ponto dela já põe o cursor. */}
          <textarea
            value={conteudo}
            onChange={(e) => {
              setConteudo(e.target.value)
            }}
            aria-label="Com suas palavras"
            placeholder="Escreva com suas palavras."
            autoComplete="off"
            style={{ fontSize: `${String(fontePx)}px` }}
            className="placeholder:text-poeira [field-sizing:content] w-full flex-1 resize-none bg-transparent px-1 pt-4 pb-2 leading-relaxed outline-none"
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

      <Folha aberta={escolhendoLivro} rotulo="Escolher livro" onFechar={fecharEscolhaDeLivro}>
        <ul className="cartao flex flex-col">
          {livros.map((l) => (
            <li key={l.id} className="linha-de-lista p-0">
              <button
                type="button"
                onClick={() => {
                  setLivroEscolhido(l.id)
                  fecharEscolhaDeLivro()
                }}
                className="flex min-h-14 w-full items-center gap-3.5 px-4 text-left"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: l.cor }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{l.titulo}</span>
                {l.id === livroId && (
                  <Check size={18} aria-hidden className="text-papel shrink-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </Folha>
    </>
  )
}
