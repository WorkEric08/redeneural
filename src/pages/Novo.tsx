import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useCriarLivroExecutavel } from '@/features/executaveis/useCriarLivroExecutavel'
import { Formulario } from '@/features/neuronio/Formulario'
import { FolhaGuardarEm } from '@/features/porto/FolhaGuardarEm'
import { usePalacio } from '@/store/palacio'

/**
 * Criar um neurônio. Ao terminar, leva para a Rede — não para a tela do
 * neurônio (pedido do usuário, 17/09/2026): é lá que o app mostra, com uma
 * animação, com quem o que acabou de nascer conversa (ver `revelar` em
 * Tela.tsx). `criarNeuronio` só resolve depois de o Worker terminar a
 * inferência inteira (embedding, conexões e posição já gravados), então a
 * Rede nunca abre com o neurônio "no meio do processamento".
 *
 * Pelo "+", o livro começa em "Automático" (o Porto, 01/10/2026): o motor
 * guarda no livro que os mais parecidos apontam e o aviso oferece "Mudar"; sem
 * resposta clara, o neurônio fica no porto e a pergunta "Onde guardar?" abre
 * aqui mesmo, por cima do que a pessoa acabou de escrever. Responder guarda e
 * segue para a Rede; fechar segue para a Rede com ele no porto.
 */
export default function Novo() {
  const [busca, setBusca] = useSearchParams()
  const navegar = useNavigate()
  const { livros, neuronios, ocupado, criarNeuronio, guardarNeuronio, avisar } = usePalacio()
  const criarLivroExecutavel = useCriarLivroExecutavel()

  // Um conceito não mora numa pasta de acervo: ela nem aparece na escolha, e
  // uma sugestão que aponte para uma é ignorada.
  const deConceitos = useMemo(() => livros.filter((l) => l.tipo === 'conceitos'), [livros])
  const pedido = busca.get('livro')
  const livroSugerido = deConceitos.some((l) => l.id === pedido) ? (pedido ?? undefined) : undefined

  // O neurônio que acabou de nascer no porto, esperando a resposta.
  const pendenteId = busca.get('guardar')
  const pendente = neuronios.find((n) => n.id === pendenteId)

  // Sair da tela sem responder (o voltar do Android, que a leva inteira do
  // histórico) deixa o neurônio no porto — e isso precisa ser dito.
  const semResposta = useRef<string | null>(null)
  useEffect(() => {
    semResposta.current = pendenteId
  }, [pendenteId])
  useEffect(
    () => () => {
      if (semResposta.current !== null) usePalacio.getState().avisar('Ficou no porto.')
    },
    [],
  )

  function irParaARede(id: string): void {
    semResposta.current = null
    // `replace`: voltar depois de criar tem que sair do formulário, não
    // trazê-lo de volta vazio.
    void navegar(`/rede?novo=${id}`, { replace: true })
  }

  return (
    <>
      {/* A tela inteira é a folha de escrever: barra de topo, livro e texto
          moram dentro do formulário (ver Formulario.tsx). */}
      <Formulario
        livros={deConceitos}
        {...(livroSugerido
          ? { inicial: { livroId: livroSugerido, titulo: '', conteudo: '' } }
          : {})}
        automatico
        executar={{ onCriarLivro: criarLivroExecutavel }}
        ocupado={ocupado}
        rotuloDeEnvio="Criar neurônio"
        voltarPara="/"
        onEnviar={(dados) => {
          void criarNeuronio(dados).then((criado) => {
            if (!criado) return
            if (dados.livroId === null && criado.livroId !== null) {
              const livro = livros.find((l) => l.id === criado.livroId)
              avisar(`Guardado em ${livro?.titulo ?? 'um livro'}.`, {
                rotulo: 'Mudar',
                busca: `?guardar=${criado.id}`,
              })
            }
            if (criado.livroId !== null) {
              irParaARede(criado.id)
              return
            }
            // No porto: a pergunta toma o lugar desta entrada no histórico, e
            // o voltar sai da tela de escrever inteira — o neurônio já existe.
            setBusca({ guardar: criado.id }, { replace: true })
          })
        }}
      />

      <FolhaGuardarEm
        aberta={pendente !== undefined}
        neuronio={pendente}
        livros={deConceitos}
        onEscolher={(livroId) => {
          if (!pendente) return
          void guardarNeuronio(pendente.id, livroId).then(() => {
            irParaARede(pendente.id)
          })
        }}
        onCriarLivro={() => {
          if (!pendente) return
          semResposta.current = null
          void navegar(`/novo-livro?neuronio=${pendente.id}&revelar=1`, { replace: true })
        }}
        onFechar={() => {
          if (!pendente) return
          avisar('Ficou no porto.')
          irParaARede(pendente.id)
        }}
      />
    </>
  )
}
