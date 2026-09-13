import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as EventoDePonteiro,
  type ReactNode,
} from 'react'

interface Props {
  aberta: boolean
  /** Nome acessível do painel — "Espiar Música", "Um livro novo". */
  rotulo: string
  onFechar: () => void
  children: ReactNode
}

/** Arrastou mais que isto (ou até a metade da folha, se ela for baixa) — fecha. */
const LIMIAR_PADRAO = 96
/** Ou soltou rápido, mesmo sem chegar lá — é o gesto de "jogar fora", não de medir. */
const VELOCIDADE_PARA_FECHAR = 0.6 // px/ms
/** Tempo do arremate: a folha termina de sair antes de a store desmontar o diálogo. */
const DURACAO_DO_ARREMATE_MS = 190

/**
 * Painel que sobe de baixo no celular e vira diálogo a partir do tablet
 * (CLAUDE.md §6).
 *
 * `<dialog>` nativo com `showModal`, e não uma div com z-index: ele vai para a
 * camada do topo, fora de qualquer `transform` ou `overflow` dos ancestrais,
 * prende o foco lá dentro, fecha no Esc e deixa o resto da tela inerte — tudo
 * sem dependência. Quem decide se está aberto é quem chama, pela URL; esta
 * folha só obedece.
 *
 * A alça arrasta o `<dialog>` de verdade: `transform` vai direto no elemento a
 * cada quadro (sem passar pelo React, como o fantasma da estante), e só na
 * soltura entra uma transição — puxar tem que ser instantâneo, e soltar,
 * macio. Ela fica **fora** de `.folha-corpo` (que rola), fixa acima do
 * conteúdo: se o painel tiver uma lista comprida, a alça continua ali.
 */
export function Folha({ aberta, rotulo, onFechar, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const arrasto = useRef<{
    pointerId: number
    y0: number
    t0: number
    dy: number
    limiar: number
  } | null>(null)

  const posicionar = useCallback(
    (d: HTMLDialogElement | null, dy: number, comTransicao: boolean) => {
      if (!d) return
      d.classList.toggle('folha--solta', comTransicao)
      d.style.transform = dy > 0 ? `translateY(${String(dy)}px)` : ''
    },
    [],
  )

  useEffect(() => {
    const d = dialogo.current
    if (!d) return

    if (aberta && !d.open) d.showModal()
    if (!aberta && d.open) d.close()
  }, [aberta])

  // Some quando o painel troca (do menu para "renomear", por exemplo): a folha
  // de baixo não pode herdar o arrasto da de cima.
  useEffect(() => {
    posicionar(dialogo.current, 0, false)
  }, [rotulo, posicionar])

  function aoSegurarAAlca(evento: EventoDePonteiro<HTMLDivElement>): void {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    const altura = dialogo.current?.offsetHeight ?? 0
    arrasto.current = {
      pointerId: evento.pointerId,
      y0: evento.clientY,
      t0: performance.now(),
      dy: 0,
      limiar: Math.min(LIMIAR_PADRAO, altura / 2),
    }
  }

  function aoArrastarAAlca(evento: EventoDePonteiro<HTMLDivElement>): void {
    const a = arrasto.current
    if (!a || evento.pointerId !== a.pointerId) return

    a.dy = Math.max(0, evento.clientY - a.y0)
    posicionar(dialogo.current, a.dy, false)
  }

  function aoSoltarAAlca(evento: EventoDePonteiro<HTMLDivElement>): void {
    const a = arrasto.current
    if (!a || evento.pointerId !== a.pointerId) return
    arrasto.current = null

    const velocidade = a.dy / Math.max(1, performance.now() - a.t0)

    if (a.dy > a.limiar || velocidade > VELOCIDADE_PARA_FECHAR) {
      // Termina de sair sozinha antes de pedir o fechamento de verdade — soltar
      // não pode parecer que o painel travou no meio do caminho.
      posicionar(dialogo.current, dialogo.current?.offsetHeight ?? 400, true)
      window.setTimeout(onFechar, DURACAO_DO_ARREMATE_MS)
    } else {
      posicionar(dialogo.current, 0, true)
    }
  }

  return (
    <dialog
      ref={dialogo}
      className="folha"
      aria-label={rotulo}
      onCancel={(evento) => {
        // O Esc fecha pela URL, como o botão voltar — senão o diálogo some e a
        // busca continua dizendo que ele está aberto.
        evento.preventDefault()
        onFechar()
      }}
      onClick={(evento) => {
        // Clique no próprio <dialog>, fora do corpo, é clique no fundo escuro.
        if (evento.target === evento.currentTarget) onFechar()
      }}
    >
      <div
        className="folha-alca"
        aria-hidden
        onPointerDown={aoSegurarAAlca}
        onPointerMove={aoArrastarAAlca}
        onPointerUp={aoSoltarAAlca}
        onPointerCancel={aoSoltarAAlca}
      >
        <span className="folha-alca-barra" />
      </div>

      <div className="folha-corpo">{children}</div>
    </dialog>
  )
}
