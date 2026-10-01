import { Hammer } from 'lucide-react'
import { useState } from 'react'

import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import type { Id, Livro } from '@/core'
import { EscolhaDeLivro } from '@/features/neuronio/EscolhaDeLivro'

import { NOME_SUGERIDO_DO_EXECUTAVEL } from './estados'

interface Props {
  aberta: boolean
  /** Só os livros executáveis. */
  executaveis: readonly Livro[]
  escolhido: Id | null
  onEscolher: (livroId: Id) => void
  /** Cria um livro executável e devolve o id — ou `null` se não deu. */
  onCriar: (titulo: string) => Promise<Id | null>
  onFechar: () => void
}

/**
 * "Para qual livro executável?" — a entrada explícita de uma ideia num livro
 * executável, na captura ("Quero executar isso") e numa ideia já guardada
 * ("Tornar executável"). Com vários, a pessoa escolhe; sem nenhum, o app
 * oferece criar um, com nome sugerido.
 */
export function FolhaDeExecutaveis({
  aberta,
  executaveis,
  escolhido,
  onEscolher,
  onCriar,
  onFechar,
}: Props) {
  return (
    <Folha aberta={aberta} rotulo="Livro executável" onFechar={onFechar}>
      {executaveis.length > 0 ? (
        <>
          <p className="text-poeira px-1 pb-3 text-sm">Em qual livro executável?</p>
          <EscolhaDeLivro livros={executaveis} escolhido={escolhido} onEscolher={onEscolher} />
        </>
      ) : (
        // Montado só aberto: o nome sugerido volta a cada abertura.
        aberta && <CriarPrimeiro onCriar={onCriar} onCriado={onEscolher} />
      )}
    </Folha>
  )
}

function CriarPrimeiro({
  onCriar,
  onCriado,
}: {
  onCriar: (titulo: string) => Promise<Id | null>
  onCriado: (livroId: Id) => void
}) {
  const [titulo, setTitulo] = useState(NOME_SUGERIDO_DO_EXECUTAVEL)
  const [criando, setCriando] = useState(false)
  const podeCriar = titulo.trim().length > 0 && !criando

  return (
    <form
      autoComplete="off"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!podeCriar) return
        setCriando(true)
        void onCriar(titulo).then((id) => {
          setCriando(false)
          if (id) onCriado(id)
        })
      }}
    >
      <div className="flex items-start gap-3 px-1">
        <span className="bg-realce text-papel grid size-10 shrink-0 place-items-center rounded-full">
          <Hammer size={18} aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-titulo text-lg font-semibold">Ainda não há livro executável</p>
          <p className="text-poeira text-sm leading-relaxed">
            É um livro de ideias para fazer — textos, estudos, vídeos —, cada uma com o seu
            andamento. O Porto nunca guarda nada nele sozinho.
          </p>
        </div>
      </div>
      <label className="flex flex-col">
        <span className="rotulo-de-secao">Nome</span>
        <input
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value)
          }}
          maxLength={120}
          autoComplete="off"
          enterKeyHint="done"
          className="campo font-titulo h-13 px-4 text-lg"
        />
      </label>
      <button
        type="submit"
        disabled={!podeCriar}
        className={botao({ tipo: 'primario', largo: true })}
      >
        {criando ? 'Criando…' : 'Criar livro executável'}
      </button>
    </form>
  )
}
