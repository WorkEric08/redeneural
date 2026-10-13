import type { ReactNode } from 'react'

interface Props {
  /** A linha de cima, pequena: "Livro executável", "Pasta", "Porto". */
  rotulo: string
  titulo: string
  /** A cor do livro, quando o título é de um — vira a marca à frente do nome. */
  cor?: string
  sub?: ReactNode
}

/**
 * O bloco de título das telas de lista do tema Padrão (docs/estilos-visuais-locus.md, "Livro
 * executável", "Pasta de acervo", "Porto"): o rótulo da espécie, o nome grande e uma linha de
 * resumo, logo abaixo da barra de topo — que nessas telas só tem voltar e busca.
 */
export function BlocoDeTitulo({ rotulo, titulo, cor, sub }: Props) {
  return (
    <div className="pd-titulo-bloco">
      <div className="pd-titulo-rotulo">{rotulo}</div>
      <h1 className="pd-titulo-h1 texto-do-usuario">
        {cor !== undefined && (
          <span className="marca-do-livro shrink-0" style={{ background: cor }} aria-hidden />
        )}
        {titulo}
      </h1>
      {sub !== undefined && <div className="pd-titulo-sub">{sub}</div>}
    </div>
  )
}
