import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { BlocoDeTitulo } from '@/components/BlocoDeTitulo'
import { useTemaPadrao } from '@/hooks/useTemaPadrao'
import { FormularioDeAnexo } from '@/features/acervo/FormularioDeAnexo'
import { usePalacio } from '@/store/palacio'

export default function EditarAnexo() {
  const { anexoId } = useParams()
  const { key } = useLocation()
  const navegar = useNavigate()
  const { livros, anexos, carregado, ocupado, editarAnexo } = usePalacio()
  const padrao = useTemaPadrao()

  const anexo = anexos.find((a) => a.id === anexoId)

  if (!anexo) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo voltarPara="/" icone="fechar" titulo="Editar" />
        <p className="text-poeira pt-6 text-sm">
          {carregado ? 'Este item não existe mais.' : 'Abrindo…'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo
        voltarPara={`/anexo/${anexo.id}`}
        icone="fechar"
        titulo={padrao ? '' : 'Editar item'}
      />

      <div className="animar-entrada pd-conteudo flex flex-1 flex-col pt-4">
        {padrao && (
          <BlocoDeTitulo
            rotulo={`Pasta · ${livros.find((l) => l.id === anexo.livroId)?.titulo ?? ''}`}
            titulo="Editar item"
            sub="Troque a imagem ou a legenda"
          />
        )}
        <FormularioDeAnexo
          modo="editar"
          anexo={anexo}
          ocupado={ocupado}
          onSalvar={(legenda, url, imagem) => {
            void editarAnexo(anexo.id, legenda, url, imagem).then((deuCerto) => {
              if (!deuCerto) return
              // A tela do item já está logo atrás: voltar para ela, e não
              // empilhar outra igual — o mesmo do editar neurônio.
              if (key === 'default') void navegar(`/anexo/${anexo.id}`, { replace: true })
              else void navegar(-1)
            })
          }}
        />
      </div>
    </div>
  )
}
