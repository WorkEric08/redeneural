import { Check, ChevronDown, Hammer, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import type { Livro } from '@/core'
import { FolhaDeExecutaveis } from '@/features/executaveis/FolhaDeExecutaveis'
import { ROTULO_DO_PORTO } from '@/features/porto/porto'
import type { NovoNeuronio } from '@/store/palacio'

import { EscolhaDeLivro } from './EscolhaDeLivro'

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
 *   mais o `<select>` nativo do navegador, que destoava do resto do app. Ao
 *   criar, a escolha começa em "Automático" — o Porto (01/10/2026);
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
 * CLAUDE.md, "A barra de escrita sai"): o texto é só texto, sem nenhum
 * controle extra em volta dele.
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
  /**
   * Oferece "Automático" na escolha do livro — só ao criar: o motor lê o texto
   * e guarda no livro que os mais parecidos apontam, ou pergunta (o Porto).
   */
  automatico?: boolean
  /**
   * "Quero executar isso" — só na captura. Leva a ideia para um livro
   * executável, e aí o Porto não entra: com um só, vai para ele; com vários, a
   * pessoa escolhe; sem nenhum, o app oferece criar um aqui mesmo.
   */
  executar?: { onCriarLivro: (titulo: string) => Promise<string | null> }
  onEnviar: (dados: NovoNeuronio) => void
}

export function Formulario({
  livros,
  inicial,
  ocupado,
  rotuloDeEnvio,
  voltarPara,
  aviso,
  automatico = false,
  executar,
  onEnviar,
}: Props) {
  // `null`: "Automático" ao criar; ao editar, um neurônio que está no porto.
  const [livroId, setLivroId] = useState<string | null>(inicial?.livroId ?? null)
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [conteudo, setConteudo] = useState(inicial?.conteudo ?? '')

  // A folha de escolher livro mora na URL, como qualquer outro painel do app
  // (filtros da Rede, apagar do neurônio): o voltar do Android fecha a folha
  // antes de sair do formulário.
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()
  const escolhendoLivro = busca.get('livros') === '1'
  const escolhendoExecutavel = busca.get('livros') === 'executar'

  const livro = livros.find((l) => l.id === livroId)
  const podeEnviar = titulo.trim().length > 0 && !ocupado
  const nomeDoLivro = livro?.titulo ?? (automatico ? 'Automático' : ROTULO_DO_PORTO)
  const executaveis = livros.filter((l) => l.executavel)
  // O "Quero executar isso" não guarda estado próprio: é ligado quando o livro
  // escolhido é executável — escolher um pela etiqueta também o liga.
  const executando = livro?.executavel === true

  function abrirEscolhaDeLivro(): void {
    void navegar({ search: '?livros=1' })
  }

  function alternarExecutar(): void {
    if (executando) setLivroId(null)
    else if (executaveis.length === 1) setLivroId(executaveis[0]?.id ?? null)
    else void navegar({ search: '?livros=executar' })
  }

  function fecharEscolhaDeLivro(): void {
    // O React Router chama de 'default' a primeira entrada da sessão.
    if (key === 'default') void navegar({ search: '' }, { replace: true })
    else void navegar(-1)
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

        <div className="animar-entrada flex flex-1 flex-col pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {livros.length === 0 && !automatico ? (
              <span className="text-poeira text-xs leading-relaxed">
                Nenhum livro na estante ainda. Toque numa lombada escura para criar o primeiro.
              </span>
            ) : (
              <span className="relative flex min-w-0 items-center">
                {livro ? (
                  <span
                    className="pointer-events-none absolute left-3.5 size-2 shrink-0 rounded-full"
                    style={{ background: livro.cor }}
                    aria-hidden
                  />
                ) : (
                  // Sem livro ainda: um anel vazio no lugar da cor.
                  <span
                    className="border-poeira pointer-events-none absolute left-3.5 size-2 shrink-0 rounded-full border"
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onClick={abrirEscolhaDeLivro}
                  aria-label={`Livro: ${nomeDoLivro}`}
                  className="chip text-papel min-w-0 truncate pr-8 pl-7"
                >
                  {nomeDoLivro}
                </button>
                <ChevronDown
                  size={14}
                  aria-hidden
                  className="text-poeira pointer-events-none absolute right-3"
                />
              </span>
            )}
            {executar && (
              <button
                type="button"
                aria-pressed={executando}
                onClick={alternarExecutar}
                className="chip"
              >
                <Hammer size={15} aria-hidden />
                Quero executar isso
              </button>
            )}
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

      <Folha aberta={escolhendoLivro} rotulo="Escolher livro" onFechar={fecharEscolhaDeLivro}>
        <EscolhaDeLivro
          livros={livros}
          escolhido={livroId}
          onEscolher={(id) => {
            setLivroId(id)
            fecharEscolhaDeLivro()
          }}
          antes={
            automatico && (
              <li className="col-span-2">
                <button
                  type="button"
                  aria-pressed={livroId === null}
                  onClick={() => {
                    setLivroId(null)
                    fecharEscolhaDeLivro()
                  }}
                  className="opcao py-1.5"
                >
                  <Sparkles size={16} aria-hidden className="text-poeira shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">Automático</span>
                    <span className="text-poeira block truncate text-xs">
                      O palácio escolhe pelo sentido
                    </span>
                  </span>
                  {livroId === null && (
                    <Check size={18} aria-hidden className="text-papel shrink-0" />
                  )}
                </button>
              </li>
            )
          }
        />
      </Folha>

      {executar && (
        <FolhaDeExecutaveis
          aberta={escolhendoExecutavel}
          executaveis={executaveis}
          escolhido={livroId}
          onEscolher={(id) => {
            setLivroId(id)
            fecharEscolhaDeLivro()
          }}
          onCriar={executar.onCriarLivro}
          onFechar={fecharEscolhaDeLivro}
        />
      )}
    </>
  )
}
