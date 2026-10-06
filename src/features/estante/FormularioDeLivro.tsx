import { BookOpen, Hammer, type LucideIcon, Paperclip, Shuffle } from 'lucide-react'
import { useRef, useState, type CSSProperties } from 'react'

import { botao } from '@/components/botao'
import {
  clampDiasParaAdormecer,
  DIAS_PARA_ADORMECER_MAXIMO,
  type EstiloDaLombada,
  type TipoDeLivro,
} from '@/core'
import type { NovoLivro } from '@/store/palacio'

import { COMPRIMENTOS } from './comprimentos'
import { EmblemaDaLombada } from './EmblemaDaLombada'
import { FORMAS } from './formas'
import { LARGURAS } from './larguras'
import { geometriaDaLombada } from './lombadaNoite'
import { PANOS } from './panos'
import {
  alturaDaLombadaEmPercentual,
  larguraDoLivroGravado,
  TOM_DO_DETALHE_DO_ENFEITE,
} from './prateleiras'
import { useMedidasDaFileira } from './useMedidasDaFileira'

/**
 * A altura da caixa que guarda a amostra — o teto do que uma lombada pode medir
 * (98% de uma fileira de 132 px). Fixa para trocar o comprimento não empurrar o resto
 * do formulário. A lombada dentro dela tem as medidas **reais** da estante.
 */
const REFERENCIA_DA_AMOSTRA_PX = 130

/**
 * Mesma conversão, mas para as opções de comprimento — que são um seletor,
 * não a lombada de verdade. Numa referência de 130px "Enorme" (98%) vira uma
 * caixa de 127px, alta o bastante para empurrar a tela do celular para fora
 * sem rolar (pedido do usuário, 16/09/2026). Uma referência bem menor mantém
 * a proporção entre as opções sem pagar esse custo de altura.
 */
const REFERENCIA_DAS_OPCOES_PX = 56

/** A miniatura de cada forma: a proporção de uma lombada de largura média. */
const LARGURA_DA_MINIATURA_PX = 22
const ALTURA_DA_MINIATURA_PX = 40

type ChaveDeTipo = 'livro' | 'executavel' | 'pasta'

interface OpcaoDeTipo {
  chave: ChaveDeTipo
  rotulo: string
  nomeAcessivel: string
  Icone: LucideIcon
}

interface Props {
  inicial: NovoLivro
  rotuloDeEnvio: string
  ocupado?: boolean
  /** 0-100: para a amostra mostrar a mesma lavagem da estante. */
  intensidadeDaLuz: number
  /**
   * Só ao criar: livro de conceitos ou pasta de acervo. Editando, fica de
   * fora — o tipo não muda depois (ver `TipoDeLivro`).
   */
  tipo?: { valor: TipoDeLivro; onMudar: (tipo: TipoDeLivro) => void }
  /** Editando: o tipo do livro, que não muda — decide se ele pode ser executável. */
  tipoFixo?: TipoDeLivro
  /**
   * Um enfeite, e não um livro (07/10/2026): cor, forma, largura e comprimento, como
   * o livro — mas sem nome, tipo nem emblema. O enfeite é só visual.
   */
  enfeite?: boolean
  /**
   * O acabamento do enfeite na estante, para a amostra o ter também: os filetes
   * dourados e, enquanto a forma e a cor forem as de `escuroEm`, os detalhes em azul
   * escuro do enfeite sorteado (ver `EnfeiteGravado.detalheEscuro`).
   */
  acabamentoDoEnfeite?:
    | { dourado: boolean; escuroEm?: { estilo: EstiloDaLombada; cor: string } | undefined }
    | undefined
  /**
   * O que a amostra precisa para ser a lombada que vai para a estante, e não uma
   * parecida: o livro (a largura automática sai do id dele), quanto ele guarda (a
   * altura automática e a contagem do papel) e quantas prateleiras o móvel tem (a
   * fileira se mede por elas). Num livro novo, nada disso existe ainda.
   */
  livroId?: string | undefined
  /** 0..1, como `LivroNaEstante.altura`. Livro novo: 0. */
  alturaAutomatica?: number | undefined
  /** O que o papel mostra no pé: neurônios, ou itens numa pasta. Livro novo: 0. */
  contagem?: number | undefined
  prateleiras?: number | undefined
  onEnviar: (dados: NovoLivro) => void
}

/**
 * Nome, cor, forma e medidas de um livro — o mesmo formulário para criar e para editar, como o
 * do neurônio.
 *
 * A amostra ao lado é a lombada como ela vai ficar na estante (forma, cor,
 * largura, comprimento e emblema; sem estado), com a mesma
 * lavagem de luz. Um quadradinho de cor pura enganaria: na prateleira nenhum
 * pano aparece com a cor que tem.
 *
 * Sempre tela cheia (pedido do usuário, 17/09/2026 — antes editar era uma
 * folha, com um "Cancelar" ao lado do enviar): sair é o "fechar" da barra de
 * topo, como o formulário de neurônio.
 */
export function FormularioDeLivro({
  inicial,
  rotuloDeEnvio,
  ocupado = false,
  intensidadeDaLuz,
  tipo,
  tipoFixo,
  enfeite = false,
  acabamentoDoEnfeite,
  livroId,
  alturaAutomatica = 0,
  contagem = 0,
  prateleiras = 4,
  onEnviar,
}: Props) {
  const [titulo, setTitulo] = useState(inicial.titulo)
  const [cor, setCor] = useState(inicial.cor)
  const [estilo, setEstilo] = useState(inicial.estilo)
  // Sem seção própria no formulário: um livro editado mantém o emblema que já
  // tinha, só não dá mais para escolher um novo.
  const emblema = inicial.emblema
  const [larguraLombada, setLarguraLombada] = useState(inicial.larguraLombada)
  const [comprimentoLombada, setComprimentoLombada] = useState(inicial.comprimentoLombada)
  const [executavel, setExecutavel] = useState(inicial.executavel)
  // Texto, e não número: o campo pode ficar vazio enquanto se digita.
  const [dias, setDias] = useState(String(inicial.diasParaAdormecer))
  // Uma pasta de acervo nunca é executável.
  const podeSerExecutavel = !enfeite && (tipo?.valor ?? tipoFixo ?? 'conceitos') === 'conceitos'

  const podeEnviar = (enfeite || titulo.trim().length > 0) && !ocupado

  // A amostra é a lombada da estante: a mesma largura, a mesma altura em px (a % da
  // fileira, medida num móvel escondido) e, por isso, o mesmo tamanho de título e as
  // mesmas reticências. Sem isto o título cabia na amostra e era cortado na prateleira.
  const medidor = useRef<HTMLDivElement>(null)
  const { altura: alturaDaFileira } = useMedidasDaFileira(medidor, 112, true)
  const larguraDaAmostra =
    larguraLombada ?? larguraDoLivroGravado({ id: livroId ?? '', larguraLombada: null })
  const alturaDaAmostra =
    (alturaDaLombadaEmPercentual(comprimentoLombada, alturaAutomatica) * alturaDaFileira) / 100
  const tituloDaAmostra = enfeite ? '' : titulo.trim() || '…'
  const ehPasta = (tipo?.valor ?? tipoFixo) === 'acervo'
  const escuroEm = acabamentoDoEnfeite?.escuroEm
  const detalheEscuro =
    escuroEm !== undefined &&
    estilo === escuroEm.estilo &&
    cor.toLowerCase() === escuroEm.cor.toLowerCase()
  const geo = geometriaDaLombada({
    estilo,
    cor,
    titulo: tituloDaAmostra,
    largura: larguraDaAmostra,
    altura: alturaDaAmostra,
    intensidadeDaLuz,
  })

  const opcoesDeTipo: OpcaoDeTipo[] = [
    { chave: 'livro', rotulo: 'Livro', nomeAcessivel: 'Livro', Icone: BookOpen },
    ...(podeSerExecutavel || tipo
      ? [
          {
            chave: 'executavel',
            rotulo: 'Executável',
            nomeAcessivel: 'Livro executável',
            Icone: Hammer,
          } as const,
        ]
      : []),
    ...(tipo
      ? [
          {
            chave: 'pasta',
            rotulo: 'Pasta',
            nomeAcessivel: 'Pasta de links e imagens',
            Icone: Paperclip,
          } as const,
        ]
      : []),
  ]
  const atual: ChaveDeTipo =
    tipo?.valor === 'acervo' ? 'pasta' : podeSerExecutavel && executavel ? 'executavel' : 'livro'

  function escolherTipo(chave: ChaveDeTipo): void {
    if (chave === 'pasta') {
      tipo?.onMudar('acervo')
      return
    }
    tipo?.onMudar('conceitos')
    setExecutavel(chave === 'executavel')
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (podeEnviar) {
          onEnviar({
            titulo: titulo.trim(),
            cor,
            estilo,
            emblema,
            larguraLombada,
            comprimentoLombada,
            executavel: podeSerExecutavel && executavel,
            diasParaAdormecer: clampDiasParaAdormecer(
              dias.trim() === '' ? Number.NaN : Number(dias),
            ),
          })
        }
      }}
      // O `autocomplete` do form, e não só do campo: é o sinal mais forte
      // que a web tem contra o autofill do Android/Gboard (chave, cartão,
      // localização) — pedido do usuário, 17/09/2026. Nenhum campo daqui é
      // login, pagamento ou endereço.
      autoComplete="off"
    >
      {/* O que é este livro, numa fileira só: livro comum, livro de ideias para
          fazer (01/10/2026) ou, só ao criar, pasta de acervo. O tipo não muda
          depois; o executável muda quando a pessoa quiser — por isso editando
          sobram duas opções. Eram dois blocos de chips, um sobre o outro. */}
      {opcoesDeTipo.length > 1 && (
        <div role="group" aria-label="Tipo" className="segmentado">
          {opcoesDeTipo.map(({ chave, rotulo, nomeAcessivel, Icone }) => (
            <button
              key={chave}
              type="button"
              aria-pressed={atual === chave}
              aria-label={nomeAcessivel}
              onClick={() => {
                escolherTipo(chave)
              }}
              className="segmento"
            >
              <Icone size={15} aria-hidden className="shrink-0" />
              {rotulo}
            </button>
          ))}
        </div>
      )}

      {podeSerExecutavel && executavel && (
        <label className="text-poeira flex items-center gap-2 text-sm">
          Adormece com
          <input
            value={dias}
            onChange={(evento) => {
              setDias(evento.target.value)
            }}
            type="number"
            inputMode="numeric"
            min={0}
            max={DIAS_PARA_ADORMECER_MAXIMO}
            aria-label="Dias parada até adormecer"
            autoComplete="off"
            className="campo text-papel h-11 w-16 px-2 text-center"
          />
          dias parada
        </label>
      )}

      <div className={enfeite ? 'flex justify-center' : 'flex items-end gap-4'}>
        {!enfeite && (
          <label className="flex min-w-0 flex-1 flex-col">
            <span className="rotulo-de-secao">Nome</span>
            <input
              value={titulo}
              onChange={(evento) => {
                setTitulo(evento.target.value)
              }}
              maxLength={120}
              autoComplete="off"
              enterKeyHint="done"
              placeholder={
                tipo?.valor === 'acervo'
                  ? 'Vídeos, referências, fotos…'
                  : 'Uma área do que você sabe'
              }
              className="campo font-titulo h-13 px-4 text-lg"
            />
          </label>
        )}

        {/* Altura fixa no teto do que a amostra pode medir (o "Enorme" dos
            presets, ~127px, cabe dentro de 130): sem isto, trocar o
            Comprimento mudava a altura da própria linha e empurrava o resto
            do formulário para baixo — pedido do usuário, 17/09/2026. A
            amostra fica ancorada embaixo (`items-end`), como um livro em pé
            numa prateleira: cresce para cima, nunca desloca o que vem depois. */}
        <div className="flex items-end" style={{ height: `${String(REFERENCIA_DA_AMOSTRA_PX)}px` }}>
          <span
            aria-hidden
            className="lombada lombada--amostra cores-de-antes"
            data-estilo={geo.estilo}
            style={{
              ...geo.style,
              ...(detalheEscuro ? { '--fg': TOM_DO_DETALHE_DO_ENFEITE } : {}),
              width: `${String(larguraDaAmostra)}px`,
              height: `${String(alturaDaAmostra)}px`,
            }}
          >
            <span className="lombada-titulo">{tituloDaAmostra}</span>
            {acabamentoDoEnfeite?.dourado && <span className="lombada-filetes" />}
            {estilo === 'papel' && !enfeite && (
              <span className="lombada-contagem" aria-hidden>
                {contagem}
              </span>
            )}
            {geo.emblemaCabe && !enfeite && (
              <EmblemaDaLombada chave={ehPasta ? 'pasta' : emblema} />
            )}
          </span>
        </div>
      </div>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Cor</legend>
        <div role="radiogroup" aria-label="Cor" className="grid grid-cols-5 gap-x-2 gap-y-3">
          {PANOS.map((p) => (
            <label key={p.cor} className="pano-opcao">
              <input
                type="radio"
                name="cor"
                value={p.cor}
                checked={cor.toLowerCase() === p.cor.toLowerCase()}
                onChange={() => {
                  setCor(p.cor)
                }}
                className="sr-only"
              />
              <span className="pano-amostra" style={{ backgroundColor: p.cor }} aria-hidden />
              <span className="text-poeira text-center text-xs leading-tight">{p.nome}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Forma</legend>
        <div role="radiogroup" aria-label="Forma" className="grid grid-cols-2 gap-x-2">
          {FORMAS.map((f) => (
            <label key={f.chave} className="forma-opcao">
              <input
                type="radio"
                name="forma"
                value={f.chave}
                checked={estilo === f.chave}
                onChange={() => {
                  setEstilo(f.chave)
                }}
                className="sr-only"
              />
              <MiniaturaDaForma estilo={f.chave} cor={cor} intensidadeDaLuz={intensidadeDaLuz} />
              <span className="text-poeira text-sm leading-tight">{f.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Largura</legend>
        <div className="flex flex-wrap items-end gap-2">
          {/* O enfeite sempre mostra uma das quatro larguras: "automática" não diria qual é. */}
          {!enfeite && (
            <label className="pano-opcao">
              <input
                type="radio"
                name="largura"
                checked={larguraLombada === null}
                onChange={() => {
                  setLarguraLombada(null)
                }}
                className="sr-only"
              />
              <span className="pano-amostra largura-amostra largura-amostra--auto" aria-hidden>
                <Shuffle size={16} aria-hidden />
              </span>
              <span className="text-poeira text-xs leading-tight">Automática</span>
            </label>
          )}
          {LARGURAS.map((l) => (
            <label key={l.chave} className="pano-opcao">
              <input
                type="radio"
                name="largura"
                checked={larguraLombada === l.px}
                onChange={() => {
                  setLarguraLombada(l.px)
                }}
                className="sr-only"
              />
              <span
                className="pano-amostra largura-amostra"
                aria-hidden
                style={{ width: `${String(l.px)}px`, backgroundColor: cor }}
              />
              <span className="text-poeira text-xs leading-tight">{l.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="rotulo-de-secao">Comprimento</legend>
        <div className="flex flex-wrap items-end gap-2">
          {!enfeite && (
            <label className="pano-opcao">
              <input
                type="radio"
                name="comprimento"
                checked={comprimentoLombada === null}
                onChange={() => {
                  setComprimentoLombada(null)
                }}
                className="sr-only"
              />
              <span
                className="pano-amostra comprimento-amostra comprimento-amostra--auto"
                aria-hidden
              >
                <Shuffle size={16} aria-hidden />
              </span>
              <span className="text-poeira text-xs leading-tight">Automático</span>
            </label>
          )}
          {COMPRIMENTOS.map((c) => (
            <label key={c.chave} className="pano-opcao">
              <input
                type="radio"
                name="comprimento"
                checked={comprimentoLombada === c.percentual}
                onChange={() => {
                  setComprimentoLombada(c.percentual)
                }}
                className="sr-only"
              />
              <span
                className="pano-amostra comprimento-amostra"
                aria-hidden
                style={{
                  height: `${String(Math.round((c.percentual / 100) * REFERENCIA_DAS_OPCOES_PX))}px`,
                  backgroundColor: cor,
                }}
              />
              <span className="text-poeira text-xs leading-tight">{c.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* O móvel escondido que mede a fileira: a altura dela sai do mesmo CSS da estante,
          então a amostra não repete a conta. */}
      <div
        ref={medidor}
        aria-hidden
        className="movel cores-de-antes"
        data-prateleiras={prateleiras}
        style={
          {
            '--mv-prateleiras': prateleiras,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '200px',
            visibility: 'hidden',
            pointerEvents: 'none',
          } as CSSProperties
        }
      >
        <div className="movel-fila" />
      </div>

      <div className="barra-de-acao md:flex md:justify-end">
        <button
          type="submit"
          disabled={!podeEnviar}
          className={`${botao({ tipo: 'primario', largo: true })} md:w-auto md:min-w-44`}
        >
          {rotuloDeEnvio}
        </button>
      </div>
    </form>
  )
}

/** A lombada em miniatura: só a forma e a cor, sem título — é o que muda de uma opção para outra. */
function MiniaturaDaForma({
  estilo,
  cor,
  intensidadeDaLuz,
}: {
  estilo: EstiloDaLombada
  cor: string
  intensidadeDaLuz: number
}) {
  const geo = geometriaDaLombada({
    estilo,
    cor,
    titulo: '',
    largura: LARGURA_DA_MINIATURA_PX,
    altura: ALTURA_DA_MINIATURA_PX,
    intensidadeDaLuz,
  })
  return (
    <span
      aria-hidden
      className="lombada lombada--miniatura"
      data-estilo={geo.estilo}
      style={geo.style}
    />
  )
}
