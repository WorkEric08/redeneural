import { create } from 'zustand'

import {
  INTENSIDADE_DA_LUZ_PADRAO,
  MINIMO_DE_PRATELEIRAS,
  moverLivroNaEstante,
  novoLivro,
  type Conexao,
  type CriterioDeOrdenacao,
  type EtiquetaDePrateleira,
  type Livro,
  type NeuronioNaTela,
  type ProgressoDoMotor,
} from '@/core'
import { aplicarMudancasDeOrdem, ordenarPorCriterio } from '@/features/estante/ordenar'
import { newId } from '@/lib/id'
import { engine } from '@/services/engine/workerEngine'
import { lerTexto, nomeDoBackup, salvarTexto } from '@/services/native/arquivos'

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
}

interface PalacioStore {
  livros: Livro[]
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  quantidadeDePrateleiras: number
  etiquetas: EtiquetaDePrateleira[]
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
  reprocessarTudo: () => Promise<void>
  /** Devolve o id do livro criado, ou null se o motor não conseguiu. */
  criarLivro: (novo: NovoLivro, prateleira: number) => Promise<string | null>
  editarLivro: (id: string, mudancas: NovoLivro) => Promise<boolean>
  apagarLivro: (id: string) => Promise<boolean>
  /** Move o livro para `(prateleira, posicao)`, empurrando quem já está lá. */
  moverLivro: (id: string, prateleira: number, posicao: number) => Promise<void>
  /**
   * Move vários livros de uma vez para o fim de uma prateleira, na mesma
   * ordem relativa que já tinham entre si — um por vez, reaproveitando
   * `moverLivro` (a mesma trava de "nunca perder livro" já vale ali).
   */
  moverVariosLivros: (ids: readonly string[], prateleira: number) => Promise<void>
  /** Recusa diminuir se sobrar livro numa prateleira que deixaria de existir. */
  definirQuantidadeDePrateleiras: (quantidade: number) => Promise<void>
  /** Otimista, como o resto das preferências — a estante já lava na hora. */
  definirIntensidadeDaLuz: (valor: number) => Promise<void>
  /** Atalho de um toque: reordena cada prateleira, sem mudar quem está em qual. */
  ordenarEstante: (criterio: CriterioDeOrdenacao) => Promise<void>
  /** Texto vazio apaga a etiqueta daquela prateleira. */
  definirEtiqueta: (prateleira: number, texto: string) => Promise<void>
  exportar: () => Promise<void>
  importar: (arquivo: File) => Promise<void>
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
    quantidadeDePrateleiras: MINIMO_DE_PRATELEIRAS,
    etiquetas: [],
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
        const { neuronios, conexoes } = await engine.criarNeuronio({ id, ...novo })
        // O palácio inteiro, não só o que foi escrito: um reprocessamento tira o
        // "processando…" dos outros também.
        set({ neuronios, conexoes })
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
        const { neuronios, conexoes } = await engine.editarNeuronio({ id, ...mudancas })
        set({ neuronios, conexoes })
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
        const { neuronios, conexoes } = await engine.apagarNeuronio(id)
        set({ neuronios, conexoes })
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

    async reprocessarTudo() {
      set({ ocupado: true, erro: null })

      try {
        set(await engine.reprocessarTudo())
      } catch (e) {
        set({ erro: mensagem(e) })
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    async criarLivro(novo, prateleira): Promise<string | null> {
      const antes = get().livros
      const input = { id: newId(), ...novo, prateleira }
      // Nasce no fim da prateleira tocada — não desloca nenhum outro livro.
      const ordem = antes.filter((l) => l.prateleira === prateleira).length
      const provisorio = novoLivro(input, new Date(), ordem)

      // Otimista, como o neurônio: o livro já está na prateleira quando o painel
      // fecha, em vez de aparecer um instante depois.
      set({ livros: [...antes, provisorio], erro: null })

      try {
        set({ livros: await engine.criarLivro(input) })
        return input.id
      } catch (e) {
        set({ livros: antes, erro: mensagem(e) })
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

    async moverLivro(id, prateleira, posicao) {
      const antes = get().livros

      // Otimista: quem solta o livro tem que vê-lo já no lugar novo. Esperar o
      // banco faria o livro voltar à origem e só depois pular — parece erro.
      set({ livros: moverLivroNaEstante(antes, id, prateleira, posicao), erro: null })

      try {
        set({ livros: await engine.moverLivro(id, prateleira, posicao) })
      } catch (e) {
        set({ livros: antes, erro: mensagem(e) })
      }
    },

    async moverVariosLivros(ids, prateleira) {
      // Preserva a ordem relativa entre quem foi selecionado — do primeiro ao
      // último na estante de hoje, e não na ordem em que foram tocados.
      const porId = new Map(get().livros.map((l) => [l.id, l] as const))
      const ordenados = [...ids].sort((a, b) => {
        const la = porId.get(a)
        const lb = porId.get(b)
        if (!la || !lb) return 0
        return la.prateleira - lb.prateleira || la.ordem - lb.ordem
      })

      for (const id of ordenados) {
        const destino = get().livros.filter(
          (l) => l.prateleira === prateleira && l.id !== id,
        ).length
        await get().moverLivro(id, prateleira, destino)
      }
    },

    async definirQuantidadeDePrateleiras(quantidade) {
      const antes = get().quantidadeDePrateleiras
      set({ quantidadeDePrateleiras: quantidade, erro: null })

      try {
        set({ quantidadeDePrateleiras: await engine.definirQuantidadeDePrateleiras(quantidade) })
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

    async ordenarEstante(criterio) {
      const antes = get().livros
      // Otimista com a mesma função pura que o worker usa: a tela reordena na
      // hora, e o motor só confirma.
      const mudancas = ordenarPorCriterio(antes, get().neuronios, criterio)
      set({ livros: aplicarMudancasDeOrdem(antes, mudancas), erro: null })

      try {
        set({ livros: await engine.ordenarEstante(criterio) })
      } catch (e) {
        set({ livros: antes, erro: mensagem(e) })
      }
    },

    async definirEtiqueta(prateleira, texto) {
      const antes = get().etiquetas
      const limpo = texto.trim()
      const otimista = antes.filter((e) => e.prateleira !== prateleira)
      if (limpo !== '') otimista.push({ prateleira, texto: limpo })
      set({ etiquetas: otimista, erro: null })

      try {
        set({ etiquetas: await engine.definirEtiqueta(prateleira, texto) })
      } catch (e) {
        set({ etiquetas: antes, erro: mensagem(e) })
      }
    },

    async exportar() {
      set({ ocupado: true, erro: null, aviso: null })

      try {
        const destino = await salvarTexto(nomeDoBackup(), await engine.exportar())
        set({
          aviso: destino.tipo === 'download' ? 'Backup baixado.' : 'Backup pronto para guardar.',
        })
      } catch (e) {
        set({ erro: mensagem(e) })
      } finally {
        set({ ocupado: false })
      }
    },

    async importar(arquivo) {
      const antes = get().neuronios.length
      set({ ocupado: true, erro: null, aviso: null })

      try {
        const estado = await engine.importar(await lerTexto(arquivo))
        const novos = estado.neuronios.length - antes
        set({
          ...estado,
          aviso:
            novos > 0
              ? `Importado: +${String(novos)} neurônios (${String(estado.neuronios.length)} no total).`
              : 'Importado: nada de novo — o arquivo já estava aqui.',
        })
      } catch (e) {
        set({ erro: mensagem(e) })
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },
  }
})
