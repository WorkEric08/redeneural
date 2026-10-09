import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import {
  DIAS_PARA_ADORMECER_PADRAO,
  ESTILO_PADRAO,
  novoLivro,
  primeiroLugarDaEstante,
  primeiroLugarLivre,
  type TipoDeLivro,
} from '@/core'
import { cabeDepoisDeMudar } from '@/features/estante/cabeNaEstante'
import { medidasDaEstante } from '@/features/estante/medidasDaEstante'
import { montarEstante } from '@/features/estante/resumo'
import { COMPRIMENTO_PADRAO } from '@/features/estante/comprimentos'
import { FormularioDeLivro } from '@/features/estante/FormularioDeLivro'
import { LARGURA_PADRAO } from '@/features/estante/larguras'
import { panoSugerido } from '@/features/estante/panos'
import { usePalacio } from '@/store/palacio'

/**
 * Criar um livro. Tela cheia, e não uma folha (pedido do usuário,
 * 14/09/2026) — sair é o "fechar" da barra de topo, como o formulário de
 * neurônio.
 *
 * Também é o "Criar livro novo" da pergunta do porto (`?neuronio=<id>` — não
 * `?guardar=`, que abriria a própria pergunta por cima deste formulário):
 * aí o livro é sempre de conceitos, nasce no primeiro lugar livre da estante
 * (ninguém tocou num lugar), e o neurônio que esperava vai para dentro dele.
 */
export default function NovoLivro() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const { key } = useLocation()
  const {
    livros,
    neuronios,
    conexoes,
    anexos,
    avisar,
    ocupado,
    intensidadeDaLuz,
    iconesNosLivros,
    quantidadeDePrateleiras,
    criarLivro,
    guardarNeuronio,
  } = usePalacio()

  // O neurônio do porto que vai morar no livro novo, e se, depois, a Rede
  // revela a chegada dele (quando a pergunta veio da tela de escrever).
  const guardarId = busca.get('neuronio')
  const revelar = busca.get('revelar') === '1'

  // O lugar tocado na estante. Sem ele — o livro novo da pergunta do porto, ou
  // um link antigo —, o primeiro lugar sem livro da estante inteira.
  const prateleiraNaBusca = busca.get('prateleira')
  const lugarNaBusca = busca.get('lugar')
  const livre =
    prateleiraNaBusca === null ? primeiroLugarDaEstante(livros, quantidadeDePrateleiras) : null
  const prateleira =
    prateleiraNaBusca === null ? (livre?.prateleira ?? 0) : Number(prateleiraNaBusca)
  const lugar = lugarNaBusca === null ? livre?.lugar : Number(lugarNaBusca)

  // Livro de conceitos ou pasta de acervo — decidido aqui, e nunca mais. Para
  // guardar um neurônio, só pode ser livro.
  const [tipo, setTipo] = useState<TipoDeLivro>('conceitos')
  const ehPasta = tipo === 'acervo'

  // O que a estante sabe de cada livro (a altura automática dos deitados sai daqui): a conta de
  // caber entre as laterais precisa dela.
  const alturas = useMemo(
    () =>
      new Map(
        montarEstante(livros, neuronios, conexoes, anexos).map((e) => [e.livro.id, e.altura]),
      ),
    [livros, neuronios, conexoes, anexos],
  )

  /**
   * Um livro novo só nasce onde os livros da prateleira continuam cabendo inteiros entre as
   * laterais. Um livro deitado é largo (90 a 130 px), e é ele que torna a conferência necessária.
   */
  function cabeNaPrateleira(dados: Parameters<typeof criarLivro>[0]): boolean {
    const medidas = medidasDaEstante()
    const ordem = primeiroLugarLivre(livros, prateleira, lugar ?? 0)
    if (medidas === null || ordem === null) return true // sem medida, ou sem lugar: quem recusa é a store
    const provisorio = novoLivro(
      { id: 'novo', ...dados, prateleira, lugar, tipo },
      new Date(),
      ordem,
    )
    return cabeDepoisDeMudar(livros, [...livros, provisorio], prateleira, alturas, medidas)
  }

  async function depoisDeCriar(livroId: string): Promise<void> {
    if (guardarId === null) {
      // `replace`: voltar depois de criar tem que sair do formulário, e o
      // `chegou` avisa a estante para animar a chegada na prateleira.
      void navegar(`/?chegou=${livroId}`, { replace: true })
      return
    }
    await guardarNeuronio(guardarId, livroId)
    if (revelar) void navegar(`/rede?novo=${guardarId}`, { replace: true })
    // A pergunta tomou o lugar da tela de onde saiu: voltar uma casa é voltar
    // para lá. Sem casa para voltar, o porto é o lugar óbvio.
    else if (key === 'default') void navegar('/porto', { replace: true })
    else void navegar(-1)
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo voltarPara="/" icone="fechar" titulo={ehPasta ? 'Nova pasta' : 'Novo livro'} />

      <div className="animar-entrada flex flex-1 flex-col pt-4">
        <FormularioDeLivro
          inicial={{
            titulo: '',
            cor: panoSugerido(livros),
            estilo: ESTILO_PADRAO,
            orientacao: 'em-pe',
            emblema: null,
            larguraLombada: LARGURA_PADRAO,
            comprimentoLombada: COMPRIMENTO_PADRAO,
            executavel: false,
            diasParaAdormecer: DIAS_PARA_ADORMECER_PADRAO,
          }}
          rotuloDeEnvio={ehPasta ? 'Criar pasta' : 'Criar livro'}
          ocupado={ocupado}
          intensidadeDaLuz={intensidadeDaLuz}
          iconesNosLivros={iconesNosLivros}
          prateleiras={quantidadeDePrateleiras}
          {...(guardarId === null ? { tipo: { valor: tipo, onMudar: setTipo } } : {})}
          onEnviar={(dados) => {
            if (!cabeNaPrateleira(dados)) {
              avisar(`A prateleira ${String(prateleira + 1)} não tem espaço para esse livro.`)
              return
            }
            void criarLivro(dados, prateleira, lugar, tipo).then((id) => {
              if (id) void depoisDeCriar(id)
            })
          }}
        />
      </div>
    </div>
  )
}
