import { LibraryBig, Share2, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'

/**
 * As três visões — no desktop.
 *
 * Abaixo de 1024 px quem navega é o dial (ver Dial.tsx): segurar o botão de
 * criar abre estes mesmos destinos em volta do polegar, e a barra de baixo
 * deixou de existir. A coluna fica só a partir de 1024 px, onde o mestre
 * (CLAUDE.md §6) pede sidebar fixa e onde segurar o botão do mouse não é gesto
 * que alguém faça por conta própria.
 */

const DESTINOS = [
  { para: '/', rotulo: 'Estante', Icone: LibraryBig, exato: true },
  { para: '/rede', rotulo: 'Rede', Icone: Share2, exato: false },
  { para: '/ajustes', rotulo: 'Ajustes', Icone: SlidersHorizontal, exato: false },
] as const

export function Navegacao() {
  return (
    <nav
      aria-label="Principal"
      className="border-linha bg-parede fixed inset-y-0 left-0 z-20 hidden w-52 flex-col border-r lg:flex"
    >
      <p className="font-titulo text-papel px-6 pt-7 pb-6 text-lg font-semibold tracking-tight">
        Palácio Mental
      </p>

      <ul className="flex flex-col gap-1 px-3">
        {DESTINOS.map(({ para, rotulo, Icone, exato }) => (
          <li key={para}>
            <NavLink
              to={para}
              end={exato}
              className={({ isActive }) =>
                `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-realce text-papel'
                    : 'text-poeira hover:bg-realce/60 hover:text-papel'
                }`
              }
            >
              <Icone size={19} aria-hidden />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
