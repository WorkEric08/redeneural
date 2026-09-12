import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import '@/index.css'
import { router } from '@/router'
import { travarGestosDeNavegador } from '@/services/native/gestos'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root não encontrado')

// Antes de pintar: o primeiro toque longo pode ser na porta de entrada.
travarGestosDeNavegador()

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
