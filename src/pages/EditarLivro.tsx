import { useNavigate, useParams } from 'react-router-dom'

import { useMemo } from 'react'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { FormularioDeLivro } from '@/features/estante/FormularioDeLivro'
import { montarEstante } from '@/features/estante/resumo'
import { usePalacio } from '@/store/palacio'

/**
 * Editar um livro. Tela cheia, como criar um livro — não mais uma folha
 * dentro do menu de ações (pedido do usuário, 17/09/2026): a mesma forma de
 * `/novo-livro`, só que com os dados do livro que já existe.
 */
export default function EditarLivro() {
  const { livroId } = useParams()
  const navegar = useNavigate()
  const {
    livros,
    neuronios,
    conexoes,
    anexos,
    ocupado,
    intensidadeDaLuz,
    quantidadeDePrateleiras,
    editarLivro,
  } = usePalacio()

  const livro = livros.find((l) => l.id === livroId)
  // O que a estante sabe do livro: a altura automática e a contagem do papel saem
  // daqui, para a amostra ser a lombada que vai para a prateleira.
  const naEstante = useMemo(
    () => montarEstante(livros, neuronios, conexoes, anexos).find((e) => e.livro.id === livroId),
    [livros, neuronios, conexoes, anexos, livroId],
  )

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
            estilo: livro.estilo,
            emblema: livro.emblema,
            larguraLombada: livro.larguraLombada,
            comprimentoLombada: livro.comprimentoLombada,
            executavel: livro.executavel,
            diasParaAdormecer: livro.diasParaAdormecer,
          }}
          tipoFixo={livro.tipo}
          livroId={livro.id}
          alturaAutomatica={naEstante?.altura}
          contagem={livro.tipo === 'acervo' ? naEstante?.anexos : naEstante?.neuronios}
          prateleiras={quantidadeDePrateleiras}
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
