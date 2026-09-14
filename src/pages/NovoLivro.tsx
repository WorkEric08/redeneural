import { useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { FormularioDeLivro } from '@/features/estante/FormularioDeLivro'
import { panoSugerido } from '@/features/estante/panos'
import { usePalacio } from '@/store/palacio'

/**
 * Criar um livro. Tela cheia, e não uma folha (pedido do usuário,
 * 14/09/2026) — sair é o "fechar" da barra de topo, como o formulário de
 * neurônio.
 */
export default function NovoLivro() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, ocupado, intensidadeDaLuz, criarLivro } = usePalacio()

  const prateleira = Number(busca.get('prateleira') ?? 0)

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo voltarPara="/" icone="fechar" titulo="Novo livro" />

      <div className="animar-entrada flex flex-1 flex-col pt-5">
        <FormularioDeLivro
          inicial={{
            titulo: '',
            cor: panoSugerido(livros),
            emblema: null,
            larguraLombada: null,
            comprimentoLombada: null,
          }}
          rotuloDeEnvio="Criar livro"
          ocupado={ocupado}
          intensidadeDaLuz={intensidadeDaLuz}
          onEnviar={(dados) => {
            void criarLivro(dados, prateleira).then((id) => {
              // `replace`: voltar depois de criar tem que sair do formulário, e
              // o `chegou` avisa a estante para animar a chegada na prateleira.
              if (id) void navegar(`/?chegou=${id}`, { replace: true })
            })
          }}
        />
      </div>
    </div>
  )
}
