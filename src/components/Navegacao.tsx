import { LibraryBig, Share2, SlidersHorizontal } from 'lucide-react'
import { NavLink } from 'react-router-dom'

/**
 * As três visões, sempre no alcance do polegar.
 *
 * Barra embaixo até 1024 px e coluna fixa à esquerda a partir daí, conforme o
 * CLAUDE.md §6. A única divergência é o tablet: o mestre pede um drawer, mas com
 * três destinos um menu que precisa ser aberto esconde o que já cabia na tela.
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
      className="border-linha bg-parede/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur lg:inset-y-0 lg:right-auto lg:w-52 lg:border-t-0 lg:border-r"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-2xl lg:mt-6 lg:flex-col lg:gap-1 lg:px-3">
        {DESTINOS.map(({ para, rotulo, Icone, exato }) => (
          <li key={para} className="flex-1">
            <NavLink
              to={para}
              end={exato}
              className={({ isActive }) =>
                [
                  'flex h-16 flex-col items-center justify-center gap-1 text-[0.68rem]',
                  'lg:h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:px-3 lg:text-sm',
                  isActive ? 'text-papel lg:bg-estante' : 'text-poeira',
                ].join(' ')
              }
            >
              <Icone size={20} aria-hidden />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
