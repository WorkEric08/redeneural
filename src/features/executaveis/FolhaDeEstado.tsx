import { ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { botao } from '@/components/botao'
import { Folha } from '@/components/Folha'
import type { EstadoDaIdeia, ImagemParaGuardar, NeuronioNaTela } from '@/core'
import { escolherImagem } from '@/services/native/midia'

import { ROTULO_DO_ESTADO } from './estados'
import { IconeDoEstado } from './IconeDoEstado'
import { ImagemDoResultado } from './ImagemDoResultado'

/** Na ordem do andamento, e não na das seções do livro. */
const OPCOES: readonly EstadoDaIdeia[] = ['para_fazer', 'fazendo', 'feita']

/**
 * O que a folha devolve sobre a imagem do resultado: `undefined` mantém a que a ideia já
 * tinha (ou nenhuma), uma imagem nova a troca, e `null` a tira.
 */
type ImagemDoResultadoEscolhida = ImagemParaGuardar | null | undefined

interface Props {
  aberta: boolean
  neuronio: NeuronioNaTela | undefined
  /** O estado que a tela mostra agora (`estadoVisivel`). */
  estadoAtual: EstadoDaIdeia | null
  onDefinir: (
    estado: EstadoDaIdeia,
    resultadoLink: string | null,
    resultadoImagem: ImagemDoResultadoEscolhida,
  ) => Promise<boolean>
  onFechar: () => void
}

/** Um link do resultado vale se é http ou https — a mesma regra do motor. */
function linkValido(texto: string): boolean {
  if (texto === '') return true
  try {
    const url = new URL(texto)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Mudar o andamento de uma ideia: tocar "Para fazer" ou "Fazendo" muda e
 * fecha. "Feita" abre o link e a imagem do resultado — opcionais — antes de
 * confirmar, que é o momento de dizer onde (e como) o que saiu da ideia está.
 */
export function FolhaDeEstado({ aberta, neuronio, estadoAtual, onDefinir, onFechar }: Props) {
  return (
    <Folha aberta={aberta && neuronio !== undefined} rotulo="Andamento" onFechar={onFechar}>
      {/* Montado só aberto, e por ideia: a escolha, o link e a imagem recomeçam do que
          está gravado a cada abertura. */}
      {aberta && neuronio && estadoAtual && (
        <Conteudo
          key={neuronio.id}
          neuronio={neuronio}
          estadoAtual={estadoAtual}
          onDefinir={onDefinir}
          onFechar={onFechar}
        />
      )}
    </Folha>
  )
}

type Escolhida = ImagemParaGuardar & { previa: string }

function Conteudo({
  neuronio,
  estadoAtual,
  onDefinir,
  onFechar,
}: {
  neuronio: NeuronioNaTela
  estadoAtual: EstadoDaIdeia
  onDefinir: Props['onDefinir']
  onFechar: () => void
}) {
  const [escolhido, setEscolhido] = useState<EstadoDaIdeia>(estadoAtual)
  const [link, setLink] = useState(neuronio.resultadoLink ?? '')
  const [gravando, setGravando] = useState(false)
  const valido = linkValido(link.trim())

  // A imagem do resultado: a que a ideia já tem, uma nova escolhida agora (com prévia) ou
  // a tirada. A prévia é um endereço `blob:` — devolvido ao trocar e ao sair.
  const [nova, setNova] = useState<Escolhida | null>(null)
  const [tirada, setTirada] = useState(false)
  const previaAtual = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (previaAtual.current) URL.revokeObjectURL(previaAtual.current)
    },
    [],
  )
  const temImagem = nova !== null || (neuronio.resultadoImagem !== null && !tirada)

  async function escolher(): Promise<void> {
    const imagem = await escolherImagem()
    if (!imagem) return
    if (previaAtual.current) URL.revokeObjectURL(previaAtual.current)
    const previa = URL.createObjectURL(new Blob([imagem.bytes.slice()], { type: imagem.mime }))
    previaAtual.current = previa
    setNova({ ...imagem, previa })
    setTirada(false)
  }

  function tirar(): void {
    if (previaAtual.current) URL.revokeObjectURL(previaAtual.current)
    previaAtual.current = null
    setNova(null)
    setTirada(true)
  }

  function definir(
    estado: EstadoDaIdeia,
    resultadoLink: string | null,
    imagem: ImagemDoResultadoEscolhida,
  ): void {
    setGravando(true)
    void onDefinir(estado, resultadoLink, imagem).then((ok) => {
      setGravando(false)
      if (ok) onFechar()
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* O título inteiro, quebrando em linhas: a folha existe para mudar o
          andamento DESTA ideia, e cortar o nome com reticências esconde qual é. */}
      <h2 className="font-titulo px-1 text-xl leading-snug font-semibold tracking-tight [overflow-wrap:anywhere]">
        {neuronio.titulo}
      </h2>

      {/* As três opções numa fileira só (e não numa lista de três linhas): a
          folha inteira cabe sem rolar mesmo numa tela baixa ou com o teclado
          aberto para digitar o link. */}
      <div role="group" aria-label="Andamento" className="segmentado">
        {OPCOES.map((estado) => (
          <button
            key={estado}
            type="button"
            disabled={gravando}
            aria-pressed={escolhido === estado}
            onClick={() => {
              if (estado === 'feita') setEscolhido('feita')
              else if (estado === estadoAtual) onFechar()
              else definir(estado, null, undefined)
            }}
            className="segmento h-12"
          >
            <IconeDoEstado estado={estado} tamanho={16} />
            {ROTULO_DO_ESTADO[estado]}
          </button>
        ))}
      </div>

      {escolhido === 'feita' && (
        <form
          autoComplete="off"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valido || gravando) return
            definir(
              'feita',
              link.trim() || null,
              nova ? { bytes: nova.bytes, mime: nova.mime } : tirada ? null : undefined,
            )
          }}
        >
          {/* O link e a imagem na mesma linha, sem rótulo à parte: o placeholder já diz o
              que é, e uma linha a menos é o que deixa a folha caber inteira com o teclado
              aberto numa tela baixa. Com imagem, o botão dela mostra a prévia (tocar troca)
              e ganha um "tirar" ao lado. */}
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
              }}
              type="url"
              inputMode="url"
              autoComplete="off"
              enterKeyHint="done"
              aria-label="Link do resultado"
              placeholder="Link (opcional)"
              aria-invalid={!valido}
              className="campo h-11 min-w-0 flex-1 px-4"
            />
            <button
              type="button"
              disabled={gravando}
              onClick={() => {
                void escolher()
              }}
              aria-label={
                temImagem ? 'Trocar a imagem do resultado' : 'Adicionar uma imagem do resultado'
              }
              className="campo text-poeira grid size-11 shrink-0 place-items-center overflow-hidden p-0"
            >
              {nova ? (
                <img src={nova.previa} alt="" className="size-full object-cover" />
              ) : neuronio.resultadoImagem !== null && !tirada ? (
                <ImagemDoResultado neuronio={neuronio} className="size-full" />
              ) : (
                <ImagePlus size={20} aria-hidden />
              )}
            </button>
            {temImagem && (
              <button
                type="button"
                disabled={gravando}
                onClick={tirar}
                aria-label="Tirar a imagem do resultado"
                className="campo text-poeira grid size-11 shrink-0 place-items-center p-0"
              >
                <X size={18} aria-hidden />
              </button>
            )}
          </div>
          {!valido && (
            <p className="text-destructive px-1 text-xs">Um link começa com http:// ou https://.</p>
          )}
          <button
            type="submit"
            disabled={!valido || gravando}
            className={botao({ tipo: 'primario', largo: true, tamanho: 'pequeno' })}
          >
            {estadoAtual === 'feita' ? 'Salvar' : 'Marcar como feita'}
          </button>
        </form>
      )}
    </div>
  )
}
