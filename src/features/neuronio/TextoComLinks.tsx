import { Fragment, useMemo } from 'react'

import { dividirEmSegmentos } from './links'

interface Props {
  texto: string
  className?: string
}

/**
 * O texto de um neurônio, com toda URL (`http://`/`https://`) virando link
 * de verdade — pedido do usuário, 17/09/2026, para abrir algo como um vídeo
 * do YouTube colado no meio do texto sem sair copiando e colando na mão.
 *
 * `break-all` só no link: uma URL comprida não tem espaço para quebrar
 * como uma frase comum, e sem isso ela empurra a largura da caixa (o mesmo
 * container que o resto do texto já respeita) para fora da tela.
 */
export function TextoComLinks({ texto, className }: Props) {
  const segmentos = useMemo(() => dividirEmSegmentos(texto), [texto])

  return (
    <p className={className}>
      {segmentos.map((segmento, indice) =>
        segmento.tipo === 'link' ? (
          <a
            key={indice}
            href={segmento.valor}
            target="_blank"
            rel="noopener noreferrer"
            className="text-papel break-all underline decoration-1 underline-offset-2 active:opacity-70"
          >
            {segmento.valor}
          </a>
        ) : (
          <Fragment key={indice}>{segmento.valor}</Fragment>
        ),
      )}
    </p>
  )
}
