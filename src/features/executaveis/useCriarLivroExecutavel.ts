import { DIAS_PARA_ADORMECER_PADRAO, ESTILO_PADRAO, primeiroLugarDaEstante } from '@/core'
import { COMPRIMENTO_PADRAO } from '@/features/estante/comprimentos'
import { LARGURA_PADRAO } from '@/features/estante/larguras'
import { panoSugerido } from '@/features/estante/panos'
import { usePalacio } from '@/store/palacio'

/**
 * Cria um livro executável sem sair da tela — é o que o app oferece quando não
 * há nenhum e a pessoa quer executar uma ideia. Sair para o formulário de
 * livro, na captura, perderia o que ela acabou de escrever.
 *
 * Nasce como qualquer livro novo da estante (pano sugerido, tamanho normal) no
 * primeiro lugar livre; nome, pano e o resto se trocam depois, em "Editar
 * livro". Devolve o id, ou `null` se não coube ou o motor não conseguiu.
 */
export function useCriarLivroExecutavel(): (titulo: string) => Promise<string | null> {
  const { livros, quantidadeDePrateleiras, criarLivro, avisar } = usePalacio()

  return async (titulo) => {
    const lugar = primeiroLugarDaEstante(livros, quantidadeDePrateleiras)
    if (!lugar) {
      avisar('A estante não tem lugar livre para um livro novo.')
      return null
    }
    return criarLivro(
      {
        titulo: titulo.trim(),
        cor: panoSugerido(livros),
        estilo: ESTILO_PADRAO,
        emblema: null,
        larguraLombada: LARGURA_PADRAO,
        comprimentoLombada: COMPRIMENTO_PADRAO,
        executavel: true,
        diasParaAdormecer: DIAS_PARA_ADORMECER_PADRAO,
      },
      lugar.prateleira,
      lugar.lugar,
    )
  }
}
