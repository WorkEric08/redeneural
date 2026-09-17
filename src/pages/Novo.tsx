import { useNavigate, useSearchParams } from 'react-router-dom'

import { Formulario } from '@/features/neuronio/Formulario'
import { usePalacio } from '@/store/palacio'

/** Criar um neurônio. Ao terminar, leva direto para o que nasceu. */
export default function Novo() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, ocupado, criarNeuronio } = usePalacio()

  const livroSugerido = busca.get('livro') ?? undefined

  // A tela inteira é a folha de escrever: barra de topo, livro e texto moram
  // dentro do formulário (ver Formulario.tsx).
  return (
    <Formulario
      livros={livros}
      {...(livroSugerido ? { inicial: { livroId: livroSugerido, titulo: '', conteudo: '' } } : {})}
      ocupado={ocupado}
      rotuloDeEnvio="Criar neurônio"
      voltarPara="/"
      onEnviar={(dados) => {
        void criarNeuronio(dados).then((id) => {
          // `replace`: voltar depois de criar tem que sair do formulário, não
          // trazê-lo de volta vazio.
          if (id) void navegar(`/neuronio/${id}?nasceu=1`, { replace: true })
        })
      }}
    />
  )
}
