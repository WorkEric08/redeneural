import { Download, Minus, Plus, RefreshCw, Rows3, Search, Upload } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { botao } from '@/components/botao'
import { BarraDeTopo } from '@/components/BarraDeTopo'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { usePalacio } from '@/store/palacio'

/**
 * Backup e manutenção do palácio.
 *
 * É onde o export/import da Fase 5 e o reprocessamento foram morar quando a
 * navegação de verdade chegou — antes viviam numa tela crua de desenvolvimento.
 * O que cada ação respondeu aparece no aviso flutuante (Aviso.tsx), e não numa
 * caixa no meio da tela que empurra tudo para baixo.
 */
export default function Ajustes() {
  const {
    livros,
    neuronios,
    conexoes,
    carregado,
    ocupado,
    quantidadeDePrateleiras,
    definirQuantidadeDePrateleiras,
    reprocessarTudo,
    exportar,
    importar,
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
                  disabled={travado}
                  onClick={() => void definirQuantidadeDePrateleiras(quantidadeDePrateleiras + 1)}
                >
                  <Plus size={16} aria-hidden />
                </button>
              </div>
            </div>
          </div>
          <p className="text-poeira px-1 pt-2.5 text-xs leading-relaxed">
            Diminuir é recusado se ainda sobrar livro nas prateleiras removidas — mova-os antes.
          </p>
        </section>

        <section>
          <h2 className="rotulo-de-secao">Backup</h2>
          <div className="cartao">
            <button
              type="button"
              onClick={() => void exportar()}
              disabled={travado}
              className="linha-de-lista"
            >
              <Icone>
                <Download size={18} aria-hidden />
              </Icone>
              <Texto titulo="Exportar backup">Um arquivo com tudo, inclusive os vetores.</Texto>
            </button>

            <label className="linha-de-lista cursor-pointer">
              <Icone>
                <Upload size={18} aria-hidden />
              </Icone>
              <Texto titulo="Importar backup">
                Funde com o que já existe, por id — o mesmo arquivo duas vezes não duplica nada.
              </Texto>
              <input
                type="file"
                accept="application/json,.json"
                disabled={ocupado}
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  // Zera o input: escolher o mesmo arquivo de novo tem que disparar.
                  e.target.value = ''
                  if (arquivo) void importar(arquivo)
                }}
              />
            </label>
          </div>
          <p className="text-poeira px-1 pt-2.5 text-xs leading-relaxed">
            Importar num aparelho novo devolve o palácio funcionando sem baixar o modelo.
          </p>
        </section>

        <section>
          <h2 className="rotulo-de-secao">Manutenção</h2>
          <div className="cartao">
            <button
              type="button"
              onClick={() => void reprocessarTudo()}
              disabled={travado}
              className="linha-de-lista"
            >
              <Icone>
                <RefreshCw size={18} aria-hidden className={ocupado ? 'animate-spin' : undefined} />
              </Icone>
              <Texto titulo={ocupado ? 'Processando…' : 'Reprocessar tudo'}>
                Refaz o grafo inteiro — depois de um import, ou se algo parecer errado.
              </Texto>
            </button>
          </div>
          <p className="text-poeira px-1 pt-2.5 text-xs leading-relaxed">
            O palácio já faz isso sozinho conforme cresce. Não recalcula o embedding de quem já tem:
            os vetores ficam gravados, então costuma ser rápido e não usa rede.
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
