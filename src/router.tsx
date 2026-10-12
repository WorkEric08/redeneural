import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import App from '@/App'
import Estante from '@/pages/Estante'

/**
 * Rotas de verdade, e não estado local, por um motivo de Android: sem histórico,
 * o botão voltar do aparelho sai do app em vez de fechar o que está aberto.
 *
 * É também por isso que criar e editar são rotas, e não bottom sheets como o
 * mestre sugere para modais: voltar tem que fechar o formulário.
 *
 * **Só a estante está no bundle de entrada** (CLAUDE.md §11, code splitting por rota): é a
 * única tela que o app abre sozinho, e o resto — a Rede e o Mapa em canvas, os formulários, a
 * busca — não precisa ser baixado, lido e executado antes de a estante aparecer. O roteador
 * espera o trecho da rota chegar antes de trocar de tela, então nada pisca; e como o service
 * worker já guarda todos, offline é a mesma coisa.
 */
function pagina(carregar: () => Promise<{ default: ComponentType }>): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: (await carregar()).default }) }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Estante /> },
      { path: 'livro/:livroId', ...pagina(() => import('@/pages/Livro')) },
      { path: 'livro/:livroId/editar', ...pagina(() => import('@/pages/EditarLivro')) },
      {
        path: 'enfeite/:prateleira/:lugar/editar',
        ...pagina(() => import('@/pages/EditarEnfeite')),
      },
      { path: 'rede', ...pagina(() => import('@/pages/Rede')) },
      { path: 'novo', ...pagina(() => import('@/pages/Novo')) },
      { path: 'novo-livro', ...pagina(() => import('@/pages/NovoLivro')) },
      { path: 'neuronio/:neuronioId', ...pagina(() => import('@/pages/Neuronio')) },
      { path: 'neuronio/:neuronioId/editar', ...pagina(() => import('@/pages/Editar')) },
      { path: 'novo-anexo', ...pagina(() => import('@/pages/NovoAnexo')) },
      { path: 'anexo/:anexoId', ...pagina(() => import('@/pages/Anexo')) },
      { path: 'anexo/:anexoId/editar', ...pagina(() => import('@/pages/EditarAnexo')) },
      { path: 'ajustes', ...pagina(() => import('@/pages/Ajustes')) },
      { path: 'busca', ...pagina(() => import('@/pages/Busca')) },
      { path: 'porto', ...pagina(() => import('@/pages/Porto')) },
    ],
  },
])
