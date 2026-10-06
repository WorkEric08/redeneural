import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as EventoDePonteiro,
} from 'react'

import { deslocamentoDaPista, indiceDepoisDoGesto, TOLERANCIA_DO_TOQUE_PX } from '@/lib/visor'

export interface ImagemDoVisor {
  id: string
  mime: string
  /** O que o leitor de tela diz da imagem — a legenda, ou o título da ideia. */
  rotulo: string
}

interface Props {
  aberto: boolean
  imagens: readonly ImagemDoVisor[]
  /** A imagem à mostra: quem chama guarda (na URL), e o visor só obedece. */
  indice: number
  onIndice: (indice: number) => void
  /** Os bytes de uma imagem, para o visor desenhá-la. Estável: está nas dependências do efeito. */
  carregar: (id: string) => Promise<Uint8Array | null>
  onFechar: () => void
}

/**
 * A imagem ampliada: no meio da tela, com o fundo desfocado (07/10/2026, pedido do usuário).
 *
 * Com mais de uma imagem (as de uma pasta, até 8) troca-se arrastando para o lado ou pelas
 * setas — e pelas teclas ← →, no desktop. Tocar fora da imagem, o ×, o Esc e o voltar do
 * Android fecham.
 *
 * `<dialog>` nativo com `showModal`, como a `Folha`: vai para a camada do topo, prende o foco e
 * deixa a tela de baixo inerte. Só a imagem à mostra e as duas vizinhas são desenhadas — a
 * vizinha já está pronta quando o dedo chega nela, e oito fotos grandes não ficam na memória.
 */
export function VisorDeImagens({ aberto, imagens, indice, onIndice, carregar, onFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const total = imagens.length
  const atual = Math.min(Math.max(0, indice), Math.max(0, total - 1))

  // O quanto o dedo arrastou a pista (px), ou `null` parada. Em estado, e não em ref: a pista
  // se move a cada `pointermove`, e são três imagens — barato.
  const [arrasto, setArrasto] = useState<number | null>(null)
  const gesto = useRef<{
    id: number
    x0: number
    t0: number
    largura: number
    aoToqueNaImagem: boolean
  } | null>(null)

  useLayoutEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  const ir = useCallback(
    (passo: -1 | 1) => {
      const novo = atual + passo
      if (novo >= 0 && novo < total) onIndice(novo)
    },
    [atual, total, onIndice],
  )

  useEffect(() => {
    if (!aberto) return
    const aoTecla = (evento: KeyboardEvent): void => {
      if (evento.key === 'ArrowLeft') ir(-1)
      else if (evento.key === 'ArrowRight') ir(1)
    }
    window.addEventListener('keydown', aoTecla)
    return () => {
      window.removeEventListener('keydown', aoTecla)
    }
  }, [aberto, ir])

  function aoDescer(evento: EventoDePonteiro<HTMLDivElement>): void {
    if (evento.button !== 0) return
    gesto.current = {
      id: evento.pointerId,
      x0: evento.clientX,
      t0: performance.now(),
      largura: evento.currentTarget.clientWidth,
      aoToqueNaImagem: evento.target instanceof HTMLImageElement,
    }
    evento.currentTarget.setPointerCapture(evento.pointerId)
  }

  function aoMover(evento: EventoDePonteiro<HTMLDivElement>): void {
    const g = gesto.current
    if (!g || evento.pointerId !== g.id || total < 2) return
    setArrasto(
      deslocamentoDaPista({
        indice: atual,
        total,
        deslocamento: evento.clientX - g.x0,
      }),
    )
  }

  function aoSoltar(evento: EventoDePonteiro<HTMLDivElement>): void {
    const g = gesto.current
    if (!g || evento.pointerId !== g.id) return
    gesto.current = null
    setArrasto(null)

    const deslocamento = evento.clientX - g.x0
    if (Math.abs(deslocamento) < TOLERANCIA_DO_TOQUE_PX) {
      // Um toque: na imagem não faz nada, no fundo fecha.
      if (!g.aoToqueNaImagem) onFechar()
      return
    }

    const novo = indiceDepoisDoGesto({
      indice: atual,
      total,
      deslocamento,
      velocidade: deslocamento / Math.max(1, performance.now() - g.t0),
    })
    if (novo !== atual) onIndice(novo)
  }

  function aoCancelar(): void {
    gesto.current = null
    setArrasto(null)
  }

  return (
    <dialog
      ref={dialogo}
      className="visor"
      aria-label={total > 1 ? 'Imagens ampliadas' : 'Imagem ampliada'}
      onCancel={(evento) => {
        // O Esc fecha pela URL, como o botão voltar — senão o diálogo some e a busca continua
        // dizendo que ele está aberto.
        evento.preventDefault()
        onFechar()
      }}
    >
      {aberto && (
        <>
          {/* O desfoque é desta camada, e não do `::backdrop`: assim ele aparece em todo
              navegador e WebView que desfoca o que está atrás de um elemento. */}
          <div className="visor-vidro" aria-hidden />
          <header className="visor-topo">
            <p className="visor-contador" aria-live="polite">
              {total > 1 ? `${String(atual + 1)} / ${String(total)}` : ''}
            </p>
            <button
              type="button"
              aria-label="Fechar a imagem"
              onClick={onFechar}
              className="visor-botao"
            >
              <X size={22} aria-hidden />
            </button>
          </header>

          {/* A área do gesto: `touch-action: pan-y` deixa o arrasto horizontal para o app (e a
              rolagem vertical, que aqui não existe, para o navegador). */}
          <div
            className="visor-pista"
            onPointerDown={aoDescer}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoCancelar}
          >
            <div
              className="visor-trilho"
              data-arrastando={arrasto !== null || undefined}
              style={{
                transform: `translateX(calc(${String(-atual * 100)}% + ${String(arrasto ?? 0)}px))`,
              }}
            >
              {imagens.map((imagem, i) => (
                <div
                  key={imagem.id}
                  className="visor-slide"
                  aria-hidden={i !== atual}
                  aria-roledescription="imagem"
                >
                  {Math.abs(i - atual) <= 1 && <Slide imagem={imagem} carregar={carregar} />}
                </div>
              ))}
            </div>
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                aria-label="Imagem anterior"
                disabled={atual === 0}
                onClick={() => {
                  ir(-1)
                }}
                className="visor-botao visor-seta visor-seta--esq"
              >
                <ChevronLeft size={26} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Próxima imagem"
                disabled={atual === total - 1}
                onClick={() => {
                  ir(1)
                }}
                className="visor-botao visor-seta visor-seta--dir"
              >
                <ChevronRight size={26} aria-hidden />
              </button>
            </>
          )}
        </>
      )}
    </dialog>
  )
}

function Slide({ imagem, carregar }: { imagem: ImagemDoVisor; carregar: Props['carregar'] }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let viva = true
    let criada: string | null = null
    void carregar(imagem.id).then((bytes) => {
      if (!viva || !bytes) return
      criada = URL.createObjectURL(new Blob([bytes.slice()], { type: imagem.mime }))
      setUrl(criada)
    })
    return () => {
      viva = false
      if (criada) URL.revokeObjectURL(criada)
    }
  }, [imagem.id, imagem.mime, carregar])

  return url ? (
    <img src={url} alt={imagem.rotulo} draggable={false} className="visor-imagem" />
  ) : (
    <ImageIcon size={32} aria-hidden className="text-white/70" />
  )
}
