import { contar } from '@/lib/plural'
import { usePalacio } from '@/store/palacio'

/**
 * Backup e manutenção do palácio.
 *
 * É onde o export/import da Fase 5 e o reprocessamento foram morar quando a
 * navegação de verdade chegou — antes viviam numa tela crua de desenvolvimento.
 */
export default function Ajustes() {
  const {
    livros,
    neuronios,
    conexoes,
    carregado,
    ocupado,
    erro,
    aviso,
    reprocessarTudo,
    exportar,
    importar,
  } = usePalacio()

  const semVetor = neuronios.filter((n) => n.processando).length

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-titulo text-xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-poeira text-sm">
          {contar(livros.length, 'livro', 'livros')} ·{' '}
          {contar(neuronios.length, 'neurônio', 'neurônios')} ·{' '}
          {contar(conexoes.length, 'conexão', 'conexões')}
          {semVetor > 0 && ` · ${String(semVetor)} ainda sem processar`}
        </p>
      </header>

      {erro && (
        <p className="text-destructive border-destructive/40 rounded-lg border p-3 text-sm">
          {erro}
        </p>
      )}
      {aviso && <p className="border-linha text-poeira rounded-lg border p-3 text-sm">{aviso}</p>}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-titulo font-semibold">Backup</h2>
          <p className="text-poeira text-sm">
            Um arquivo com tudo, inclusive os vetores. Importar num aparelho novo devolve o palácio
            funcionando sem baixar o modelo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void exportar()}
            disabled={ocupado || !carregado}
            className="border-linha h-12 rounded-lg border px-4 text-sm disabled:opacity-50"
          >
            Exportar
          </button>

          <label className="border-linha flex h-12 cursor-pointer items-center rounded-lg border px-4 text-sm has-disabled:opacity-50">
            Importar
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

        <p className="text-poeira text-xs">
          Importar funde com o que já existe, por id — o mesmo arquivo duas vezes não duplica nada.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-titulo font-semibold">Reprocessar</h2>
          <p className="text-poeira text-sm">
            Refaz o grafo inteiro. O palácio já faz isso sozinho conforme cresce; aqui é para forçar
            — depois de um import, ou se algo parecer errado.
          </p>
        </div>

        <button
          onClick={() => void reprocessarTudo()}
          disabled={ocupado || !carregado}
          className="border-linha h-12 w-fit rounded-lg border px-4 text-sm disabled:opacity-50"
        >
          {ocupado ? 'Processando…' : 'Reprocessar tudo'}
        </button>

        <p className="text-poeira text-xs">
          Não recalcula embedding de quem já tem: os vetores ficam gravados, então isto costuma ser
          rápido e não usa rede.
        </p>
      </section>
    </div>
  )
}
