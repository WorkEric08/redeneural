import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { Formulario } from '@/features/neuronio/Formulario'
import { usePalacio } from '@/store/palacio'

export default function Editar() {
  const { neuronioId } = useParams()
  const { key } = useLocation()
  const navegar = useNavigate()
  const { livros, neuronios, carregado, ocupado, editarNeuronio } = usePalacio()

  const neuronio = neuronios.find((n) => n.id === neuronioId)

  if (!neuronio) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo voltarPara="/" icone="fechar" titulo="Editar" />
        <p className="text-poeira pt-6 text-sm">
          {carregado ? 'Este neurônio não existe mais.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo voltarPara={`/neuronio/${neuronio.id}`} icone="fechar" titulo="Editar" />

      <div className="animar-entrada flex flex-1 flex-col">
        <p className="text-poeira px-1 pt-5 text-sm">
          Mudar o texto refaz o embedding — as conexões podem mudar.
        </p>

        <Formulario
          livros={livros}
          inicial={{
            livroId: neuronio.livroId,
            titulo: neuronio.titulo,
            conteudo: neuronio.conteudo,
          }}
          ocupado={ocupado}
          rotuloDeEnvio="Salvar"
          onEnviar={(dados) => {
            void editarNeuronio(neuronio.id, dados).then((deuCerto) => {
              if (!deuCerto) return
              // A tela do neurônio já está logo atrás no histórico: voltar para
              // ela, e não empilhar outra igual — senão o voltar seguinte
              // mostraria o mesmo neurônio duas vezes.
              if (key === 'default') void navegar(`/neuronio/${neuronio.id}`, { replace: true })
              else void navegar(-1)
            })
          }}
        />
      </div>
    </div>
  )
}
