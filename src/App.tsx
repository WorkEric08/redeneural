import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import type { ProgressoDoMotor } from '@/core'
import { Navegacao } from '@/components/Navegacao'
import { usePalacio } from '@/store/palacio'

/** Rotas onde escrever seria estranho: já se está escrevendo, ou a tela é a escrita. */
const SEM_BOTAO_DE_CRIAR = ['/novo', '/ajustes']

/** O casco: carrega o palácio uma vez e emoldura a página da vez. */
export default function App() {
  const carregar = usePalacio((s) => s.carregar)
  const progresso = usePalacio((s) => s.progresso)
  const { pathname } = useLocation()

  useEffect(() => {
    void carregar()
  }, [carregar])

  const mostrarCriar = !SEM_BOTAO_DE_CRIAR.includes(pathname) && !pathname.endsWith('/editar')

  return (
    <div className="min-h-dvh lg:pl-52">
      {progresso && <Progresso progresso={progresso} />}

      {/* O respiro embaixo é da barra de navegação, que é fixa. */}
      <main className="mx-auto w-full max-w-2xl px-4 pt-6 pb-32 lg:pb-16">
        <Outlet />
      </main>

      {mostrarCriar && (
        <Link
          to="/novo"
          aria-label="Novo neurônio"
          className="bg-papel text-sala fixed right-4 bottom-20 z-30 flex size-14 items-center justify-center rounded-full shadow-lg lg:bottom-6"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Plus size={24} aria-hidden />
        </Link>
      )}

      <Navegacao />
    </div>
  )
}

/** Barra fina no topo: o modelo baixando ou o palácio sendo reprocessado. */
function Progresso({ progresso }: { progresso: ProgressoDoMotor }) {
  const texto =
    progresso.tipo === 'modelo'
      ? `Baixando o modelo — ${String(progresso.pct)}%`
      : progresso.tipo === 'reprocessando'
        ? `Processando ${String(progresso.feitos)} de ${String(progresso.total)}`
        : 'Modelo pronto'

  const pct =
    progresso.tipo === 'modelo'
      ? progresso.pct
      : progresso.tipo === 'reprocessando'
        ? Math.round((progresso.feitos / Math.max(1, progresso.total)) * 100)
        : 100

  return (
    <div
      className="bg-parede border-linha sticky top-0 z-10 border-b"
      role="status"
      aria-live="polite"
    >
      <div className="bg-papel h-0.5 transition-[width]" style={{ width: `${String(pct)}%` }} />
      <p className="text-poeira mx-auto w-full max-w-2xl px-4 py-1.5 text-xs">{texto}</p>
    </div>
  )
}
