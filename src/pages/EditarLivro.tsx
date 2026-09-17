import { useNavigate, useParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { FormularioDeLivro } from '@/features/estante/FormularioDeLivro'
import { usePalacio } from '@/store/palacio'

/**
 * Editar um livro. Tela cheia, como criar um livro — não mais uma folha
 * dentro do menu de ações (pedido do usuário, 17/09/2026): a mesma forma de
 * `/novo-livro`, só que com os dados do livro que já existe.
 */
export default function EditarLivro() {
  const { livroId } = useParams()
  const navegar = useNavigate()
  const { livros, ocupado, intensidadeDaLuz, editarLivro } = usePalacio()

  const livro = livros.find((l) => l.id === livroId)

  if (!livro) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo voltarPara="/" icone="fechar" titulo="Editar livro" />
        <p className="text-poeira pt-6 text-sm">Este livro não está mais na estante.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo voltarPara="/" icone="fechar" titulo="Editar livro" />

      <div className="animar-entrada flex flex-1 flex-col pt-4">
        <FormularioDeLivro
          inicial={{
            titulo: livro.titulo,
            cor: livro.cor,
            emblema: livro.emblema,
            larguraLombada: livro.larguraLombada,
            comprimentoLombada: livro.comprimentoLombada,
          }}
          rotuloDeEnvio="Salvar"
          ocupado={ocupado}
          intensidadeDaLuz={intensidadeDaLuz}
          onEnviar={(dados) => {
            void editarLivro(livro.id, dados).then((ok) => {
              // `replace`: voltar depois de salvar tem que sair do formulário,
              // não trazê-lo de volta com os dados de antes.
              if (ok) void navegar('/', { replace: true })
            })
          }}
        />
      </div>
    </div>
  )
}
