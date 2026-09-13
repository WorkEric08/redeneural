import { useState } from 'react'

import { botao } from '@/components/botao'
import type { NovoLivro } from '@/store/palacio'

import { PANOS, pano } from './panos'

interface Props {
  inicial: NovoLivro
  rotuloDeEnvio: string
  ocupado?: boolean
  onEnviar: (dados: NovoLivro) => void
  onCancelar: () => void
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
  onEnviar,
  onCancelar,
}: Props) {
  const [titulo, setTitulo] = useState(inicial.titulo)
  const [cor, setCor] = useState(inicial.cor)

  const podeEnviar = titulo.trim().length > 0 && !ocupado

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (podeEnviar) onEnviar({ titulo: titulo.trim(), cor })
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

        <span aria-hidden className="lombada lombada--amostra cores-de-antes" style={pano(cor)}>
          <span className="lombada-titulo">{titulo.trim() || '…'}</span>
        </span>
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
    </form>
  )
}
