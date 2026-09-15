import { LibraryBig, Plus, Share2, SlidersHorizontal, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as EventoDePonteiro,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  RAIO_EXTERNO,
  RAIO_MEIO,
  caminhoDoFio,
  caminhoDoSetor,
  pontoNoArco,
  setorEm,
  setores,
} from '@/lib/dial'

/**
 * O dial: o botão de criar que também é a navegação.
 *
 * Toque curto cria um neurônio, como sempre. Segurar abre o anel com os
 * destinos em volta do polegar — arrastar até a cunha e soltar já navega, num
 * movimento só; soltar no centro deixa o anel aberto para escolher com um
 * segundo toque, que é o que perdoa o dedo que erra.
 *
 * **Só abaixo de 1024 px.** No desktop a coluna fixa da esquerda continua sendo
 * a navegação (CLAUDE.md §6) e este botão volta a ser só um link de criar:
 * segurar o botão do mouse não é gesto que alguém faça por conta própria.
 *
 * Da referência vieram o anel escuro de cunhas, o botão serrilhado no centro, a
 * cunha em destaque hachurada e o fio fino levando ao nome da opção. O que
 * **não** veio foi o halo quente: aqui a cor de ponte significa uma coisa só —
 * conexão que atravessa livros —, então a luz do botão é de papel.
 */

const DESTINOS = [
  { para: '/', rotulo: 'Estante', Icone: LibraryBig },
  { para: '/rede', rotulo: 'Rede', Icone: Share2 },
  { para: '/ajustes', rotulo: 'Ajustes', Icone: SlidersHorizontal },
] as const

/** Quanto o dedo precisa ficar parado até o anel abrir. */
const ESPERA = 380

/** Onde a coluna de rótulos começa e como desce, a partir do centro do botão. */
const PRIMEIRO_ROTULO = -118
const PASSO_ROTULO = 44
const X_ROTULO = -(RAIO_EXTERNO + 18)

const CUNHAS = setores(DESTINOS.length)

const OPCOES = DESTINOS.map((destino, i) => ({
  ...destino,
  // `setores(n)` devolve exatamente n cunhas; este índice existe.
  setor: CUNHAS[i]!,
  rotuloY: PRIMEIRO_ROTULO + i * PASSO_ROTULO,
}))

type Fase = 'fechado' | 'segurando' | 'aberto'

const px = (valor: number): string => `${String(Math.round(valor))}px`

export function Dial() {
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const noDesktop = useMediaQuery('(min-width: 1024px)')

  const [fase, setFase] = useState<Fase>('fechado')
  const [ativo, setAtivo] = useState<number | null>(null)

  const relogio = useRef<number | null>(null)
  const centro = useRef({ x: 0, y: 0 })
  /** O clique chega depois de o dedo levantar; sem isto, abrir o anel também criaria um neurônio. */
  const engoleOClique = useRef(false)

  const pararORelogio = useCallback(() => {
    if (relogio.current !== null) window.clearTimeout(relogio.current)
    relogio.current = null
  }, [])

  const fechar = useCallback(() => {
    pararORelogio()
    setFase('fechado')
    setAtivo(null)
  }, [pararORelogio])

  // Trocou de tela: o anel não atravessa a navegação.
  useEffect(() => fechar, [pathname, fechar])

  useEffect(() => {
    if (fase !== 'aberto') return

    const aoTeclar = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') fechar()
    }

    window.addEventListener('keydown', aoTeclar)
    return () => {
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [fase, fechar])

  function aoEncostar(evento: EventoDePonteiro<HTMLAnchorElement>): void {
    if (noDesktop) return

    const caixa = evento.currentTarget.getBoundingClientRect()
    centro.current = { x: caixa.left + caixa.width / 2, y: caixa.top + caixa.height / 2 }
    evento.currentTarget.setPointerCapture(evento.pointerId)

    pararORelogio()
    relogio.current = window.setTimeout(() => {
      engoleOClique.current = true
      setFase('segurando')
      setAtivo(null)
    }, ESPERA)
  }

  function aoArrastar(evento: EventoDePonteiro<HTMLAnchorElement>): void {
    if (fase !== 'segurando') return
    setAtivo(
      setorEm(evento.clientX - centro.current.x, evento.clientY - centro.current.y, OPCOES.length),
    )
  }

  function aoSoltar(): void {
    pararORelogio()
    if (fase !== 'segurando') return

    const escolhido = ativo === null ? undefined : OPCOES[ativo]
    if (escolhido) {
      fechar()
      void navegar(escolhido.para)
      return
    }

    // Soltou no centro: o anel fica, e a escolha vira um toque.
    setFase('aberto')
  }

  const visivel = !noDesktop && fase !== 'fechado'
  const opcaoAtiva = ativo === null ? undefined : OPCOES[ativo]

  return (
    <>
      {visivel && <div className="dial-veu" onPointerDown={fechar} aria-hidden />}

      <div className="dial">
        {visivel && (
          <div className="dial-anel">
            <svg viewBox="-150 -150 300 300" width="300" height="300" aria-hidden>
              <defs>
                <pattern
                  id="dial-hachura"
                  width="7"
                  height="7"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(-45)"
                >
                  <rect width="7" height="7" className="dial-hachura-fundo" />
                  <line x1="0" y1="0" x2="0" y2="7" className="dial-hachura-risco" />
                </pattern>
              </defs>

              {OPCOES.map((opcao, i) => (
                <path
                  key={opcao.para}
                  d={caminhoDoSetor(opcao.setor)}
                  className={i === ativo ? 'dial-setor dial-setor--ativo' : 'dial-setor'}
                />
              ))}

              {opcaoAtiva && (
                <path
                  className="dial-fio"
                  d={caminhoDoFio(opcaoAtiva.setor, X_ROTULO, opcaoAtiva.rotuloY)}
                />
              )}
            </svg>

            {OPCOES.map((opcao, i) => {
              const ponto = pontoNoArco(RAIO_MEIO, opcao.setor.meio)

              return (
                <button
                  key={opcao.para}
                  type="button"
                  onClick={() => {
                    fechar()
                    void navegar(opcao.para)
                  }}
                  style={{ left: px(ponto.x - 26), top: px(ponto.y - 26) }}
                  className={i === ativo ? 'dial-cunha dial-cunha--ativa' : 'dial-cunha'}
                  aria-label={opcao.rotulo}
                >
                  <opcao.Icone size={21} aria-hidden />
                </button>
              )
            })}

            {OPCOES.map((opcao, i) => (
              <span
                key={opcao.para}
                style={{ right: px(-X_ROTULO), top: px(opcao.rotuloY) }}
                className={i === ativo ? 'dial-rotulo dial-rotulo--ativo' : 'dial-rotulo'}
                aria-hidden
              >
                {opcao.rotulo}
              </span>
            ))}
          </div>
        )}

        <Link
          to="/novo"
          aria-label={visivel ? 'Fechar o dial' : 'Novo neurônio'}
          aria-expanded={noDesktop ? undefined : visivel}
          className="dial-botao"
          data-aberto={visivel}
          onPointerDown={aoEncostar}
          onPointerMove={aoArrastar}
          onPointerUp={aoSoltar}
          onPointerCancel={fechar}
          onKeyDown={(evento) => {
            // Espaço não ativa um link — sobra para abrir o anel sem dedo.
            if (noDesktop || evento.key !== ' ') return
            evento.preventDefault()
            setFase('aberto')
          }}
          onClick={(evento) => {
            if (engoleOClique.current) {
              engoleOClique.current = false
              evento.preventDefault()
              return
            }
            if (fase === 'aberto') {
              evento.preventDefault()
              fechar()
            }
          }}
        >
          {/* Traço mais grosso que o padrão do lucide: gravado num disco de
              metal, o fio de 2 px sumia no brilho da face. */}
          {visivel ? (
            <X size={22} strokeWidth={2.75} aria-hidden />
          ) : (
            <Plus size={22} strokeWidth={2.75} aria-hidden />
          )}
        </Link>
      </div>
    </>
  )
}
