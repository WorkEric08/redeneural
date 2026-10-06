import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as EventoDePonteiro,
  type ReactNode,
} from 'react'

import { paradasDaFolha, type Paradas } from './paradasDaFolha'

interface Props {
  aberta: boolean
  /** Nome acessível do painel — "Espiar Música", "Um livro novo". */
  rotulo: string
  onFechar: () => void
  children: ReactNode
}

/** Só o celular tem paradas de altura; do tablet em diante é diálogo centralizado. */
const CONSULTA_DO_CELULAR = '(max-width: 767.98px)'
/** Passou da parada de cima, o dedo continua mandando, mas a folha só segue uma fração. */
const RESISTENCIA_DO_ESTICAR = 0.35
const ESTICAR_MAXIMO_PX = 36
/** Arrastou mais que isto (ou até a metade da folha, se ela for baixa) — fecha. */
const LIMIAR_PARA_FECHAR_PX = 96
/** Ou soltou rápido, mesmo sem chegar lá — é o gesto de "jogar fora", não de medir. */
const VELOCIDADE_PARA_FECHAR = 0.6 // px/ms
/** Soltou rápido entre as duas paradas: vai para a que o dedo apontou. */
const VELOCIDADE_PARA_TROCAR = 0.35 // px/ms
/** Quanto o dedo anda no corpo antes de o gesto virar do sheet (e não um toque). */
const LIMIAR_DO_GESTO_PX = 6
/** Tempo do arremate: a folha termina de sair antes de a store desmontar o diálogo. */
const DURACAO_DO_ARREMATE_MS = 190

type Parada = 'meio' | 'cheio'

interface Arrasto {
  pointerId: number | null
  y0: number
  /** A altura da folha quando o dedo desceu. */
  h0: number
  /** Onde a folha está agora: altura, e quanto já escorregou para fora da tela. */
  h: number
  ty: number
  yAnterior: number
  tAnterior: number
  /** px/ms, suavizada; positiva é para baixo. */
  velocidade: number
}

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
 * **Duas paradas de altura** (02/10/2026, no molde dos sheets do Spotify): a
 * folha abre no tamanho do conteúdo, se ele cabe na tela (até 92% dela) — sem
 * esticar e sem rolar — e, só se ele passa disso, abre pela metade e **estica**
 * até perto do topo ao ser puxada para cima. (Até 06/10/2026 abria sempre no
 * máximo pela metade: um conteúdo de 420px numa tela de 568px, ou com o
 * teclado aberto, pedia deslize para ser lido inteiro.) Só na parada de cima a lista rola por dentro; antes disso o dedo que sobe
 * estica a folha, e o que desce a recolhe, e depois de recolhida, fecha. O
 * efeito elástico: passou da parada de cima, a folha segue o dedo a uma fração e
 * volta macia ao soltar.
 *
 * O gesto vale na alça e no corpo. A altura e o `transform` vão direto no
 * elemento a cada quadro (sem passar pelo React, como o fantasma da estante), e
 * só na soltura entra uma transição — puxar tem que ser instantâneo, e soltar,
 * macio. A alça fica **fora** de `.folha-corpo` (que rola): se o painel tiver uma
 * lista comprida, ela continua ali.
 */
export function Folha({ aberta, rotulo, onFechar, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const alca = useRef<HTMLDivElement>(null)
  const corpo = useRef<HTMLDivElement>(null)
  const conteudo = useRef<HTMLDivElement>(null)
  const paradas = useRef<Paradas>({ meio: 0, cheio: 0, expansivel: false })
  const parada = useRef<Parada>('meio')
  const arrasto = useRef<Arrasto | null>(null)
  const fechar = useRef(onFechar)

  useEffect(() => {
    fechar.current = onFechar
  })

  /** Altura e deslocamento da folha. Com `comTransicao`, o movimento é macio. */
  const aplicar = useCallback((altura: number | null, ty: number, comTransicao: boolean) => {
    const d = dialogo.current
    if (!d) return
    d.classList.toggle('folha--solta', comTransicao)
    if (altura !== null) d.style.height = `${String(altura)}px`
    d.style.transform = ty > 0 ? `translateY(${String(ty)}px)` : ''
  }, [])

  /**
   * Mede o conteúdo e posiciona a folha na parada em que está. Roda quando abre,
   * quando o conteúdo muda de tamanho e quando a tela gira ou o teclado abre.
   * Fechado o `<dialog>` não tem tamanho nenhum, então só mede aberto.
   */
  const medir = useCallback(() => {
    const d = dialogo.current
    const a = alca.current
    const c = corpo.current
    const cont = conteudo.current
    if (!d || !a || !c || !cont || !d.open || arrasto.current) return

    if (!window.matchMedia(CONSULTA_DO_CELULAR).matches) {
      d.style.height = ''
      d.dataset.expansivel = 'false'
      return
    }

    const estilo = getComputedStyle(c)
    const natural =
      a.offsetHeight +
      parseFloat(estilo.paddingTop) +
      parseFloat(estilo.paddingBottom) +
      cont.offsetHeight
    paradas.current = paradasDaFolha(natural, window.innerHeight)
    const { expansivel } = paradas.current
    if (!expansivel) parada.current = 'meio'
    d.dataset.expansivel = String(expansivel)
    d.dataset.altura = parada.current
    d.style.height = `${String(paradas.current[parada.current])}px`
  }, [])

  // Abre antes de pintar: o <dialog> fechado não tem tamanho, e medir depois do
  // primeiro quadro mostraria a folha com a altura do conteúdo por um instante.
  useLayoutEffect(() => {
    const d = dialogo.current
    if (!d) return

    // `showModal` foca a primeira coisa focável lá dentro — num painel com
    // campo, é o campo, e no celular isso abre o teclado sem a pessoa ter
    // tocado nele. Um descendente com `autofocus` vence essa regra, então o
    // foco vai para o corpo da folha e o teclado espera o toque. (No próprio
    // <dialog> o Chrome ignora o atributo; e o React não o escreve fora de
    // campo de formulário — daí o `setAttribute`.)
    corpo.current?.setAttribute('autofocus', '')

    if (aberta && !d.open) {
      // Fechar arrastando deixa a folha empurrada para fora da tela. Sem
      // zerar aqui, uma folha de rótulo fixo (os filtros da Rede) reabria só
      // com o fundo desfocado, e o painel preso lá embaixo.
      parada.current = 'meio'
      aplicar(null, 0, false)
      d.showModal()
      medir()
    }
    if (!aberta && d.open) d.close()
  }, [aberta, aplicar, medir])

  // Some quando o painel troca (do menu para "renomear", por exemplo): a folha
  // de baixo não pode herdar o arrasto, nem a altura, da de cima.
  useEffect(() => {
    parada.current = 'meio'
    aplicar(null, 0, false)
    medir()
  }, [rotulo, aplicar, medir])

  // O conteúdo muda de tamanho sozinho (a lista carrega, um campo some), e a tela
  // também (gira, teclado): as paradas se refazem.
  useEffect(() => {
    const cont = conteudo.current
    if (!cont) return
    const observador = new ResizeObserver(medir)
    observador.observe(cont)
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [medir])

  const iniciar = useCallback((y: number, pointerId: number | null) => {
    const d = dialogo.current
    if (!d) return
    const h0 = d.offsetHeight
    arrasto.current = {
      pointerId,
      y0: y,
      h0,
      h: h0,
      ty: 0,
      yAnterior: y,
      tAnterior: performance.now(),
      velocidade: 0,
    }
  }, [])

  const mover = useCallback(
    (y: number) => {
      const a = arrasto.current
      if (!a) return
      const agora = performance.now()
      const instantanea = (y - a.yAnterior) / Math.max(1, agora - a.tAnterior)
      a.velocidade = a.velocidade * 0.6 + instantanea * 0.4
      a.yAnterior = y
      a.tAnterior = agora

      const p = paradas.current
      let h = a.h0 - (y - a.y0)
      let ty = 0
      if (h < p.meio) {
        // Passou da parada de baixo: a folha deixa de encolher e começa a sair.
        ty = p.meio - h
        h = p.meio
      } else if (h > p.cheio) {
        h = p.expansivel
          ? p.cheio + Math.min((h - p.cheio) * RESISTENCIA_DO_ESTICAR, ESTICAR_MAXIMO_PX)
          : p.cheio
      }
      a.h = h
      a.ty = ty
      aplicar(h, ty, false)
    },
    [aplicar],
  )

  const soltar = useCallback(() => {
    const a = arrasto.current
    const d = dialogo.current
    if (!a || !d) return
    arrasto.current = null
    const p = paradas.current

    if (a.ty > 0) {
      const limiar = Math.min(LIMIAR_PARA_FECHAR_PX, p.meio / 2)
      if (a.ty > limiar || a.velocidade > VELOCIDADE_PARA_FECHAR) {
        // Termina de sair sozinha antes de pedir o fechamento de verdade —
        // soltar não pode parecer que o painel travou no meio do caminho.
        aplicar(null, d.offsetHeight, true)
        window.setTimeout(() => {
          fechar.current()
        }, DURACAO_DO_ARREMATE_MS)
      } else {
        aplicar(p.meio, 0, true)
      }
      return
    }

    let alvo: Parada = 'meio'
    if (p.expansivel) {
      if (a.velocidade < -VELOCIDADE_PARA_TROCAR) alvo = 'cheio'
      else if (a.velocidade > VELOCIDADE_PARA_TROCAR) alvo = 'meio'
      else alvo = a.h - p.meio > p.cheio - a.h ? 'cheio' : 'meio'
    }
    parada.current = alvo
    d.dataset.altura = alvo
    aplicar(p[alvo], 0, true)
  }, [aplicar])

  // O corpo também puxa a folha, com toque. Tem que ser `touchmove` sem
  // passividade: depois que a rolagem nativa começa o navegador não deixa
  // cancelá-la, e quem decide aqui é a direção do dedo no começo do gesto —
  //  - sobe com a folha pela metade: estica, em vez de rolar;
  //  - desce com a lista no topo: recolhe (e, recolhida, fecha);
  //  - o resto é rolagem comum da lista.
  useEffect(() => {
    const c = corpo.current
    if (!c) return
    let gesto: {
      x0: number
      y0: number
      noTopo: boolean
      modo: 'arrasto' | 'nativo' | null
    } | null = null

    const aoTocar = (evento: TouchEvent): void => {
      const dedo = evento.touches[0]
      if (evento.touches.length !== 1 || !dedo || !window.matchMedia(CONSULTA_DO_CELULAR).matches) {
        gesto = null
        return
      }
      gesto = { x0: dedo.clientX, y0: dedo.clientY, noTopo: c.scrollTop <= 0, modo: null }
    }

    const aoMover = (evento: TouchEvent): void => {
      const dedo = evento.touches[0]
      if (!gesto || !dedo) return
      if (gesto.modo === null) {
        const dx = dedo.clientX - gesto.x0
        const dy = dedo.clientY - gesto.y0
        if (Math.hypot(dx, dy) < LIMIAR_DO_GESTO_PX) return
        const sobe = dy < 0
        const puxa =
          Math.abs(dy) > Math.abs(dx) &&
          (sobe ? paradas.current.expansivel && parada.current === 'meio' : gesto.noTopo)
        if (!puxa) {
          gesto.modo = 'nativo'
          return
        }
        gesto.modo = 'arrasto'
        iniciar(dedo.clientY, null)
      }
      if (gesto.modo === 'arrasto') {
        if (evento.cancelable) evento.preventDefault()
        mover(dedo.clientY)
      }
    }

    const aoSoltar = (): void => {
      if (gesto?.modo === 'arrasto') soltar()
      gesto = null
    }

    c.addEventListener('touchstart', aoTocar, { passive: true })
    c.addEventListener('touchmove', aoMover, { passive: false })
    c.addEventListener('touchend', aoSoltar)
    c.addEventListener('touchcancel', aoSoltar)
    return () => {
      c.removeEventListener('touchstart', aoTocar)
      c.removeEventListener('touchmove', aoMover)
      c.removeEventListener('touchend', aoSoltar)
      c.removeEventListener('touchcancel', aoSoltar)
    }
  }, [iniciar, mover, soltar])

  function aoSegurarAAlca(evento: EventoDePonteiro<HTMLDivElement>): void {
    evento.currentTarget.setPointerCapture(evento.pointerId)
    iniciar(evento.clientY, evento.pointerId)
  }

  function aoArrastarAAlca(evento: EventoDePonteiro<HTMLDivElement>): void {
    if (arrasto.current?.pointerId !== evento.pointerId) return
    mover(evento.clientY)
  }

  function aoSoltarAAlca(evento: EventoDePonteiro<HTMLDivElement>): void {
    if (arrasto.current?.pointerId !== evento.pointerId) return
    soltar()
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
        ref={alca}
        className="folha-alca"
        aria-hidden
        onPointerDown={aoSegurarAAlca}
        onPointerMove={aoArrastarAAlca}
        onPointerUp={aoSoltarAAlca}
        onPointerCancel={aoSoltarAAlca}
      >
        <span className="folha-alca-barra" />
      </div>

      <div ref={corpo} className="folha-corpo" tabIndex={-1}>
        <div ref={conteudo} className="folha-conteudo">
          {children}
        </div>
      </div>
    </dialog>
  )
}
