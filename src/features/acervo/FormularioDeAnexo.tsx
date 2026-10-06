import { ImagePlus, Link2, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { botao } from '@/components/botao'
import type { AnexoNaTela, TipoDeItem } from '@/core'
import { escolherImagem, type ImagemEscolhida } from '@/services/native/midia'
import type { NovoAnexo } from '@/store/palacio'

import { ehLinkValido } from './links'
import { Miniatura } from './Miniatura'

type Props =
  | {
      modo: 'novo'
      /** O tipo com que o formulário abre: o do "+" que a pessoa tocou na pasta. */
      tipoInicial?: TipoDeItem | undefined
      /** Os tipos que já encheram a pasta (8 cada) — não dá para escolhê-los. */
      cheios?: readonly TipoDeItem[]
      ocupado: boolean
      onCriar: (legenda: string, conteudo: NovoAnexo['conteudo']) => void
    }
  | {
      modo: 'editar'
      anexo: AnexoNaTela
      ocupado: boolean
      onSalvar: (
        legenda: string,
        url: string | undefined,
        imagem: { bytes: Uint8Array; mime: string } | undefined,
      ) => void
    }

type ImagemComPrevia = ImagemEscolhida & { previa: string }

/**
 * Guardar um link ou uma imagem numa pasta, com a legenda que o motor lê.
 *
 * O mesmo formulário cria e edita, como o do livro. Editando, o tipo não muda; o
 * endereço de um link e a imagem (desde 07/10/2026, o "Trocar" do menu da pasta) sim.
 *
 * A legenda diz no próprio espaço vazio o que acontece sem ela: é a regra
 * "combina com a rede ou não" (ver CLAUDE.md, "Pastas de acervo"), e sem
 * dizer ninguém adivinharia por que um item não aparece na Rede.
 */
export function FormularioDeAnexo(props: Props) {
  const editando = props.modo === 'editar' ? props.anexo : null

  const [tipo, setTipo] = useState<TipoDeItem>(
    editando?.midia.tipo ?? (props.modo === 'novo' ? props.tipoInicial : undefined) ?? 'link',
  )
  const cheios = props.modo === 'novo' ? (props.cheios ?? []) : []
  const [url, setUrl] = useState(editando?.midia.tipo === 'link' ? editando.midia.url : '')
  const [legenda, setLegenda] = useState(editando?.legenda ?? '')
  const [escolhida, setEscolhida] = useState<ImagemComPrevia | null>(null)

  // A prévia é um endereço `blob:` — devolvido ao trocar de imagem e ao sair.
  const previaAtual = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (previaAtual.current) URL.revokeObjectURL(previaAtual.current)
    },
    [],
  )

  async function escolher(): Promise<void> {
    const imagem = await escolherImagem()
    if (!imagem) return
    if (previaAtual.current) URL.revokeObjectURL(previaAtual.current)
    const previa = URL.createObjectURL(new Blob([imagem.bytes.slice()], { type: imagem.mime }))
    previaAtual.current = previa
    setEscolhida({ ...imagem, previa })
  }

  const linkOk = ehLinkValido(url)
  const temConteudo = editando
    ? tipo === 'imagem' || linkOk
    : tipo === 'link'
      ? linkOk
      : !!escolhida
  const podeEnviar = temConteudo && !props.ocupado
  const mostrarErroDoLink = tipo === 'link' && url.trim() !== '' && !linkOk

  function enviar(): void {
    if (!podeEnviar) return
    const texto = legenda.trim()

    if (props.modo === 'editar') {
      props.onSalvar(
        texto,
        tipo === 'link' ? url.trim() : undefined,
        tipo === 'imagem' && escolhida
          ? { bytes: escolhida.bytes, mime: escolhida.mime }
          : undefined,
      )
    } else if (tipo === 'link') {
      props.onCriar(texto, { tipo: 'link', url: url.trim() })
    } else if (escolhida) {
      props.onCriar(texto, { tipo: 'imagem', bytes: escolhida.bytes, mime: escolhida.mime })
    }
  }

  return (
    <form
      className="flex flex-1 flex-col gap-5"
      onSubmit={(evento) => {
        evento.preventDefault()
        enviar()
      }}
      // O sinal mais forte que a web tem contra o autofill do Android — o
      // mesmo motivo dos outros formulários do app.
      autoComplete="off"
    >
      {!editando && (
        <div role="group" aria-label="O que guardar" className="flex gap-2">
          <button
            type="button"
            aria-pressed={tipo === 'link'}
            disabled={cheios.includes('link')}
            onClick={() => {
              setTipo('link')
            }}
            className="chip disabled:opacity-45"
          >
            <Link2 size={15} aria-hidden />
            Link
          </button>
          <button
            type="button"
            aria-pressed={tipo === 'imagem'}
            disabled={cheios.includes('imagem')}
            onClick={() => {
              setTipo('imagem')
            }}
            className="chip disabled:opacity-45"
          >
            <ImagePlus size={15} aria-hidden />
            Imagem
          </button>
        </div>
      )}

      {tipo === 'link' ? (
        <label className="flex flex-col">
          <span className="rotulo-de-secao">Endereço</span>
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(evento) => {
              setUrl(evento.target.value)
            }}
            maxLength={4000}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="https://…"
            aria-invalid={mostrarErroDoLink || undefined}
            className="campo h-13 px-4"
          />
          {mostrarErroDoLink && (
            <span className="text-destructive px-1 pt-1.5 text-xs">
              Precisa começar com http:// ou https://
            </span>
          )}
        </label>
      ) : editando && !escolhida ? (
        <div className="flex flex-col items-start gap-2">
          <Miniatura anexo={editando} tamanho="inteira" className="max-h-72 w-full rounded-2xl" />
          <button
            type="button"
            onClick={() => {
              void escolher()
            }}
            className={botao({ tipo: 'fantasma', tamanho: 'pequeno' })}
          >
            <RefreshCw size={15} aria-hidden />
            Trocar imagem
          </button>
        </div>
      ) : escolhida ? (
        <div className="flex flex-col items-start gap-2">
          <img
            src={escolhida.previa}
            alt="A imagem escolhida"
            className="bg-realce max-h-72 w-full rounded-2xl object-contain"
          />
          <button
            type="button"
            onClick={() => {
              void escolher()
            }}
            className={botao({ tipo: 'fantasma', tamanho: 'pequeno' })}
          >
            <RefreshCw size={15} aria-hidden />
            Trocar imagem
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            void escolher()
          }}
          className="border-linha text-poeira active:bg-realce hover:bg-realce/60 flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed transition-colors"
        >
          <ImagePlus size={26} aria-hidden />
          <span className="text-sm">Escolher uma imagem</span>
        </button>
      )}

      <label className="flex flex-col">
        <span className="rotulo-de-secao">Legenda</span>
        <textarea
          value={legenda}
          onChange={(evento) => {
            setLegenda(evento.target.value)
          }}
          maxLength={2000}
          rows={4}
          autoComplete="off"
          placeholder="Sobre o que é isto? Sem legenda, fica só na pasta."
          className="campo min-h-28 resize-none p-4 leading-relaxed"
        />
      </label>

      <div className="barra-de-acao mt-auto md:flex md:justify-end">
        <button
          type="submit"
          disabled={!podeEnviar}
          className={`${botao({ tipo: 'primario', largo: true })} md:w-auto md:min-w-44`}
        >
          {props.ocupado ? 'Guardando…' : editando ? 'Salvar' : 'Guardar na pasta'}
        </button>
      </div>
    </form>
  )
}
