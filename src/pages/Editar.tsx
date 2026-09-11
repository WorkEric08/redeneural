import { useNavigate, useParams } from 'react-router-dom'

import { Formulario } from '@/features/neuronio/Formulario'
import { usePalacio } from '@/store/palacio'

export default function Editar() {
  const { neuronioId } = useParams()
  const navegar = useNavigate()
  const { livros, neuronios, ocupado, erro, editarNeuronio } = usePalacio()

  const neuronio = neuronios.find((n) => n.id === neuronioId)

  if (!neuronio) {
    return <p className="text-poeira text-sm">Este neurônio não existe mais.</p>
  }

  return (
    <div className="animar-entrada flex flex-col gap-5">
      <header>
        <h1 className="font-titulo text-xl font-semibold tracking-tight">Editar</h1>
        <p className="text-poeira text-sm">
          Mudar o texto refaz o embedding — as conexões podem mudar.
        </p>
      </header>

      {erro && (
        <p className="text-destructive border-destructive/40 rounded-lg border p-3 text-sm">
          {erro}
        </p>
      )}

      <Formulario
        livros={livros}
        inicial={{
          livroId: neuronio.livroId,
          titulo: neuronio.titulo,
          conteudo: neuronio.conteudo,
        }}
        ocupado={ocupado}
        rotuloDeEnvio="Salvar"
        onCancelar={() => {
          void navegar(-1)
        }}
        onEnviar={(dados) => {
          void editarNeuronio(neuronio.id, dados).then((deuCerto) => {
            if (deuCerto) void navegar(`/neuronio/${neuronio.id}`, { replace: true })
          })
        }}
      />
    </div>
  )
}
