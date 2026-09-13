import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import type { ProgressoDoMotor } from '@/core'
import { Aviso } from '@/components/Aviso'
import { Dial } from '@/components/Dial'
import { Navegacao } from '@/components/Navegacao'
import { Porta } from '@/components/Porta'
import { usePalacio } from '@/store/palacio'

/**
 * Rotas onde o botão não aparece: a tela já é a escrita, e o "fechar" da barra
 * de topo é a saída. Em toda outra o botão precisa existir — abaixo de 1024 px
 * ele não é só criar, é a navegação inteira (ver Dial.tsx).
 */
const SEM_BOTAO_DE_CRIAR = ['/novo']

/** O casco: carrega o palácio uma vez e emoldura a página da vez. */
export default function App() {
  const carregar = usePalacio((s) => s.carregar)
  const progresso = usePalacio((s) => s.progresso)
  const { pathname } = useLocation()
  // Pura atmosfera: uma vez por carregamento do app, não por rota — ver
  // CLAUDE.md, "A porta de entrada".
  const [naPorta, setNaPorta] = useState(true)

  useEffect(() => {
    void carregar()
  }, [carregar])

  // Passou pela porta: a barra do sistema deixa de ser noite e segue o tema da
  // sala (as metas com `media` em index.html).
  useEffect(() => {
    if (!naPorta) document.getElementById('cor-da-porta')?.remove()
  }, [naPorta])

  const mostrarCriar = !SEM_BOTAO_DE_CRIAR.includes(pathname) && !pathname.endsWith('/editar')

  // Três respiros, um por tipo de tela:
  // - a estante ocupa a tela exata e não rola (ver Estante.tsx) — folga de baixo
  //   ali só sobraria como rolagem, e rolagem engole o toque seguinte;
  // - formulário não tem botão flutuante, e o pé dele é a barra de ação presa;
  // - o resto tem barra de topo em cima e precisa passar do botão flutuante
  //   embaixo.
  const naEstante = pathname === '/'
  // A estante ganha respiro mínimo no celular (pedido do usuário, 13/09/2026):
  // topo e laterais caem para 5px abaixo de 1024px — onde a coluna de
  // navegação já dá folga própria — mantendo os 24px/16px de antes no desktop.
  const respiro = naEstante ? 'pt-[5px] pb-6 lg:pt-6' : mostrarCriar ? 'pb-28 lg:pb-16' : 'pb-0'
  const horizontal = naEstante ? 'px-[5px] lg:px-4' : 'px-4'

  if (naPorta) {
    return <Porta onEntrar={() => setNaPorta(false)} />
  }

  return (
    <div className="min-h-dvh lg:pl-52">
      {progresso && <Progresso progresso={progresso} />}

      <main className={`mx-auto w-full max-w-2xl ${horizontal} ${respiro}`}>
        <Outlet />
      </main>

      {mostrarCriar && <Dial />}

      <Navegacao />
      <Aviso />
    </div>
  )
}

/**
 * O modelo baixando ou o palácio sendo reprocessado: um fio de luz no topo da
 * tela e a frase logo abaixo. Fixo, e não no fluxo — as telas agora têm barra de
 * topo presa, e um aviso que empurra a barra para baixo faria a tela pular.
 */
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
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center"
      role="status"
      aria-live="polite"
    >
      <div className="bg-linha h-0.5 w-full">
        <div className="bg-papel h-full transition-[width]" style={{ width: `${String(pct)}%` }} />
      </div>
      <p className="bg-parede border-linha text-poeira mt-2 rounded-full border px-3 py-1 text-xs shadow-lg">
        {texto}
      </p>
    </div>
  )
}
