import type { ReactNode } from 'react'

interface Props {
  /** O ícone, num círculo de campo de 64 px. */
  icone: ReactNode
  titulo: string
  texto: string
}

/**
 * O estado vazio do tema Padrão (docs/estilos-visuais-locus.md, "Busca sem resultado" e "Porto
 * vazio"): um ícone num círculo, o título e uma frase de apoio — sem cartão em volta.
 */
export function EstadoVazio({ icone, titulo, texto }: Props) {
  return (
    <div className="pd-vazio" role="status">
      <span className="pd-vazio-icone">{icone}</span>
      <p className="pd-vazio-titulo">{titulo}</p>
      <p className="pd-vazio-texto">{texto}</p>
    </div>
  )
}
