import { useNavigate, useParams } from 'react-router-dom'

import { useMemo } from 'react'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { recusaDaEdicao } from '@/features/estante/cabeNaEstante'
import { FormularioDeLivro } from '@/features/estante/FormularioDeLivro'
import { medidasDaEstante } from '@/features/estante/medidasDaEstante'
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
    iconesNosLivros,
    quantidadeDePrateleiras,
    avisar,
    editarLivro,
  } = usePalacio()

  const livro = livros.find((l) => l.id === livroId)
  // O que a estante sabe do livro: a altura automática sai
  // daqui, para a amostra ser a lombada que vai para a prateleira.
  const estante = useMemo(
    () => montarEstante(livros, neuronios, conexoes, anexos),
    [livros, neuronios, conexoes, anexos],
  )
  const naEstante = estante.find((e) => e.livro.id === livroId)

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

      <div className="animar-entrada pd-conteudo flex flex-1 flex-col pt-4">
        <FormularioDeLivro
          inicial={{
            titulo: livro.titulo,
            cor: livro.cor,
            estilo: livro.estilo,
            orientacao: livro.orientacao,
            emblema: livro.emblema,
            larguraLombada: livro.larguraLombada,
            comprimentoLombada: livro.comprimentoLombada,
            executavel: livro.executavel,
            diasParaAdormecer: livro.diasParaAdormecer,
          }}
          tipoFixo={livro.tipo}
          livroId={livro.id}
          alturaAutomatica={naEstante?.altura}
          prateleiras={quantidadeDePrateleiras}
          rotuloDeEnvio="Salvar"
          ocupado={ocupado}
          intensidadeDaLuz={intensidadeDaLuz}
          iconesNosLivros={iconesNosLivros}
          onEnviar={(dados) => {
            // Virar o livro ou mudar o tamanho dele pode estourar a pilha ou as laterais da
            // prateleira: a estante diz o quanto a fileira tem, e a mudança só vale onde os livros
            // continuam cabendo (quem já passava do limite pode ser mexido, desde que não piore).
            const recusa = recusaDaEdicao({
              livros,
              livroId: livro.id,
              orientacao: dados.orientacao,
              larguraLombada: dados.larguraLombada,
              comprimentoLombada: dados.comprimentoLombada,
              alturasAutomaticas: new Map(estante.map((e) => [e.livro.id, e.altura])),
              medidas: medidasDaEstante(),
            })
            if (recusa !== null) {
              avisar(recusa)
              return
            }
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
