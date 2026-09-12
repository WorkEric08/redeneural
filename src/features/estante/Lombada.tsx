import { Link } from 'react-router-dom'

import type { LivroNaEstante } from './resumo'

/**
 * Em % da fileira, não em pixels: a fileira agora cresce com a tela (ver
 * .movel-fila), e a proporção entre livro e prateleira é que tem de ficar de
 * pé. São os mesmos 58..86 px sobre a fileira de 92 px de antes.
 */
const ALTURA_MINIMA = 63
const ALTURA_MAXIMA = 93.5

/**
 * Um livro visto de fora.
 *
 * A altura vem da quantidade de neurônios — é a única coisa que a estante conta
 * sem você abrir nada. O título vai gravado em ouro, como numa lombada de
 * verdade, e a luz da sala lava a cor do pano: de longe você não vê a cor real
 * do livro, vê o livro sob a luz.
 *
 * A largura vem da semente do id (ver `prateleiras.ts`): varia como numa estante
 * de verdade, mas é sempre a mesma para o mesmo livro.
 */
export function Lombada({ item, largura }: { item: LivroNaEstante; largura: number }) {
  const altura = ALTURA_MINIMA + item.altura * (ALTURA_MAXIMA - ALTURA_MINIMA)

  return (
    <Link
      to={`/livro/${item.livro.id}`}
      style={{
        // backgroundColor, não background: o atalho apagaria as nervuras e as
        // quinas, que moram em background-image na classe.
        backgroundColor: `color-mix(in oklab, ${item.livro.cor} 58%, var(--lavagem))`,
        height: `${String(Math.round(altura * 10) / 10)}%`,
        width: `${String(largura)}px`,
      }}
      className="lombada lombada--livro"
      aria-label={`${item.livro.titulo}, ${String(item.neuronios)} neurônios`}
    >
      <span className="lombada-titulo">{item.livro.titulo}</span>

      {item.saindo > 0 && <span className="lombada-ponto brilho-ouro" aria-hidden />}
    </Link>
  )
}
