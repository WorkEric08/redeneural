import {
  BookOpen,
  Download,
  HardDriveDownload,
  Lightbulb,
  Minus,
  Moon,
  Plus,
  Rows3,
  Search,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { botao } from '@/components/botao'
import { BarraDeTopo } from '@/components/BarraDeTopo'
import { Confirmacao } from '@/components/Confirmacao'
import { EtiquetaProcessando } from '@/components/EtiquetaProcessando'
import { Folha } from '@/components/Folha'
import { Interruptor } from '@/components/Interruptor'
import {
  INTENSIDADE_DA_LUZ_MAXIMA,
  INTENSIDADE_DA_LUZ_MINIMA,
  INTENSIDADE_DA_LUZ_PADRAO,
  MAXIMO_DE_PRATELEIRAS,
  type TemaEscolhido,
} from '@/core'
import { haQuantoTempo, resumoDaCopia, type ResumoDaCopia } from '@/lib/copia'
import { contar } from '@/lib/plural'
import { lerTexto } from '@/services/native/arquivos'
import { lerUltimaCopia } from '@/services/native/ultimaCopia'
import { usePalacio } from '@/store/palacio'

/**
 * Ajustes do palácio: os números dele no alto e, num cartão só, tudo o que mexe na estante —
 * quantidade de prateleiras, a luz sobre os livros e sobre os enfeites, e os ícones no pé dos
 * livros. A seção "Mapa" (Reorganizar mapa) saiu em 07/10/2026.
 *
 * Tudo cabe na tela, sem rolagem (12/10/2026): cada ajuste é uma linha de ícone + título + valor
 * + controle, e o que antes era parágrafo explicativo virou rótulo curto no valor ("50% · real")
 * e no desenho do controle (lua, sol e a marca do meio da faixa).
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
    intensidadeDaLuz,
    definirIntensidadeDaLuz,
    intensidadeDaLuzDoEnfeite,
    definirIntensidadeDaLuzDoEnfeite,
    iconesNosLivros,
    definirIconesNosLivros,
    tema,
    definirTema,
    salvarCopia,
    restaurarCopia,
    avisar,
  } = usePalacio()

  const navegar = useNavigate()
  const [busca] = useSearchParams()
  const seletor = useRef<HTMLInputElement>(null)
  const [ultimaCopia, setUltimaCopia] = useState(lerUltimaCopia)
  // O arquivo já lido, esperando a pessoa confirmar. Quem abre a folha é a URL (`?restaurar=1`):
  // o voltar do Android fecha a pergunta antes de sair de Ajustes.
  const [pendente, setPendente] = useState<{ texto: string; resumo: ResumoDaCopia } | null>(null)
  const perguntando = pendente !== null && busca.get('restaurar') === '1'

  const semVetor = neuronios.filter((n) => n.processando).length
  const travado = ocupado || !carregado

  async function salvar(): Promise<void> {
    if (await salvarCopia()) setUltimaCopia(lerUltimaCopia())
  }

  async function escolhido(arquivo: File): Promise<void> {
    const texto = await lerTexto(arquivo)
    const resumo = resumoDaCopia(texto)
    if (!resumo) {
      avisar('Esse arquivo não é uma cópia do Locus.')
      return
    }
    setPendente({ texto, resumo })
    void navegar({ search: '?restaurar=1' })
  }

  function desistir(): void {
    void navegar(-1)
  }

  async function confirmar(texto: string): Promise<void> {
    // Com o arquivo restaurado ou recusado, a pergunta sai do histórico; o aviso ou o erro aparece.
    await restaurarCopia(texto)
    setPendente(null)
    void navegar(-1)
  }

  return (
    <div className="flex flex-col">
      <BarraDeTopo
        voltarPara="/"
        titulo="Ajustes"
        acoes={
          <Link
            to="/busca"
            aria-label="Busca global"
            className={botao({ tipo: 'fantasma', tamanho: 'icone' })}
          >
            <Search size={20} aria-hidden />
          </Link>
        }
      />

      <div className="animar-entrada ajustes-compacto flex flex-col gap-3 pt-5 md:gap-5 md:pt-6 [@media(max-height:600px)]:gap-0.5 [@media(max-height:600px)]:pt-1 [@media(min-height:601px)_and_(max-height:640px)]:gap-2 [@media(min-height:601px)_and_(max-height:640px)]:pt-2">
        <section className="relative">
          {/* O selo fica por cima da borda do cartão e não ocupa lugar: um aviso que só existe
              às vezes não pode empurrar a tela para fora do que cabe. */}
          {semVetor > 0 && (
            <span className="bg-sala absolute -top-2.5 right-3 z-10 rounded-full">
              <EtiquetaProcessando texto={`${String(semVetor)} sem processar`} />
            </span>
          )}
          <dl className="cartao grid grid-cols-3">
            <Numero valor={livros.length} rotulo={livros.length === 1 ? 'livro' : 'livros'} />
            <Numero
              valor={neuronios.length}
              rotulo={neuronios.length === 1 ? 'pensamento' : 'pensamentos'}
            />
            <Numero
              valor={conexoes.length}
              rotulo={conexoes.length === 1 ? 'conexão' : 'conexões'}
            />
          </dl>
        </section>

        <section>
          <h2 className="rotulo-de-secao ajustes-tema-rotulo">Tema</h2>
          <div role="group" aria-label="Tema da interface" className="segmentado">
            {OPCOES_DE_TEMA.map(({ valor, rotulo }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={tema === valor}
                className="segmento px-1 text-[0.78rem]"
                onClick={() => {
                  void definirTema(valor)
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="rotulo-de-secao">Estante</h2>
          <div className="cartao">
            <div className="linha-de-lista">
              <Icone>
                <Rows3 size={18} aria-hidden />
              </Icone>
              <Texto titulo="Prateleiras" detalhe={`De 1 a ${String(MAXIMO_DE_PRATELEIRAS)}`} />
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Menos uma prateleira"
                  className={`${botao({ tipo: 'secundario', tamanho: 'icone' })} aria-disabled:pointer-events-none aria-disabled:opacity-45`}
                  // `disabled` nativo fica só para "travado" (ocupado): as duas
                  // setas dividem a mesma `.linha-de-lista`, e o CSS que apaga a
                  // linha inteira quando ela `:has(:disabled)` apagaria a outra
                  // seta também — a de menos travava junto ao chegar no teto.
                  disabled={travado}
                  aria-disabled={quantidadeDePrateleiras <= 1}
                  onClick={() => {
                    if (quantidadeDePrateleiras <= 1) return
                    void definirQuantidadeDePrateleiras(quantidadeDePrateleiras - 1)
                  }}
                >
                  <Minus size={16} aria-hidden />
                </button>
                <span
                  className="font-dado w-5 text-center text-base tabular-nums"
                  aria-live="polite"
                >
                  {quantidadeDePrateleiras}
                </span>
                <button
                  type="button"
                  aria-label="Mais uma prateleira"
                  className={`${botao({ tipo: 'secundario', tamanho: 'icone' })} aria-disabled:pointer-events-none aria-disabled:opacity-45`}
                  disabled={travado}
                  aria-disabled={quantidadeDePrateleiras >= MAXIMO_DE_PRATELEIRAS}
                  onClick={() => {
                    if (quantidadeDePrateleiras >= MAXIMO_DE_PRATELEIRAS) return
                    void definirQuantidadeDePrateleiras(quantidadeDePrateleiras + 1)
                  }}
                >
                  <Plus size={16} aria-hidden />
                </button>
              </div>
            </div>

            <ControleDeLuz
              icone={<Lightbulb size={18} aria-hidden />}
              titulo="Luz dos livros"
              valor={intensidadeDaLuz}
              travado={travado}
              onMudar={(valor) => {
                void definirIntensidadeDaLuz(valor)
              }}
            />

            <ControleDeLuz
              icone={<Sparkles size={18} aria-hidden />}
              titulo="Luz dos enfeites"
              valor={intensidadeDaLuzDoEnfeite}
              travado={travado}
              onMudar={(valor) => {
                void definirIntensidadeDaLuzDoEnfeite(valor)
              }}
            />

            <div className="linha-de-lista">
              <Icone>
                <BookOpen size={18} aria-hidden />
              </Icone>
              <Texto titulo="Ícones nos livros" detalhe="Livro, martelo ou clipe" />
              <Interruptor
                ligado={iconesNosLivros}
                rotulo="Ícone no pé dos livros"
                desabilitado={travado}
                onMudar={(ligado) => {
                  void definirIconesNosLivros(ligado)
                }}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="cartao">
            <div className="linha-de-lista">
              <Icone>
                <HardDriveDownload size={18} aria-hidden />
              </Icone>
              <Texto
                titulo="Backup"
                detalhe={ultimaCopia ? `Salvo ${haQuantoTempo(ultimaCopia)}` : 'Nunca salvo'}
              />
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Salvar cópia"
                  className={botao({ tipo: 'secundario', tamanho: 'icone' })}
                  disabled={travado}
                  onClick={() => {
                    void salvar()
                  }}
                >
                  <Download size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Restaurar cópia"
                  className={botao({ tipo: 'secundario', tamanho: 'icone' })}
                  disabled={travado}
                  onClick={() => seletor.current?.click()}
                >
                  <Upload size={16} aria-hidden />
                </button>
                <input
                  ref={seletor}
                  type="file"
                  accept="application/json,.json"
                  tabIndex={-1}
                  aria-hidden
                  className="hidden"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    // Zera o input: escolher o mesmo arquivo de novo tem que disparar.
                    e.target.value = ''
                    if (arquivo) void escolhido(arquivo)
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Folha aberta={perguntando} rotulo="Restaurar cópia" onFechar={desistir}>
        {pendente && (
          <Confirmacao
            titulo="Restaurar esta cópia?"
            explicacao={`O arquivo traz ${contar(pendente.resumo.livros, 'livro', 'livros')} e ${contar(pendente.resumo.pensamentos, 'pensamento', 'pensamentos')}. Eles se juntam ao que já está aqui; o que existir nos dois lugares fica como está no arquivo, mesmo que você tenha mudado depois.`}
            rotulo="Restaurar"
            rotuloOcupado="Restaurando…"
            ocupado={ocupado}
            onCancelar={desistir}
            onConfirmar={() => {
              void confirmar(pendente.texto)
            }}
          />
        )}
      </Folha>
    </div>
  )
}

/** Os temas que se escolhem, na ordem em que aparecem em Ajustes. O clássico é um easter egg: não está aqui. */
const OPCOES_DE_TEMA: readonly { valor: TemaEscolhido; rotulo: string }[] = [
  { valor: 'padrao-claro', rotulo: 'Padrão claro' },
  { valor: 'padrao-escuro', rotulo: 'Padrão escuro' },
]

/** O que o valor da luz quer dizer: 50 mostra a cor real, abaixo sombra, acima brilho. */
function leituraDaLuz(valor: number): string {
  if (valor === INTENSIDADE_DA_LUZ_PADRAO) return `${String(valor)}% · real`
  return `${String(valor)}% · ${valor < INTENSIDADE_DA_LUZ_PADRAO ? 'sombra' : 'brilho'}`
}

function ControleDeLuz({
  icone,
  titulo,
  valor,
  travado,
  onMudar,
}: {
  icone: ReactNode
  titulo: string
  valor: number
  travado: boolean
  onMudar: (valor: number) => void
}) {
  const leitura = leituraDaLuz(valor)
  // A faixa preenche a partir do meio (a cor real), para os dois lados: é o que mostra de relance
  // se a luz está abaixo ou acima do normal.
  const faixa = {
    '--de': `${String(Math.min(valor, INTENSIDADE_DA_LUZ_PADRAO))}%`,
    '--ate': `${String(Math.max(valor, INTENSIDADE_DA_LUZ_PADRAO))}%`,
  } as CSSProperties

  return (
    <div className="linha-de-lista py-1.5">
      <Icone>{icone}</Icone>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.95rem] font-medium">{titulo}</span>
          <span className="font-dado text-poeira text-xs tabular-nums">{leitura}</span>
        </div>
        <div className="flex items-center gap-2">
          <Moon size={14} aria-hidden className="text-poeira shrink-0" />
          <input
            type="range"
            min={INTENSIDADE_DA_LUZ_MINIMA}
            max={INTENSIDADE_DA_LUZ_MAXIMA}
            value={valor}
            disabled={travado}
            aria-label={titulo}
            aria-valuetext={leitura}
            onChange={(e) => {
              onMudar(Number(e.target.value))
            }}
            className="faixa-de-ajuste min-w-0 flex-1"
            style={faixa}
          />
          <Sun size={14} aria-hidden className="text-poeira shrink-0" />
        </div>
      </div>
    </div>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="border-linha flex flex-row-reverse items-baseline justify-center gap-1.5 px-2 py-2.5 not-first:border-l">
      <dt className="text-poeira text-xs">{rotulo}</dt>
      <dd className="font-titulo text-xl font-semibold tabular-nums">{valor}</dd>
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

function Texto({ titulo, detalhe }: { titulo: string; detalhe: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-[0.95rem] font-medium">{titulo}</span>
      <span className="text-poeira text-xs leading-snug">{detalhe}</span>
    </span>
  )
}
