import { Lightbulb, Minus, Plus, Rows3, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { botao } from '@/components/botao'
import { BarraDeTopo } from '@/components/BarraDeTopo'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { INTENSIDADE_DA_LUZ_MAXIMA, INTENSIDADE_DA_LUZ_MINIMA, MAXIMO_DE_PRATELEIRAS } from '@/core'
import { usePalacio } from '@/store/palacio'

/** Ajustes do palácio: quantidade de prateleiras e intensidade da luz. */
export default function Ajustes() {
  const {
    livros,
    neuronios,
    conexoes,
    carregado,
    ocupado,
    quantidadeDePrateleiras,
    definirQuantidadeDePrateleiras,
    intensidadeDaLuz,
    definirIntensidadeDaLuz,
  } = usePalacio()

  const semVetor = neuronios.filter((n) => n.processando).length
  const travado = ocupado || !carregado

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara="/"
        titulo="Ajustes"
        acoes={
          <Link
            to="/busca"
            aria-label="Buscar"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
        }
      />

      <div className="animar-entrada flex flex-col gap-7 pt-5">
        <section>
          <dl className="cartao grid grid-cols-3">
            <Numero valor={livros.length} rotulo={livros.length === 1 ? 'livro' : 'livros'} />
            <Numero
              valor={neuronios.length}
              rotulo={neuronios.length === 1 ? 'neurônio' : 'neurônios'}
            />
            <Numero
              valor={conexoes.length}
              rotulo={conexoes.length === 1 ? 'conexão' : 'conexões'}
            />
          </dl>
          {semVetor > 0 && (
            <p className="flex items-center gap-2 px-1 pt-3 text-sm">
              <EtiquetaProcessando texto={`${String(semVetor)} sem processar`} />
            </p>
          )}
        </section>

        <section>
          <h2 className="rotulo-de-secao">Estante</h2>
          <div className="cartao">
            <div className="linha-de-lista">
              <Icone>
                <Rows3 size={18} aria-hidden />
              </Icone>
              <Texto titulo="Prateleiras">Quantas fileiras o móvel tem.</Texto>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Menos uma prateleira"
                  className={botao({ tipo: 'secundario', tamanho: 'icone' })}
                  disabled={travado || quantidadeDePrateleiras <= 1}
                  onClick={() => void definirQuantidadeDePrateleiras(quantidadeDePrateleiras - 1)}
                >
                  <Minus size={16} aria-hidden />
                </button>
                <span className="font-dado w-5 text-center text-sm tabular-nums">
                  {quantidadeDePrateleiras}
                </span>
                <button
                  type="button"
                  aria-label="Mais uma prateleira"
                  className={botao({ tipo: 'secundario', tamanho: 'icone' })}
                  disabled={travado || quantidadeDePrateleiras >= MAXIMO_DE_PRATELEIRAS}
                  onClick={() => void definirQuantidadeDePrateleiras(quantidadeDePrateleiras + 1)}
                >
                  <Plus size={16} aria-hidden />
                </button>
              </div>
            </div>

            <div className="linha-de-lista flex-col items-stretch gap-3">
              <div className="flex items-center gap-3.5">
                <Icone>
                  <Lightbulb size={18} aria-hidden />
                </Icone>
                <Texto titulo="Intensidade da luz">
                  De longe, o quanto a luz da sala lava a cor dos livros.
                </Texto>
                <span className="font-dado w-9 shrink-0 text-right text-sm tabular-nums">
                  {intensidadeDaLuz}%
                </span>
              </div>
              <input
                type="range"
                min={INTENSIDADE_DA_LUZ_MINIMA}
                max={INTENSIDADE_DA_LUZ_MAXIMA}
                value={intensidadeDaLuz}
                disabled={travado}
                aria-label="Intensidade da luz"
                onChange={(e) => {
                  void definirIntensidadeDaLuz(Number(e.target.value))
                }}
                className="accent-realce w-full"
              />
            </div>
          </div>
          <p className="text-poeira px-1 pt-2.5 text-xs leading-relaxed">
            Diminuir prateleiras é recusado se ainda sobrar livro nas removidas — mova-os antes.
          </p>
        </section>
      </div>
    </div>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="border-linha flex flex-col-reverse items-center gap-0.5 px-2 py-4 not-first:border-l">
      <dt className="text-poeira text-xs">{rotulo}</dt>
      <dd className="font-titulo text-2xl font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}

function Icone({ children }: { children: ReactNode }) {
  return (
    <span className="bg-realce text-papel grid size-9 shrink-0 place-items-center rounded-xl">
      {children}
    </span>
  )
}

function Texto({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-[0.95rem] font-medium">{titulo}</span>
      <span className="text-poeira text-xs leading-snug">{children}</span>
    </span>
  )
}
