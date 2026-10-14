import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import {
  enfeitesSemLivroEmCima,
  entraNaPilha,
  moverEnfeiteNaEstante,
  moverLivroNaEstante,
  type DadosDoEnfeite,
  type LadoDoLivro,
  type PontoDeSoltura,
  type EnfeiteGravado,
  type Id,
  type Vaga,
  vagasDepoisDeMover,
} from '@/core'

import { Enfeite, FantasmaDoEnfeite } from './Enfeite'
import { Fantasma, Lombada, type EstadoDaLombada } from './Lombada'
import { sombraDoFundoEmPercentual } from './lombadaNoite'
import { lembrarMedidasDaEstante } from './medidasDaEstante'
import {
  cabeNaPrateleira,
  dadosDoEnfeite,
  extensaoDoLivro,
  LARGURA_MINIMA_DO_LIVRO,
  larguraDoLivroGravado,
  escalaDaPilha,
  larguraDosLivrosDaPrateleira,
  montarPrateleiras,
  type Lugar,
} from './prateleiras'
import type { LivroNaEstante } from './resumo'
import { useAnimarMovimento } from './useAnimarMovimento'
import { useMedidasDaFileira } from './useMedidasDaFileira'
import {
  mesmoAlvo,
  pontoDoAlvo,
  useManipularLivros,
  type LugarDaEstante,
  type ManipulacaoDaLombada,
} from './useManipularLivros'

interface Props {
  estante: readonly LivroNaEstante[]
  /** Os lugares deixados abertos — sem livro e sem enfeite. */
  vagas: readonly Vaga[]
  /** Os enfeites que a pessoa definiu ou moveu — vencem o sorteio do lugar. */
  enfeites: readonly EnfeiteGravado[]
  /** `pontesEntreLivros`: quantos fios de ponte ligam cada par de livros. */
  pontes: ReadonlyMap<Id, ReadonlyMap<Id, number>>
  /** O livro do painel aberto — espiando, no menu, sendo editado ou apagado. */
  selecionadoId: string | null
  /** O lugar sem livro cujo menu está aberto. */
  lugarEscolhido: LugarDaEstante | null
  /** O livro que está saindo da estante para abrir: o lugar dele fica como vão. */
  abrindoId: string | null
  chegandoId: string | null
  /** Quantas prateleiras o móvel tem — gravado, ajustável em Ajustes. */
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /** 0-100: a mesma luz, sobre os enfeites. */
  intensidadeDaLuzDoEnfeite: number
  /** O ícone da espécie no pé de cada lombada (Ajustes). */
  iconesNosLivros: boolean
  onEspiar: (livroId: string) => void
  onAcoes: (livroId: string) => void
  /** Põe o livro no lugar `(prateleira, lugar)` — mesma assinatura da store. */
  onMover: (livroId: string, prateleira: number, lugar: number, ponto?: PontoDeSoltura) => void
  onNovo: (prateleira: number, lugar: number) => void
  /** O livro não cabe inteiro entre as laterais daquela prateleira: nada foi feito. */
  onSemEspaco: (prateleira: number) => void
  onAcoesDoLugar: (prateleira: number, lugar: number) => void
  /** Põe o enfeite de `origem` em `destino` — mesma assinatura da store. */
  onMoverEnfeite: (
    origem: { prateleira: number; ordem: number },
    destino: { prateleira: number; ordem: number },
    dados: DadosDoEnfeite,
  ) => void
}

/**
 * Quanto o dedo precisa ficar sobre o mesmo ponto antes de a prateleira abrir lugar para o livro. Sem
 * essa espera, atravessar a prateleira depressa faria cada livro dela pular de um lado para o outro
 * a cada lugar cruzado.
 */
const ESPERA_DA_PREVIA_MS = 90

function mesmoLugar(a: LugarDaEstante | null, prateleira: number, lugar: number): boolean {
  return a !== null && a.prateleira === prateleira && a.lugar === lugar
}

/**
 * O móvel: a estante em que os livros moram.
 *
 * Duas laterais iguais de madeira, o trilho em cima, prateleiras sem sombra sobre
 * os livros, e a base que fecha a última prateleira.
 * A estrutura é CSS sobre duas texturas de madeira (`src/assets`); o fundo atrás dos
 * livros é liso. Acompanha a largura da tela, e é sempre escura, nos dois temas.
 *
 * Cada prateleira é uma fileira de lugares (ver `prateleiras.ts`): um livro
 * seu, um enfeite — a biblioteca que ainda não foi escrita — ou madeira nua.
 */
export function Movel({
  estante,
  vagas,
  enfeites,
  pontes,
  selecionadoId,
  lugarEscolhido,
  abrindoId,
  chegandoId,
  quantidadeDePrateleiras,
  intensidadeDaLuz,
  intensidadeDaLuzDoEnfeite,
  iconesNosLivros,
  onEspiar,
  onAcoes,
  onMover,
  onNovo,
  onSemEspaco,
  onAcoesDoLugar,
  onMoverEnfeite,
}: Props) {
  const movel = useRef<HTMLDivElement>(null)
  const { altura: alturaDaFileira, largura: larguraUtil } = useMedidasDaFileira(movel)
  // O recado para criar e editar um livro: quanto a fileira tem, para o livro não estourar as laterais.
  useEffect(() => {
    if (larguraUtil !== null) lembrarMedidasDaEstante({ larguraUtil, alturaDaFileira })
  }, [larguraUtil, alturaDaFileira])
  const prateleiras = useMemo(
    () =>
      montarPrateleiras(
        estante,
        vagas,
        quantidadeDePrateleiras,
        larguraUtil ?? undefined,
        enfeites,
        alturaDaFileira,
      ),
    [estante, vagas, quantidadeDePrateleiras, larguraUtil, enfeites, alturaDaFileira],
  )

  // Quanto cada livro deitado se estende na fileira: a largura do lugar dele, que entra na conta
  // de caber entre as laterais.
  const porId = useMemo(() => new Map(estante.map((e) => [e.livro.id, e])), [estante])
  const extensaoDe = (livro: { id: string; larguraLombada: number | null }): number => {
    const item = porId.get(livro.id)
    return item ? extensaoDoLivro(item, alturaDaFileira) : larguraDoLivroGravado(livro)
  }

  function enfeiteEm(prateleira: number, lugar: number) {
    const achado = prateleiras[prateleira]?.lugares.find((l) => l.indice === lugar)
    return achado?.tipo === 'enfeite' ? achado : undefined
  }

  // As laterais são sólidas: um livro só vai (ou nasce) numa prateleira onde os
  // livros dela continuam cabendo inteiros. Os enfeites cedem espaço até a
  // largura mínima, então o que decide é a soma dos livros.
  function podeMover(
    livroId: string,
    prateleira: number,
    lugar: number,
    ponto?: PontoDeSoltura,
  ): boolean {
    if (larguraUtil === null) return true
    const livros = estante.map((e) => e.livro)
    const depois = moverLivroNaEstante(livros, livroId, prateleira, lugar, ponto)
    if (!depois) return true // sem lugar livre: quem recusa é a store, com o aviso dela
    return cabeNaPrateleira(
      larguraDosLivrosDaPrateleira(livros, prateleira, extensaoDe),
      larguraDosLivrosDaPrateleira(depois, prateleira, extensaoDe),
      larguraUtil,
    )
  }

  // O enfeite que empurra livros também só entra onde os livros continuam cabendo.
  function podeMoverEnfeite(
    origem: { prateleira: number; lugar: number },
    destino: { prateleira: number; lugar: number },
    dados: DadosDoEnfeite,
  ): boolean {
    if (larguraUtil === null) return true
    const livros = estante.map((e) => e.livro)
    const depois = moverEnfeiteNaEstante(
      { livros, vagas: [], enfeites: [] },
      { prateleira: origem.prateleira, ordem: origem.lugar },
      { prateleira: destino.prateleira, ordem: destino.lugar },
      dados,
    )
    if (!depois) return true // sem lugar livre: quem recusa é a store, com o aviso dela
    return cabeNaPrateleira(
      larguraDosLivrosDaPrateleira(livros, destino.prateleira, extensaoDe),
      larguraDosLivrosDaPrateleira(depois.livros, destino.prateleira, extensaoDe),
      larguraUtil,
    )
  }

  function podeCriar(prateleira: number): boolean {
    if (larguraUtil === null) return true
    const livros = estante.map((e) => e.livro)
    const antes = larguraDosLivrosDaPrateleira(livros, prateleira, extensaoDe)
    return cabeNaPrateleira(antes, antes + LARGURA_MINIMA_DO_LIVRO + 1, larguraUtil)
  }
  const { gesto, lugarSegurado, manipular, manipularLugar, registrarFantasma } = useManipularLivros(
    {
      onEspiar,
      onAcoes,
      onMover: (livroId, alvo) => {
        if (!podeMover(livroId, alvo.prateleira, alvo.lugar, pontoDoAlvo(alvo))) {
          onSemEspaco(alvo.prateleira)
          return
        }
        onMover(livroId, alvo.prateleira, alvo.lugar, pontoDoAlvo(alvo))
      },
      onTocarLugar: ({ prateleira, lugar }) => {
        if (!podeCriar(prateleira)) {
          onSemEspaco(prateleira)
          return
        }
        onNovo(prateleira, lugar)
      },
      onAcoesDoLugar: ({ prateleira, lugar }) => {
        onAcoesDoLugar(prateleira, lugar)
      },
      onMoverEnfeite: (origem, alvo) => {
        const enfeite = enfeiteEm(origem.prateleira, origem.lugar)
        if (!enfeite) return
        const dados = dadosDoEnfeite(enfeite)
        if (!podeMoverEnfeite(origem, alvo, dados)) {
          onSemEspaco(alvo.prateleira)
          return
        }
        onMoverEnfeite(
          { prateleira: origem.prateleira, ordem: origem.lugar },
          { prateleira: alvo.prateleira, ordem: alvo.lugar },
          dados,
        )
      },
    },
  )

  // Quem está na mão manda: segurar outro livro com um painel aberto acende as
  // pontes do que está na mão, não as do painel.
  const focoId = gesto.livroId ?? selecionadoId
  const pontesDoFoco = focoId === null ? undefined : pontes.get(focoId)
  const naMao =
    gesto.fase === 'arrastando' ? estante.find((e) => e.livro.id === gesto.livroId) : undefined
  const alvo = gesto.fase === 'arrastando' ? gesto.alvo : null
  const enfeiteNaMao =
    gesto.fase === 'arrastando' && gesto.enfeite
      ? enfeiteEm(gesto.enfeite.prateleira, gesto.enfeite.lugar)
      : undefined

  // Antes de soltar, a pessoa já vê se o destino recusaria: a mesma conta que o solto faz (sem lugar
  // livre, ou os livros da prateleira deixando de caber), só que enquanto o dedo ainda anda.
  const recusado = (() => {
    if (gesto.fase !== 'arrastando' || alvo === null) return false
    if (gesto.livroId !== null) {
      const livros = estante.map((e) => e.livro)
      if (
        moverLivroNaEstante(
          livros,
          gesto.livroId,
          alvo.prateleira,
          alvo.lugar,
          pontoDoAlvo(alvo),
        ) === null
      )
        return true
      return !podeMover(gesto.livroId, alvo.prateleira, alvo.lugar, pontoDoAlvo(alvo))
    }
    if (enfeiteNaMao && gesto.enfeite) {
      const dados = dadosDoEnfeite(enfeiteNaMao)
      const origem = { prateleira: gesto.enfeite.prateleira, ordem: gesto.enfeite.lugar }
      const livros = estante.map((e) => e.livro)
      const depois = moverEnfeiteNaEstante(
        { livros, vagas: [], enfeites: [] },
        origem,
        { prateleira: alvo.prateleira, ordem: alvo.lugar },
        dados,
      )
      if (depois === null) return true
      return !podeMoverEnfeite(gesto.enfeite, alvo, dados)
    }
    return false
  })()

  // A prévia ao vivo: o livro na mão já está no lugar onde cairia, e a prateleira que o recebe (e a de
  // onde ele saiu) se reorganizam para isso — a mesma conta que a soltura vai gravar. Espera o dedo
  // assentar (`ESPERA_DA_PREVIA_MS`) e não se faz quando o destino seria recusado.
  const alvoDoLivro =
    gesto.fase === 'arrastando' && gesto.livroId !== null && !recusado ? alvo : null
  const [alvoDaPrevia, setAlvoDaPrevia] = useState<LugarDaEstante | null>(null)
  useEffect(() => {
    const espera = window.setTimeout(
      () => {
        setAlvoDaPrevia(alvoDoLivro)
      },
      alvoDoLivro === null ? 0 : ESPERA_DA_PREVIA_MS,
    )
    return () => {
      window.clearTimeout(espera)
    }
  }, [alvoDoLivro])

  const previa = useMemo(() => {
    if (gesto.fase !== 'arrastando' || gesto.livroId === null || alvoDaPrevia === null) return null
    const antes = estante.map((e) => e.livro)
    const depois = moverLivroNaEstante(
      antes,
      gesto.livroId,
      alvoDaPrevia.prateleira,
      alvoDaPrevia.lugar,
      pontoDoAlvo(alvoDaPrevia),
    )
    if (!depois) return null
    const novos = new Map(depois.map((l) => [l.id, l]))
    return {
      estante: estante.map((e) => ({ ...e, livro: novos.get(e.livro.id) ?? e.livro })),
      vagas: vagasDepoisDeMover(vagas, depois),
      enfeites: enfeitesSemLivroEmCima(enfeites, depois),
    }
  }, [gesto.fase, gesto.livroId, alvoDaPrevia, estante, vagas, enfeites])

  const prateleirasVistas = useMemo(
    () =>
      previa === null
        ? prateleiras
        : montarPrateleiras(
            previa.estante,
            previa.vagas,
            quantidadeDePrateleiras,
            larguraUtil ?? undefined,
            previa.enfeites,
            alturaDaFileira,
          ),
    [previa, prateleiras, quantidadeDePrateleiras, larguraUtil, alturaDaFileira],
  )
  useAnimarMovimento(movel, prateleirasVistas, gesto.fase === 'arrastando')

  // Com a prévia no ar o livro já está onde vai cair: o anel, a barra do lado e a linha de inserção
  // (que dizem "vai cair aqui" antes da prévia chegar) saem.
  const previaNoAr = previa !== null && alvo !== null && mesmoAlvo(alvoDaPrevia, alvo)
  const destaque = previaNoAr ? null : alvo

  // Onde, numa pilha, o livro na mão entraria — para a linha de inserção. `antesDe` é o livro logo
  // acima do ponto (ou `null`, o topo). Só quando soltar ali entra na pilha de fato (uma pilha
  // cheia, ou um livro de pé, tomam o lugar e empurram) e muda algo (soltar no andar em que o livro
  // já está é desistir).
  function insercaoDaPilha(
    prateleira: number,
    lugar: Extract<Lugar, { tipo: 'pilha' }>,
  ): { antesDe: string | null } | null {
    if (gesto.fase !== 'arrastando' || gesto.livroId === null || destaque === null) return null
    if (!mesmoLugar(destaque, prateleira, lugar.indice) || destaque.posicao === undefined)
      return null
    const livros = estante.map((e) => e.livro)
    if (!entraNaPilha(livros, gesto.livroId, prateleira, lugar.indice, destaque.posicao))
      return null
    const meu = lugar.itens.findIndex((i) => i.livro.id === gesto.livroId)
    if (meu >= 0 && destaque.posicao === meu) return null
    const outros = lugar.itens.filter((i) => i.livro.id !== gesto.livroId)
    return { antesDe: outros[destaque.posicao]?.livro.id ?? null }
  }

  // O lado em que o dedo está sobre uma pilha que **não** recebe o livro na mão (cheia, ou o livro é
  // de pé): aí soltar é cair na fresta ao lado dela, e a barra mostra de que lado. Quando ela recebe,
  // quem mostra é a linha de inserção.
  function ladoDaPilha(
    prateleira: number,
    lugar: Extract<Lugar, { tipo: 'pilha' }>,
  ): LadoDoLivro | undefined {
    if (gesto.fase !== 'arrastando' || gesto.livroId === null || destaque === null) return undefined
    if (!mesmoLugar(destaque, prateleira, lugar.indice)) return undefined
    const livros = estante.map((e) => e.livro)
    if (entraNaPilha(livros, gesto.livroId, prateleira, lugar.indice, destaque.posicao))
      return undefined
    return destaque.lado
  }

  function estadoDe(livroId: string): EstadoDaLombada {
    if (abrindoId === livroId) return 'vazio'
    if (gesto.livroId === livroId) return gesto.fase === 'arrastando' ? 'vazio' : 'erguido'
    return selecionadoId === livroId ? 'escolhido' : 'repouso'
  }

  return (
    // O número de prateleiras é o divisor de que a folha precisa para a estante
    // se medir pela tela (ver .movel-fila em index.css).
    <div
      ref={movel}
      className="movel cores-de-antes"
      data-prateleiras={prateleiras.length}
      data-recusado={recusado || undefined}
      style={{ '--mv-prateleiras': prateleiras.length } as CSSProperties}
    >
      <span className="movel-cornija" aria-hidden />

      <div
        className="movel-corpo"
        style={
          {
            '--mv-sombra-do-fundo': `${String(sombraDoFundoEmPercentual(intensidadeDaLuzDoEnfeite))}%`,
          } as CSSProperties
        }
      >
        {prateleirasVistas.map((p, prateleira) => (
          <div
            className="movel-vao"
            key={p.chave}
            data-prateleira={prateleira}
            data-recusa={(recusado && alvo?.prateleira === prateleira) || undefined}
          >
            <div className="movel-fila">
              {p.lugares.map((lugar) =>
                lugar.tipo === 'pilha' ? (
                  // Livros deitados, de baixo para cima. O lugar (`data-lugar`) é da pilha: o arrasto
                  // lê dela onde o livro na mão vai cair, e as regras de `ordem.ts` decidem se ele sobe.
                  <div
                    key={`pilha-${String(lugar.indice)}`}
                    className="pilha"
                    data-lugar={lugar.indice}
                    data-alvo={
                      (mesmoLugar(destaque, prateleira, lugar.indice) &&
                        !lugar.itens.some((i) => i.livro.id === gesto.livroId)) ||
                      undefined
                    }
                    data-lado={ladoDaPilha(prateleira, lugar)}
                    style={{ width: `${String(lugar.largura)}px` }}
                  >
                    {lugar.itens.map((item, _, itens) => (
                      <Fragment key={item.livro.id}>
                        {insercaoDaPilha(prateleira, lugar)?.antesDe === item.livro.id && (
                          <span className="pilha-insercao" aria-hidden />
                        )}
                        <Lombada
                          item={item}
                          lugar={lugar.indice}
                          largura={
                            Math.round(
                              larguraDoLivroGravado(item.livro) *
                                escalaDaPilha(
                                  itens.map((i) => larguraDoLivroGravado(i.livro)),
                                  alturaDaFileira,
                                ) *
                                10,
                            ) / 10
                          }
                          estado={estadoDe(item.livro.id)}
                          alvo={false}
                          ponte={(pontesDoFoco?.get(item.livro.id) ?? 0) > 0}
                          chegando={chegandoId === item.livro.id}
                          intensidadeDaLuz={intensidadeDaLuz}
                          iconesNosLivros={iconesNosLivros}
                          alturaDaFileira={alturaDaFileira}
                          manipular={manipular(item.livro.id)}
                        />
                      </Fragment>
                    ))}
                    {insercaoDaPilha(prateleira, lugar)?.antesDe === null && (
                      <span className="pilha-insercao" aria-hidden />
                    )}
                  </div>
                ) : lugar.tipo === 'livro' ? (
                  <Lombada
                    key={lugar.item.livro.id}
                    item={lugar.item}
                    lugar={lugar.indice}
                    largura={lugar.largura}
                    estado={estadoDe(lugar.item.livro.id)}
                    alvo={
                      mesmoLugar(destaque, prateleira, lugar.indice) &&
                      gesto.livroId !== lugar.item.livro.id
                    }
                    lado={
                      mesmoLugar(destaque, prateleira, lugar.indice) ? destaque?.lado : undefined
                    }
                    ponte={(pontesDoFoco?.get(lugar.item.livro.id) ?? 0) > 0}
                    chegando={chegandoId === lugar.item.livro.id}
                    intensidadeDaLuz={intensidadeDaLuz}
                    iconesNosLivros={iconesNosLivros}
                    alturaDaFileira={alturaDaFileira}
                    manipular={manipular(lugar.item.livro.id)}
                  />
                ) : (
                  <LugarSemLivro
                    key={`lugar-${String(lugar.indice)}`}
                    lugar={lugar}
                    prateleira={prateleira}
                    alturaDaFileira={alturaDaFileira}
                    intensidadeDaLuz={intensidadeDaLuzDoEnfeite}
                    alvo={mesmoLugar(destaque, prateleira, lugar.indice)}
                    realce={
                      mesmoLugar(lugarSegurado, prateleira, lugar.indice) ||
                      mesmoLugar(lugarEscolhido, prateleira, lugar.indice) ||
                      mesmoLugar(gesto.enfeite, prateleira, lugar.indice)
                    }
                    naMao={
                      gesto.fase === 'arrastando' &&
                      mesmoLugar(gesto.enfeite, prateleira, lugar.indice)
                    }
                    manipular={manipularLugar(
                      { prateleira, lugar: lugar.indice },
                      lugar.tipo === 'enfeite',
                    )}
                  />
                ),
              )}
            </div>
            <span className="movel-tabua" aria-hidden />
          </div>
        ))}

        <span className="movel-pilastra movel-pilastra--esq" aria-hidden />
        <span className="movel-pilastra movel-pilastra--dir" aria-hidden />
      </div>

      <span className="movel-base" aria-hidden>
        <span className="movel-base-painel" />
      </span>
      <span className="movel-luar" aria-hidden />

      {naMao && gesto.origem && (
        <Fantasma item={naMao} caixa={gesto.origem} registrar={registrarFantasma} />
      )}
      {enfeiteNaMao && gesto.origem && (
        <FantasmaDoEnfeite
          lugar={enfeiteNaMao}
          caixa={gesto.origem}
          registrar={registrarFantasma}
        />
      )}
    </div>
  )
}

/**
 * Um lugar sem livro. A coluna inteira da fileira, e não só a lombada: tocar
 * acima de um enfeite baixo ainda é tocar no lugar dele.
 *
 * O enfeite continua sem título — mas é da pessoa: tocar
 * escreve um livro exatamente ali, segurar deixa tirá-lo ou devolvê-lo.
 */
function LugarSemLivro({
  lugar,
  prateleira,
  alturaDaFileira,
  intensidadeDaLuz,
  alvo,
  realce,
  naMao,
  manipular,
}: {
  lugar: Exclude<Lugar, { tipo: 'livro' | 'pilha' }>
  prateleira: number
  /** A altura da fileira em px, para a forma do enfeite se medir. */
  alturaDaFileira: number
  /** A luz sobre o enfeite deste lugar. */
  intensidadeDaLuz: number
  /** O livro na mão vai cair aqui. */
  alvo: boolean
  /** Segurado agora, ou com o menu aberto. */
  realce: boolean
  /** O enfeite deste lugar está na mão de quem arrasta: fica só o vão. */
  naMao: boolean
  manipular: ManipulacaoDaLombada
}) {
  const nome = `Prateleira ${String(prateleira + 1)}, lugar ${String(lugar.indice + 1)}`
  const oQueTem = lugar.tipo === 'enfeite' ? 'enfeite' : 'vazio'

  return (
    <button
      type="button"
      data-lugar={lugar.indice}
      data-alvo={alvo || undefined}
      data-realce={realce || undefined}
      className={`lugar lugar--${lugar.tipo}`}
      style={{ width: `${String(lugar.largura)}px` }}
      aria-label={`${nome}, ${oQueTem}: criar um livro aqui`}
      {...manipular}
    >
      {lugar.tipo === 'enfeite' && (
        <Enfeite
          lugar={lugar}
          alturaDaFileira={alturaDaFileira}
          intensidadeDaLuz={intensidadeDaLuz}
          naMao={naMao}
        />
      )}
    </button>
  )
}
