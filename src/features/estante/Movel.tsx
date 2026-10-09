import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

import {
  moverEnfeiteNaEstante,
  moverLivroNaEstante,
  type DadosDoEnfeite,
  type EnfeiteGravado,
  type Id,
  type Vaga,
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
  larguraDosLivrosDaPrateleira,
  montarPrateleiras,
  type Lugar,
} from './prateleiras'
import type { LivroNaEstante } from './resumo'
import { useMedidasDaFileira } from './useMedidasDaFileira'
import {
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
  onMover: (livroId: string, prateleira: number, lugar: number) => void
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
  function podeMover(livroId: string, prateleira: number, lugar: number): boolean {
    if (larguraUtil === null) return true
    const livros = estante.map((e) => e.livro)
    const depois = moverLivroNaEstante(livros, livroId, prateleira, lugar)
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
        if (!podeMover(livroId, alvo.prateleira, alvo.lugar)) {
          onSemEspaco(alvo.prateleira)
          return
        }
        onMover(livroId, alvo.prateleira, alvo.lugar)
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
        {prateleiras.map((p, prateleira) => (
          <div className="movel-vao" key={p.chave} data-prateleira={prateleira}>
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
                      (mesmoLugar(alvo, prateleira, lugar.indice) &&
                        !lugar.itens.some((i) => i.livro.id === gesto.livroId)) ||
                      undefined
                    }
                    style={{ width: `${String(lugar.largura)}px` }}
                  >
                    {lugar.itens.map((item) => (
                      <Lombada
                        key={item.livro.id}
                        item={item}
                        lugar={lugar.indice}
                        largura={larguraDoLivroGravado(item.livro)}
                        estado={estadoDe(item.livro.id)}
                        alvo={false}
                        ponte={(pontesDoFoco?.get(item.livro.id) ?? 0) > 0}
                        chegando={chegandoId === item.livro.id}
                        intensidadeDaLuz={intensidadeDaLuz}
                        iconesNosLivros={iconesNosLivros}
                        alturaDaFileira={alturaDaFileira}
                        manipular={manipular(item.livro.id)}
                      />
                    ))}
                  </div>
                ) : lugar.tipo === 'livro' ? (
                  <Lombada
                    key={lugar.item.livro.id}
                    item={lugar.item}
                    lugar={lugar.indice}
                    largura={lugar.largura}
                    estado={estadoDe(lugar.item.livro.id)}
                    alvo={
                      mesmoLugar(alvo, prateleira, lugar.indice) &&
                      gesto.livroId !== lugar.item.livro.id
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
                    alvo={mesmoLugar(alvo, prateleira, lugar.indice)}
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
