import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import '@/index.css'
import '@/tema-padrao.css'
import { router } from '@/router'
import { pedirArmazenamentoDuravel } from '@/services/native/armazenamento'
import { travarGestosDeNavegador } from '@/services/native/gestos'
import { usePalacio } from '@/store/palacio'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root não encontrado')

// Antes de pintar: o primeiro toque longo pode ser na estante.
travarGestosDeNavegador()

// O Worker já está de pé (nasce com a store) e o banco é lido enquanto o React ainda monta a
// tela: a estante abre direto, sem esperar o primeiro render para pedir os dados.
void usePalacio.getState().carregar()

// Sem esperar: nada na tela depende da resposta, e o palácio abre igual com
// ou sem a garantia (ver armazenamento.ts).
void pedirArmazenamentoDuravel()

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
