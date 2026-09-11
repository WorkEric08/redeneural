import { createBrowserRouter } from 'react-router-dom'

import App from '@/App'
import Ajustes from '@/pages/Ajustes'
import Editar from '@/pages/Editar'
import Estante from '@/pages/Estante'
import Livro from '@/pages/Livro'
import Neuronio from '@/pages/Neuronio'
import Novo from '@/pages/Novo'
import Rede from '@/pages/Rede'

/**
 * Rotas de verdade, e não estado local, por um motivo de Android: sem histórico,
 * o botão voltar do aparelho sai do app em vez de fechar o que está aberto.
 *
 * É também por isso que criar e editar são rotas, e não bottom sheets como o
 * mestre sugere para modais: voltar tem que fechar o formulário.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Estante /> },
      { path: 'livro/:livroId', element: <Livro /> },
      { path: 'rede', element: <Rede /> },
      { path: 'novo', element: <Novo /> },
      { path: 'neuronio/:neuronioId', element: <Neuronio /> },
      { path: 'neuronio/:neuronioId/editar', element: <Editar /> },
      { path: 'ajustes', element: <Ajustes /> },
    ],
  },
])
