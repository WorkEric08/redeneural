import { create } from 'zustand'

import {
  aplicarOrdem,
  inserirNaOrdem,
  novoLivro,
  trocarNaOrdem,
  type Conexao,
  type Livro,
  type NeuronioNaTela,
  type ProgressoDoMotor,
} from '@/core'
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
}

interface PalacioStore {
  livros: Livro[]
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]

  carregado: boolean
  ocupado: boolean
  progresso: ProgressoDoMotor | null
  erro: string | null
  aviso: string | null

  carregar: () => Promise<void>
  /** Devolve o id criado, ou null se o motor não conseguiu. */
  criarNeuronio: (novo: NovoNeuronio) => Promise<string | null>
  editarNeuronio: (id: string, mudancas: NovoNeuronio) => Promise<boolean>
  apagarNeuronio: (id: string) => Promise<void>
  reprocessarTudo: () => Promise<void>
  /** Devolve o id do livro criado, ou null se o motor não conseguiu. */
  criarLivro: (novo: NovoLivro, posicao: number) => Promise<string | null>
  editarLivro: (id: string, mudancas: NovoLivro) => Promise<boolean>
  apagarLivro: (id: string) => Promise<boolean>
  /** Os dois livros trocam de lugar na estante; nenhum outro se mexe. */
  trocarLivros: (a: string, b: string) => Promise<void>
  exportar: () => Promise<void>
  importar: (arquivo: File) => Promise<void>
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

    async apagarNeuronio(id) {
      set({ ocupado: true, erro: null })

      try {
        const { neuronios, conexoes } = await engine.apagarNeuronio(id)
        set({ neuronios, conexoes })
      } catch (e) {
        set({ erro: mensagem(e) })
      } finally {
        set({ ocupado: false, progresso: null })
      }
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

    async criarLivro(novo, posicao): Promise<string | null> {
      const antes = get().livros
      const input = { id: newId(), ...novo, posicao }
      const provisorio = novoLivro(input, new Date())

      // Otimista, como o neurônio: o livro já está na prateleira quando o painel
      // fecha, em vez de aparecer um instante depois.
      set({
        livros: aplicarOrdem(
          [...antes, provisorio],
          inserirNaOrdem(
            antes.map((l) => l.id),
            provisorio.id,
            posicao,
          ),
        ),
        erro: null,
      })

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
          l.id === id ? { ...l, titulo: mudancas.titulo.trim(), cor: mudancas.cor } : l,
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

    async trocarLivros(a, b) {
      const antes = get().livros
      const ids = trocarNaOrdem(
        antes.map((l) => l.id),
        a,
        b,
      )

      // Otimista: quem solta o livro tem que vê-lo já no lugar novo. Esperar o
      // banco faria o livro voltar à origem e só depois pular — parece erro.
      set({ livros: aplicarOrdem(antes, ids), erro: null })

      try {
        set({ livros: await engine.reordenarLivros(ids) })
      } catch (e) {
        set({ livros: antes, erro: mensagem(e) })
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
