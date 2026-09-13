import { useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { Formulario } from '@/features/neuronio/Formulario'
import { usePalacio } from '@/store/palacio'

/** Criar um neurônio. Ao terminar, leva direto para o que nasceu. */
export default function Novo() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, ocupado, criarNeuronio } = usePalacio()

  const livroSugerido = busca.get('livro') ?? undefined

  return (
    // A tela inteira: o botão de criar fica no pé dela, e não logo depois do
    // último campo, mesmo com o texto ainda vazio.
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo voltarPara="/" icone="fechar" titulo="Novo neurônio" />

      <div className="animar-entrada flex flex-1 flex-col">
        <p className="text-poeira px-1 pt-5 text-sm">
          As conexões nascem sozinhas. Você só escreve.
        </p>

        <Formulario
          livros={livros}
          {...(livroSugerido
            ? { inicial: { livroId: livroSugerido, titulo: '', conteudo: '' } }
            : {})}
          ocupado={ocupado}
          rotuloDeEnvio="Criar neurônio"
          onEnviar={(dados) => {
            void criarNeuronio(dados).then((id) => {
              // `replace`: voltar depois de criar tem que sair do formulário, não
              // trazê-lo de volta vazio.
              if (id) void navegar(`/neuronio/${id}?nasceu=1`, { replace: true })
            })
          }}
        />
      </div>
    </div>
  )
}
