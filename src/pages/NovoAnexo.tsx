import { useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { restantesNaPasta, type TipoDeItem } from '@/core'
import { FormularioDeAnexo } from '@/features/acervo/FormularioDeAnexo'
import { usePalacio } from '@/store/palacio'

/**
 * Guardar um link ou uma imagem numa pasta. Rota, e não folha, pelo motivo de
 * sempre: voltar tem que fechar o formulário, não sair do app.
 */
export default function NovoAnexo() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, anexos, carregado, ocupado, criarAnexo } = usePalacio()

  const livroId = busca.get('livro')
  const pasta = livros.find((l) => l.id === livroId && l.tipo === 'acervo')
  const pedido = busca.get('tipo')
  const tipoInicial: TipoDeItem | undefined =
    pedido === 'imagem' || pedido === 'link' ? pedido : undefined

  if (!pasta) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo voltarPara="/" icone="fechar" titulo="Novo item" />
        <p className="text-poeira pt-6 text-sm">
          {carregado ? 'Esta pasta não está mais na estante.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo
        voltarPara={`/livro/${pasta.id}`}
        icone="fechar"
        titulo={
          <>
            <span
              className="h-5 w-1 shrink-0 rounded-full"
              style={{ background: pasta.cor }}
              aria-hidden
            />
            <span className="truncate">{pasta.titulo}</span>
          </>
        }
      />

      <div className="animar-entrada flex flex-1 flex-col pt-4">
        <FormularioDeAnexo
          modo="novo"
          tipoInicial={tipoInicial}
          cheios={(['imagem', 'link'] as const).filter(
            (t) => restantesNaPasta(anexos, pasta.id)[t] === 0,
          )}
          ocupado={ocupado}
          onCriar={(legenda, conteudo) => {
            void criarAnexo({ livroId: pasta.id, legenda, conteudo }).then((id) => {
              // `replace`: voltar depois de guardar não pode trazer o
              // formulário de volta, já preenchido.
              if (id) void navegar(`/livro/${pasta.id}`, { replace: true })
            })
          }}
        />
      </div>
    </div>
  )
}
