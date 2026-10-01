import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { usePalacio } from '@/store/palacio'

import { FolhaGuardarEm } from './FolhaGuardarEm'

/**
 * A pergunta "Onde guardar?" em qualquer tela, aberta por `?guardar=<id>` na
 * URL — como os outros painéis do app, o voltar do Android fecha a folha antes
 * de sair da tela. É o que o "Mudar" do aviso, a lista do porto e a tela do
 * neurônio abrem.
 *
 * A tela de escrever (`/novo`) tem a própria: lá, responder ou fechar também
 * leva para a Rede, e isso é dela.
 */
export function GuardarNoPorto() {
  const [busca] = useSearchParams()
  const { pathname, key } = useLocation()
  const navegar = useNavigate()
  const { livros, neuronios, guardarNeuronio } = usePalacio()

  const id = busca.get('guardar')
  const neuronio = neuronios.find((n) => n.id === id)
  const deConceitos = useMemo(() => livros.filter((l) => l.tipo === 'conceitos'), [livros])

  function fechar(): void {
    // O React Router chama de 'default' a primeira entrada da sessão: sem casa
    // para voltar, a pergunta sai da URL no lugar.
    if (key === 'default') {
      const proxima = new URLSearchParams(busca)
      proxima.delete('guardar')
      const resto = proxima.toString()
      void navegar({ search: resto ? `?${resto}` : '' }, { replace: true })
    } else {
      void navegar(-1)
    }
  }

  return (
    <FolhaGuardarEm
      aberta={id !== null && neuronio !== undefined && pathname !== '/novo'}
      neuronio={neuronio}
      livros={deConceitos}
      onEscolher={(livroId) => {
        if (!neuronio) return
        // Otimista: a folha fecha e o neurônio já aparece no livro.
        void guardarNeuronio(neuronio.id, livroId)
        fechar()
      }}
      onCriarLivro={() => {
        if (!neuronio) return
        // `replace`: o livro novo toma o lugar da pergunta no histórico, e
        // voltar dele cai na tela de onde a pergunta saiu.
        void navegar(`/novo-livro?neuronio=${neuronio.id}`, { replace: true })
      }}
      onFechar={fechar}
    />
  )
}
