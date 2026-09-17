import { Shuffle } from 'lucide-react'
import { useState } from 'react'

import { botao } from '@/components/botao'
import type { NovoLivro } from '@/store/palacio'

import { COMPRIMENTOS } from './comprimentos'
import { EmblemaDaLombada } from './EmblemaDaLombada'
import { LARGURAS } from './larguras'
import { PANOS, pano } from './panos'

/**
 * Só para a amostra: o comprimento é gravado em % da fileira (o mesmo mundo
 * da altura automática), mas a amostra não vive dentro de uma fileira — vira
 * px por esta referência, igual em espírito ao 44px fixo da amostra de
 * largura automática.
 */
const REFERENCIA_DA_AMOSTRA_PX = 130

/**
 * Mesma conversão, mas para as opções de comprimento — que são um seletor,
 * não a lombada de verdade. Numa referência de 130px "Enorme" (98%) vira uma
 * caixa de 127px, alta o bastante para empurrar a tela do celular para fora
 * sem rolar (pedido do usuário, 16/09/2026). Uma referência bem menor mantém
 * a proporção entre as opções sem pagar esse custo de altura.
 */
const REFERENCIA_DAS_OPCOES_PX = 56

interface Props {
  inicial: NovoLivro
  rotuloDeEnvio: string
  ocupado?: boolean
  /** 0-100: para a amostra mostrar a mesma lavagem da estante. */
  intensidadeDaLuz: number
  onEnviar: (dados: NovoLivro) => void
  /**
   * Ausente numa tela cheia: sair é o "fechar" da barra de topo, como no
   * formulário de neurônio — não precisa de um "Cancelar" a mais ocupando
   * espaço. Presente na folha de editar, que não tem essa barra.
   */
  onCancelar?: () => void
}

/**
 * Nome e pano de um livro — o mesmo formulário para criar e para editar, como o
 * do neurônio.
 *
 * A amostra ao lado é a lombada como ela vai ficar na estante, com a mesma
 * lavagem de luz. Um quadradinho de cor pura enganaria: na prateleira nenhum
 * pano aparece com a cor que tem.
 */
export function FormularioDeLivro({
  inicial,
  rotuloDeEnvio,
  ocupado = false,
  intensidadeDaLuz,
  onEnviar,
  onCancelar,
}: Props) {
  const [titulo, setTitulo] = useState(inicial.titulo)
  const [cor, setCor] = useState(inicial.cor)
  // Sem seção própria no formulário: um livro editado mantém o emblema que já
  // tinha, só não dá mais para escolher um novo.
  const emblema = inicial.emblema
  const [larguraLombada, setLarguraLombada] = useState(inicial.larguraLombada)
  const [comprimentoLombada, setComprimentoLombada] = useState(inicial.comprimentoLombada)

  const podeEnviar = titulo.trim().length > 0 && !ocupado

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (podeEnviar) {
          onEnviar({ titulo: titulo.trim(), cor, emblema, larguraLombada, comprimentoLombada })
        }
      }}
    >
      <div className="flex items-end gap-4">
        <label className="flex min-w-0 flex-1 flex-col">
          <span className="rotulo-de-secao">Nome</span>
          <input
            value={titulo}
            onChange={(evento) => {
              setTitulo(evento.target.value)
            }}
            maxLength={120}
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Uma área do que você sabe"
            className="campo font-titulo h-13 px-4 text-lg"
          />
        </label>

        {/* Altura fixa no teto do que a amostra pode medir (o "Enorme" dos
            presets, ~127px, cabe dentro de 130): sem isto, trocar o
            Comprimento mudava a altura da própria linha e empurrava o resto
            do formulário para baixo — pedido do usuário, 17/09/2026. A
            amostra fica ancorada embaixo (`items-end`), como um livro em pé
            numa prateleira: cresce para cima, nunca desloca o que vem depois. */}
        <div className="flex items-end" style={{ height: `${String(REFERENCIA_DA_AMOSTRA_PX)}px` }}>
          <span
            aria-hidden
            className="lombada lombada--amostra cores-de-antes"
            style={{
              ...pano(cor, intensidadeDaLuz),
              ...(larguraLombada !== null && { width: `${String(larguraLombada)}px` }),
              ...(comprimentoLombada !== null && {
                height: `${String(Math.round((comprimentoLombada / 100) * REFERENCIA_DA_AMOSTRA_PX))}px`,
              }),
            }}
          >
            <span className="lombada-titulo">{titulo.trim() || '…'}</span>
            <EmblemaDaLombada chave={emblema} />
          </span>
        </div>
      </div>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Pano</legend>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3">
          {PANOS.map((p) => (
            <label key={p.cor} className="pano-opcao">
              <input
                type="radio"
                name="pano"
                value={p.cor}
                checked={cor.toLowerCase() === p.cor}
                onChange={() => {
                  setCor(p.cor)
                }}
                className="sr-only"
              />
              <span className="pano-amostra" style={{ backgroundColor: p.cor }} aria-hidden />
              <span className="text-poeira text-[0.7rem] leading-tight">{p.nome}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Largura</legend>
        <div className="flex flex-wrap items-end gap-2">
          <label className="pano-opcao">
            <input
              type="radio"
              name="largura"
              checked={larguraLombada === null}
              onChange={() => {
                setLarguraLombada(null)
              }}
              className="sr-only"
            />
            <span className="pano-amostra largura-amostra largura-amostra--auto" aria-hidden>
              <Shuffle size={16} aria-hidden />
            </span>
            <span className="text-poeira text-[0.7rem] leading-tight">Automática</span>
          </label>
          {LARGURAS.map((l) => (
            <label key={l.chave} className="pano-opcao">
              <input
                type="radio"
                name="largura"
                checked={larguraLombada === l.px}
                onChange={() => {
                  setLarguraLombada(l.px)
                }}
                className="sr-only"
              />
              <span
                className="pano-amostra largura-amostra"
                aria-hidden
                style={{ width: `${String(l.px)}px`, backgroundColor: cor }}
              />
              <span className="text-poeira text-[0.7rem] leading-tight">{l.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Comprimento</legend>
        <div className="flex flex-wrap items-end gap-2">
          <label className="pano-opcao">
            <input
              type="radio"
              name="comprimento"
              checked={comprimentoLombada === null}
              onChange={() => {
                setComprimentoLombada(null)
              }}
              className="sr-only"
            />
            <span
              className="pano-amostra comprimento-amostra comprimento-amostra--auto"
              aria-hidden
            >
              <Shuffle size={16} aria-hidden />
            </span>
            <span className="text-poeira text-[0.7rem] leading-tight">Automático</span>
          </label>
          {COMPRIMENTOS.map((c) => (
            <label key={c.chave} className="pano-opcao">
              <input
                type="radio"
                name="comprimento"
                checked={comprimentoLombada === c.percentual}
                onChange={() => {
                  setComprimentoLombada(c.percentual)
                }}
                className="sr-only"
              />
              <span
                className="pano-amostra comprimento-amostra"
                aria-hidden
                style={{
                  height: `${String(Math.round((c.percentual / 100) * REFERENCIA_DAS_OPCOES_PX))}px`,
                  backgroundColor: cor,
                }}
              />
              <span className="text-poeira text-[0.7rem] leading-tight">{c.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {onCancelar ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className={botao({ tipo: 'secundario', largo: true })}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!podeEnviar}
            className={botao({ tipo: 'primario', largo: true })}
          >
            {rotuloDeEnvio}
          </button>
        </div>
      ) : (
        <div className="barra-de-acao md:flex md:justify-end">
          <button
            type="submit"
            disabled={!podeEnviar}
            className={`${botao({ tipo: 'primario', largo: true })} md:w-auto md:min-w-44`}
          >
            {rotuloDeEnvio}
          </button>
        </div>
      )}
    </form>
  )
}
