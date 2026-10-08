import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { BarraDeTopo } from '@/components/BarraDeTopo'
import { chaveDoLugar, LUGARES_POR_PRATELEIRA } from '@/core'
import { COMPRIMENTOS } from '@/features/estante/comprimentos'
import { FormularioDeLivro } from '@/features/estante/FormularioDeLivro'
import { LARGURAS } from '@/features/estante/larguras'
import { opcaoMaisProxima } from '@/features/estante/opcaoMaisProxima'
import { enfeiteDoLugar } from '@/features/estante/prateleiras'
import { usePalacio } from '@/store/palacio'

/** `/enfeite/2/7/editar`: prateleira e lugar, contados do zero como no banco. */
function inteiro(texto: string | undefined): number | null {
  return texto !== undefined && /^\d{1,3}$/.test(texto) ? Number(texto) : null
}

/**
 * Editar um enfeite (07/10/2026). A mesma tela cheia de editar um livro — cor,
 * forma, largura e comprimento —, sem nome, tipo nem emblema: o enfeite é só visual.
 *
 * O enfeite sorteado de um lugar também se edita: salvar o grava, e o que a pessoa
 * não mexeu fica como estava.
 */
export default function EditarEnfeite() {
  const params = useParams()
  const navegar = useNavigate()
  const {
    livros,
    vagas,
    enfeites,
    quantidadeDePrateleiras,
    intensidadeDaLuzDoEnfeite,
    ocupado,
    salvarEnfeite,
  } = usePalacio()

  const prateleira = inteiro(params['prateleira'])
  const lugar = inteiro(params['lugar'])

  const atual = useMemo(() => {
    if (prateleira === null || lugar === null) return null
    if (prateleira >= quantidadeDePrateleiras || lugar >= LUGARES_POR_PRATELEIRA) return null
    return enfeiteDoLugar(prateleira, lugar, new Set(livros.map(chaveDoLugar)), vagas, enfeites)
  }, [prateleira, lugar, quantidadeDePrateleiras, livros, vagas, enfeites])

  if (prateleira === null || lugar === null || !atual) {
    return (
      <div className="flex flex-col">
        <BarraDeTopo voltarPara="/" icone="fechar" titulo="Editar enfeite" />
        <p className="text-poeira pt-6 text-sm">Este lugar não tem mais um enfeite.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <BarraDeTopo voltarPara="/" icone="fechar" titulo="Editar enfeite" />

      <div className="animar-entrada flex flex-1 flex-col pt-4">
        <FormularioDeLivro
          enfeite
          acabamentoDoEnfeite={{
            douradoEm: atual.dourado ? atual.estilo : null,
            escuroEm: atual.detalheEscuro ? { estilo: atual.estilo, cor: atual.cor } : undefined,
          }}
          prateleiras={quantidadeDePrateleiras}
          inicial={{
            titulo: '',
            cor: atual.cor,
            estilo: atual.estilo,
            emblema: null,
            // As medidas que o enfeite tem agora, na opção de sempre mais perto delas
            // (Fina a Grande, Curto a Enorme): a tela nunca mostra "automático" nem
            // uma porcentagem solta.
            larguraLombada: opcaoMaisProxima(
              atual.larguraNatural,
              LARGURAS.map((l) => l.px),
            ),
            comprimentoLombada: opcaoMaisProxima(
              atual.altura,
              COMPRIMENTOS.map((c) => c.percentual),
            ),
            executavel: false,
            diasParaAdormecer: 30,
          }}
          rotuloDeEnvio="Salvar"
          ocupado={ocupado}
          intensidadeDaLuz={intensidadeDaLuzDoEnfeite}
          onEnviar={(dados) => {
            void salvarEnfeite({
              prateleira,
              ordem: lugar,
              cor: dados.cor,
              estilo: dados.estilo,
              larguraLombada: dados.larguraLombada,
              comprimentoLombada: dados.comprimentoLombada,
              // Outra Forma troca os filetes dourados pelos detalhes dela; voltar à
              // original os traz de volta. Mexer só na cor ou nas medidas não os tira.
              dourado: atual.dourado && dados.estilo === atual.estilo,
              // Mexer na cor ou na forma desliga o acabamento do sorteio: aí o enfeite
              // é desenhado como um livro, na forma e na cor que a pessoa escolheu.
              detalheEscuro:
                atual.detalheEscuro &&
                dados.estilo === atual.estilo &&
                dados.cor.toLowerCase() === atual.cor.toLowerCase(),
            }).then((ok) => {
              // `replace`: voltar depois de salvar tem que sair do formulário.
              if (ok) void navegar('/', { replace: true })
            })
          }}
        />
      </div>
    </div>
  )
}
