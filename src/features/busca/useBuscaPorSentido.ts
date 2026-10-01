import { useEffect, useState } from 'react'

import { usePalacio } from '@/store/palacio'

/** Quanto esperar depois da última tecla: cada pergunta passa pelo modelo. */
const ESPERA_MS = 300

export interface BuscaPorSentido {
  /**
   * Os ids da última resposta que chegou, em ordem — enquanto a consulta atual
   * não volta, os da anterior, para a lista não piscar a cada tecla. `null`
   * antes da primeira resposta, ou se a última falhou.
   */
  ids: readonly string[] | null
  /** A consulta atual ainda não respondeu. */
  procurando: boolean
  /** A consulta atual falhou — o modelo não carregou, por exemplo. */
  falhou: boolean
}

/**
 * A busca por sentido enquanto se digita: espera a pessoa parar, pergunta ao
 * motor, e descarta a resposta de uma consulta que já foi substituída.
 */
export function useBuscaPorSentido(consulta: string, ativa: boolean): BuscaPorSentido {
  const buscar = usePalacio((s) => s.buscarPorSentido)
  const [resposta, setResposta] = useState<{ consulta: string; ids: string[] | null } | null>(null)

  const termo = ativa ? consulta.trim() : ''

  useEffect(() => {
    if (termo === '') return

    let valendo = true
    const relogio = window.setTimeout(() => {
      buscar(termo).then(
        (ids) => {
          if (valendo) setResposta({ consulta: termo, ids })
        },
        () => {
          if (valendo) setResposta({ consulta: termo, ids: null })
        },
      )
    }, ESPERA_MS)

    return () => {
      valendo = false
      window.clearTimeout(relogio)
    }
  }, [termo, buscar])

  if (termo === '') return { ids: null, procurando: false, falhou: false }

  const atual = resposta?.consulta === termo
  return {
    ids: resposta?.ids ?? null,
    procurando: !atual,
    falhou: atual && resposta.ids === null,
  }
}
