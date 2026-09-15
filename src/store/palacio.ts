import { create } from 'zustand'

import {
  chaveDoLugar,
  INTENSIDADE_DA_LUZ_PADRAO,
  MINIMO_DE_PRATELEIRAS,
  moverLivroNaEstante,
  novoLivro,
  primeiroLugarLivre,
  vagasDepoisDeMover,
  type Conexao,
  type Livro,
  type NeuronioNaTela,
  type Ponto,
  type ProgressoDoMotor,
  type Vaga,
} from '@/core'
import { newId } from '@/lib/id'
import { engine } from '@/services/engine/workerEngine'

export interface NovoNeuronio {
  livroId: string
  titulo: string
  conteudo: string
}

export interface NovoLivro {
  titulo: string
  cor: string
  emblema: string | null
  larguraLombada: number | null
  comprimentoLombada: number | null
}

interface PalacioStore {
  livros: Livro[]
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  /** Os lugares deixados abertos — sem livro e sem enfeite. */
  vagas: Vaga[]
  /** Onde a Rede organizou cada neurônio da última vez, por significado. */
  posicoesDaRede: Record<string, Ponto>
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number

  carregado: boolean
  ocupado: boolean
  progresso: ProgressoDoMotor | null
  erro: string | null
  aviso: string | null

  carregar: () => Promise<void>
  /** Devolve o id criado, ou null se o motor não conseguiu. */
  criarNeuronio: (novo: NovoNeuronio) => Promise<string | null>
  editarNeuronio: (id: string, mudancas: NovoNeuronio) => Promise<boolean>
  /** `false` se o motor não conseguiu — quem confirmou fica onde está e lê o erro. */
  apagarNeuronio: (id: string) => Promise<boolean>
  /**
   * Nasce no `lugar` tocado (ou no buraco mais perto dele). Devolve o id do
   * livro criado, ou null se o motor não conseguiu.
   */
  criarLivro: (novo: NovoLivro, prateleira: number, lugar?: number) => Promise<string | null>
  editarLivro: (id: string, mudancas: NovoLivro) => Promise<boolean>
  apagarLivro: (id: string) => Promise<boolean>
  /** Põe o livro no lugar `(prateleira, lugar)`, empurrando se já houver livro ali. */
  moverLivro: (id: string, prateleira: number, lugar: number) => Promise<void>
  /**
   * Põe vários livros a partir de um lugar, cada um no próximo buraco, na mesma
   * ordem relativa que já tinham entre si — um por vez, reaproveitando
   * `moverLivro` (a mesma trava de "nunca perder livro" já vale ali).
   */
  moverVariosLivros: (ids: readonly string[], prateleira: number, lugar: number) => Promise<void>
  /** Tira o enfeite de um lugar sem livro: fica a madeira à mostra. */
  tirarEnfeite: (prateleira: number, lugar: number) => Promise<void>
  /** Devolve um enfeite a um lugar aberto. */
  porEnfeite: (prateleira: number, lugar: number) => Promise<void>
  /** Recusa diminuir se sobrar livro numa prateleira que deixaria de existir. */
  definirQuantidadeDePrateleiras: (quantidade: number) => Promise<void>
  /** Otimista, como o resto das preferências — a estante já lava na hora. */
  definirIntensidadeDaLuz: (valor: number) => Promise<void>
  /**
   * Solta um neurônio arrastado no ponto novo. Devolve o layout reagindo a
   * ele na hora — a tela anima o assentamento com o resultado, sem esperar
   * o próximo render para saber onde a vizinhança parou.
   */
  moverNeuronioNaRede: (id: string, ponto: Ponto) => Promise<Readonly<Record<string, Ponto>>>
  /** O aviso flutuante some — pelo tempo ou pelo toque. */
  dispensarAvisos: () => void
}

function mensagem(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export const usePalacio = create<PalacioStore>()((set, get) => {
  engine.aoProgredir((progresso) => {
    set({ progresso })
  })

  return {
    livros: [],
    neuronios: [],
    conexoes: [],
    vagas: [],
    posicoesDaRede: {},
    quantidadeDePrateleiras: MINIMO_DE_PRATELEIRAS,
    intensidadeDaLuz: INTENSIDADE_DA_LUZ_PADRAO,
    carregado: false,
    ocupado: false,
    progresso: null,
    erro: null,
    aviso: null,

    async carregar() {
      if (get().carregado) return
      set({ ocupado: true, erro: null })

      try {
        const estado = await engine.carregar()
        set({ ...estado, carregado: true })
      } catch (e) {
        set({ erro: mensagem(e) })
      } finally {
        set({ ocupado: false })
      }
    },

    async criarNeuronio(novo): Promise<string | null> {
      const id = newId()
      const agora = new Date()

      // Otimista: o neurônio aparece antes de o modelo dizer qualquer coisa.
      // O id vem daqui de propósito — é o que dispensa correlacionar depois.
      const provisorio: NeuronioNaTela = {
        id,
        livroId: novo.livroId,
        titulo: novo.titulo.trim(),
        conteudo: novo.conteudo.trim(),
        processando: true,
        createdAt: agora,
        updatedAt: agora,
      }

      set((s) => ({ neuronios: [...s.neuronios, provisorio], ocupado: true, erro: null }))

      try {
        const { neuronios, conexoes, posicoesDaRede } = await engine.criarNeuronio({
          id,
          ...novo,
        })
        // O palácio inteiro, não só o que foi escrito: um reprocessamento tira o
        // "processando…" dos outros também.
        set({ neuronios, conexoes, posicoesDaRede })
        return id
      } catch (e) {
        // Desfaz o otimismo: o Worker não conseguiu, então não fingimos que deu.
        set((s) => ({ neuronios: s.neuronios.filter((n) => n.id !== id), erro: mensagem(e) }))
        return null
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    async editarNeuronio(id, mudancas): Promise<boolean> {
      // Otimista também: o texto novo aparece marcado como processando, porque
      // editar refaz o embedding e as conexões podem mudar.
      set((s) => ({
        neuronios: s.neuronios.map((n) =>
          n.id === id
            ? {
                ...n,
                titulo: mudancas.titulo.trim(),
                conteudo: mudancas.conteudo.trim(),
                livroId: mudancas.livroId,
                processando: true,
              }
            : n,
        ),
        ocupado: true,
        erro: null,
      }))

      try {
        const { neuronios, conexoes, posicoesDaRede } = await engine.editarNeuronio({
          id,
          ...mudancas,
        })
        set({ neuronios, conexoes, posicoesDaRede })
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    async apagarNeuronio(id): Promise<boolean> {
      set({ ocupado: true, erro: null })

      try {
        const { neuronios, conexoes, posicoesDaRede } = await engine.apagarNeuronio(id)
        set({ neuronios, conexoes, posicoesDaRede })
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    dispensarAvisos() {
      set({ erro: null, aviso: null })
    },

    async criarLivro(novo, prateleira, lugar): Promise<string | null> {
      const { livros: antes, vagas: vagasAntes } = get()
      const input = { id: newId(), ...novo, prateleira, lugar }
      // A mesma regra do motor: o lugar tocado, ou o buraco mais perto dele se
      // outro livro já chegou ali — nascer nunca empurra ninguém.
      const ordem = primeiroLugarLivre(antes, prateleira, lugar ?? 0)
      if (ordem === null) {
        set({ aviso: `A prateleira ${String(prateleira + 1)} não tem lugar sem livro.` })
        return null
      }
      const provisorio = novoLivro(input, new Date(), ordem)

      // Otimista, como o neurônio: o livro já está na prateleira quando o painel
      // fecha, em vez de aparecer um instante depois.
      set({
        livros: [...antes, provisorio],
        vagas: vagasAntes.filter((v) => chaveDoLugar(v) !== chaveDoLugar(provisorio)),
        erro: null,
      })

      try {
        set(await engine.criarLivro(input))
        return input.id
      } catch (e) {
        set({ livros: antes, vagas: vagasAntes, erro: mensagem(e) })
        return null
      }
    },

    async editarLivro(id, mudancas): Promise<boolean> {
      const antes = get().livros
      set({
        livros: antes.map((l) =>
          l.id === id
            ? {
                ...l,
                titulo: mudancas.titulo.trim(),
                cor: mudancas.cor,
                emblema: mudancas.emblema,
                larguraLombada: mudancas.larguraLombada,
                comprimentoLombada: mudancas.comprimentoLombada,
              }
            : l,
        ),
        erro: null,
      })

      try {
        set({ livros: await engine.editarLivro({ id, ...mudancas }) })
        return true
      } catch (e) {
        set({ livros: antes, erro: mensagem(e) })
        return false
      }
    },

    // Sem otimismo aqui: apagar reprocessa o grafo, e a estante só pode perder o
    // livro junto com os fios que saíam dele.
    async apagarLivro(id): Promise<boolean> {
      set({ ocupado: true, erro: null })

      try {
        set(await engine.apagarLivro(id))
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    async moverLivro(id, prateleira, lugar) {
      const { livros: antes, vagas: vagasAntes } = get()
      const depois = moverLivroNaEstante(antes, id, prateleira, lugar)
      if (!depois) {
        set({ aviso: `A prateleira ${String(prateleira + 1)} não tem lugar sem livro.` })
        return
      }

      // Otimista: quem solta o livro tem que vê-lo já no lugar novo. Esperar o
      // banco faria o livro voltar à origem e só depois pular — parece erro.
      set({
        livros: depois,
        vagas: vagasDepoisDeMover(vagasAntes, antes, depois, id),
        erro: null,
      })

      try {
        set(await engine.moverLivro(id, prateleira, lugar))
      } catch (e) {
        set({ livros: antes, vagas: vagasAntes, erro: mensagem(e) })
      }
    },

    async tirarEnfeite(prateleira, lugar) {
      const antes = get().vagas
      set({ vagas: [...antes, { prateleira, ordem: lugar }], erro: null })

      try {
        set({ vagas: await engine.tirarEnfeite(prateleira, lugar) })
      } catch (e) {
        set({ vagas: antes, erro: mensagem(e) })
      }
    },

    async porEnfeite(prateleira, lugar) {
      const antes = get().vagas
      const chave = chaveDoLugar({ prateleira, ordem: lugar })
      set({ vagas: antes.filter((v) => chaveDoLugar(v) !== chave), erro: null })

      try {
        set({ vagas: await engine.porEnfeite(prateleira, lugar) })
      } catch (e) {
        set({ vagas: antes, erro: mensagem(e) })
      }
    },

    async moverVariosLivros(ids, prateleira, lugar) {
      // Preserva a ordem relativa entre quem foi selecionado — do primeiro ao
      // último na estante de hoje, e não na ordem em que foram tocados.
      const porId = new Map(get().livros.map((l) => [l.id, l] as const))
      const ordenados = [...ids].sort((a, b) => {
        const la = porId.get(a)
        const lb = porId.get(b)
        if (!la || !lb) return 0
        return la.prateleira - lb.prateleira || la.ordem - lb.ordem
      })

      // Cada um no próximo buraco a partir do lugar tocado: mover em grupo não
      // empurra ninguém que já estava na prateleira.
      let aPartirDe = lugar
      for (const id of ordenados) {
        const outros = get().livros.filter((l) => l.id !== id)
        const destino = primeiroLugarLivre(outros, prateleira, aPartirDe)
        if (destino === null) {
          set({ aviso: `A prateleira ${String(prateleira + 1)} não tem lugar sem livro.` })
          return
        }
        await get().moverLivro(id, prateleira, destino)
        aPartirDe = destino + 1
      }
    },

    async definirQuantidadeDePrateleiras(quantidade) {
      const antes = get().quantidadeDePrateleiras
      set({ quantidadeDePrateleiras: quantidade, erro: null })

      try {
        const gravada = await engine.definirQuantidadeDePrateleiras(quantidade)
        // O motor apaga as vagas de prateleira que deixou de existir; aqui também.
        set({
          quantidadeDePrateleiras: gravada,
          vagas: get().vagas.filter((v) => v.prateleira < gravada),
        })
      } catch (e) {
        set({ quantidadeDePrateleiras: antes, erro: mensagem(e) })
      }
    },

    async definirIntensidadeDaLuz(valor) {
      const antes = get().intensidadeDaLuz
      set({ intensidadeDaLuz: valor, erro: null })

      try {
        set({ intensidadeDaLuz: await engine.definirIntensidadeDaLuz(valor) })
      } catch (e) {
        set({ intensidadeDaLuz: antes, erro: mensagem(e) })
      }
    },

    async moverNeuronioNaRede(id, ponto) {
      try {
        const posicoesDaRede = await engine.moverNeuronioNaRede(id, ponto)
        set({ posicoesDaRede })
        return posicoesDaRede
      } catch (e) {
        // Sem otimismo para desfazer: nada mudou aqui ainda. A tela anima de
        // volta para o que já tinha, usando o que devolvemos.
        set({ erro: mensagem(e) })
        return get().posicoesDaRede
      }
    },
  }
})
