import { Check, ChevronDown } from 'lucide-react'
import { useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import type { Livro } from '@/core'
import type { NovoNeuronio } from '@/store/palacio'

import { BarraDeEscrita, type AcaoDeEscrita } from './BarraDeEscrita'
import {
  alternarEnvolvido,
  alternarLista,
  ciclarTitulo,
  mudarRecuo,
  type Selecao,
} from './marcacao'
import { useTextoComHistorico } from './useTextoComHistorico'

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

/** Cada botão da barra e a marcação que ele aplica (ver `marcacao.ts`). */
function marcar(acao: Exclude<AcaoDeEscrita, 'desfazer' | 'refazer'>, s: Selecao): Selecao {
  switch (acao) {
    case 'negrito':
      return alternarEnvolvido(s, '**')
    case 'italico':
      return alternarEnvolvido(s, '*')
    case 'tachado':
      return alternarEnvolvido(s, '~~')
    case 'titulo':
      return ciclarTitulo(s)
    case 'marcador':
      return alternarLista(s, 'marcador')
    case 'numero':
      return alternarLista(s, 'numero')
    case 'tarefa':
      return alternarLista(s, 'tarefa')
    case 'recuar':
      return mudarRecuo(s, 1)
    case 'desrecuar':
      return mudarRecuo(s, -1)
  }
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
  const texto = useTextoComHistorico(inicial?.conteudo ?? '')
  /** A barra de ferramentas existe enquanto o dedo está no texto. */
  const [escrevendo, setEscrevendo] = useState(false)
  const campo = useRef<HTMLTextAreaElement>(null)

  // A folha de escolher livro mora na URL, como qualquer outro painel do app
  // (filtros da Rede, apagar do neurônio): o voltar do Android fecha a folha
  // antes de sair do formulário.
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()
  const escolhendoLivro = busca.get('livros') === '1'

  const conteudo = texto.passo.texto
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

  // Um passo vindo de botão (marcar, desfazer, refazer) reescreve o campo
  // inteiro, e o navegador joga o cursor para o fim. Repor a seleção é o que
  // deixa marcar três palavras e continuar com elas marcadas.
  const reporOCursor = useEffectEvent(() => {
    campo.current?.focus()
    campo.current?.setSelectionRange(texto.passo.inicio, texto.passo.fim)
  })

  useLayoutEffect(() => {
    if (texto.acao > 0) reporOCursor()
  }, [texto.acao])

  function executar(acao: AcaoDeEscrita): void {
    if (acao === 'desfazer') {
      texto.desfazer()
      return
    }
    if (acao === 'refazer') {
      texto.refazer()
      return
    }

    const alvo = campo.current
    if (!alvo) return
    texto.aplicar(
      marcar(acao, { texto: conteudo, inicio: alvo.selectionStart, fim: alvo.selectionEnd }),
    )
  }

  return (
    <>
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
          </div>

          {aviso !== undefined && (
            <p className="text-poeira pt-3 text-xs leading-relaxed">{aviso}</p>
          )}

          {/* A folha: cresce com o texto e, enquanto o texto é curto, ocupa o que
            sobra da tela — tocar em qualquer ponto dela já põe o cursor. */}
          <textarea
            ref={campo}
            value={conteudo}
            onChange={(e) => {
              texto.digitar({
                texto: e.target.value,
                inicio: e.target.selectionStart,
                fim: e.target.selectionEnd,
              })
            }}
            onFocus={() => {
              setEscrevendo(true)
            }}
            onBlur={(e) => {
              // Tocar num botão da barra não tira o foco (o botão recusa o
              // `pointerdown`), mas o Tab do teclado tira — e aí a barra precisa
              // continuar de pé para receber o foco que está indo para ela.
              const indo = e.relatedTarget
              if (indo instanceof Element && indo.closest('[data-barra-de-escrita]')) return
              setEscrevendo(false)
            }}
            aria-label="Com suas palavras"
            placeholder="Escreva com suas palavras."
            className="placeholder:text-poeira [field-sizing:content] w-full flex-1 resize-none bg-transparent px-1 pt-4 pb-2 text-base leading-relaxed outline-none"
          />
        </div>

        {/* Empilhados, e não um no lugar do outro: com o teclado aberto no
            celular, "Criar neurônio" precisa continuar alcançável enquanto
            se escreve — sem isso não havia como salvar (pedido do usuário,
            17/09/2026). `.rodape-de-escrita` é quem gruda no pé da tela; os
            dois filhos ficam em fluxo normal dentro dele (ver index.css). */}
        <div className="rodape-de-escrita">
          {escrevendo && (
            <BarraDeEscrita
              onAcao={executar}
              podeDesfazer={texto.podeDesfazer}
              podeRefazer={texto.podeRefazer}
            />
          )}

          <div className="barra-de-acao md:flex md:justify-end">
            <button
              type="submit"
              disabled={!podeEnviar}
              className={`${botao({ tipo: 'primario', largo: true })} md:w-auto md:min-w-44`}
            >
              {ocupado ? 'Processando…' : rotuloDeEnvio}
            </button>
          </div>
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
