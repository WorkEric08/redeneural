import { useNavigate, useSearchParams } from 'react-router-dom'

import { Formulario } from '@/features/neuronio/Formulario'
import { usePalacio } from '@/store/palacio'

/** Criar um neurônio. Ao terminar, leva direto para o que nasceu. */
export default function Novo() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, ocupado, erro, criarNeuronio } = usePalacio()

  const livroSugerido = busca.get('livro') ?? undefined

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-titulo text-xl font-semibold tracking-tight">Novo neurônio</h1>
        <p className="text-poeira text-sm">As conexões nascem sozinhas. Você só escreve.</p>
      </header>

      {erro && (
        <p className="text-destructive border-destructive/40 rounded-lg border p-3 text-sm">
          {erro}
        </p>
      )}

      <Formulario
        livros={livros}
        {...(livroSugerido
          ? { inicial: { livroId: livroSugerido, titulo: '', conteudo: '' } }
          : {})}
        ocupado={ocupado}
        rotuloDeEnvio="Criar"
        onCancelar={() => {
          void navegar(-1)
        }}
        onEnviar={(dados) => {
          void criarNeuronio(dados).then((id) => {
            // `replace`: voltar depois de criar tem que sair do formulário, não
            // trazê-lo de volta vazio.
            if (id) void navegar(`/neuronio/${id}?nasceu=1`, { replace: true })
          })
        }}
      />
    </div>
  )
}
