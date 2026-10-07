import { create } from 'zustand'

import {
  chaveDoLugar,
  clampDiasParaAdormecer,
  enfeitesSemLivroEmCima,
  estadoAoGuardar,
  INTENSIDADE_DA_LUZ_PADRAO,
  MINIMO_DE_PRATELEIRAS,
  MAPA_VAZIO,
  MODO_DA_BUSCA_PADRAO,
  MODO_DA_REDE_PADRAO,
  moverEnfeiteNaEstante,
  moverLivroNaEstante,
  novoLivro,
  primeiroLugarLivre,
  vagasDepoisDeMover,
  type AnexoNaTela,
  type Conexao,
  type CriarAnexoInput,
  type DadosDoEnfeite,
  type EnfeiteGravado,
  type EstadoDaIdeia,
  type EstiloDaLombada,
  type ImagemParaGuardar,
  type Livro,
  type MapaDoPalacio,
  type ModoDaBusca,
  type ModoDaRede,
  type NeuronioNaTela,
  type Ponto,
  type ProgressoDoMotor,
  type TipoDeLivro,
  type Vaga,
  type Vinculo,
} from '@/core'
import { newId } from '@/lib/id'
import { engine } from '@/services/engine/workerEngine'

export interface NovoNeuronio {
  /** `null`: "Automático" ao criar (o Porto decide); ao editar, continua no porto. */
  livroId: string | null
  titulo: string
  conteudo: string
}

export interface NovoLivro {
  titulo: string
  cor: string
  estilo: EstiloDaLombada
  emblema: string | null
  larguraLombada: number | null
  comprimentoLombada: number | null
  /** Só livro de conceitos: uma pasta nunca é executável (o motor garante). */
  executavel: boolean
  diasParaAdormecer: number
}

/** O neurônio que acabou de nascer, e as ideias adormecidas que ele acordou. */
export interface NeuronioCriado {
  neuronio: NeuronioNaTela
  acordadas: { id: string; titulo: string }[]
}

export interface NovoAnexo {
  livroId: string
  legenda: string
  conteudo: CriarAnexoInput['conteudo']
}

/**
 * Um botão dentro do aviso flutuante. É um destino, e não uma função: o aviso
 * mora no casco do app e sobrevive à tela que o pediu, então ele só leva a
 * algum lugar — hoje, sempre a uma busca na tela atual (`?guardar=`).
 */
export interface AcaoDoAviso {
  rotulo: string
  busca: string
}

interface PalacioStore {
  livros: Livro[]
  neuronios: NeuronioNaTela[]
  conexoes: Conexao[]
  /** Os itens das pastas de acervo. */
  anexos: AnexoNaTela[]
  /** Que conceitos cada anexo escolheu. */
  vinculos: Vinculo[]
  /** Os lugares deixados abertos — sem livro e sem enfeite. */
  vagas: Vaga[]
  /** Os enfeites que a pessoa definiu ou moveu; o resto é sorteado pelo lugar. */
  enfeites: EnfeiteGravado[]
  /** Onde a Rede organizou cada neurônio da última vez, por significado. */
  posicoesDaRede: Record<string, Ponto>
  /** O Mapa: ilhas por livro, gravadas. */
  mapa: MapaDoPalacio
  quantidadeDePrateleiras: number
  /** 0-100: o quanto a luz da sala lava a cor do pano em repouso. */
  intensidadeDaLuz: number
  /** 0-100: a mesma luz, sobre os enfeites. */
  intensidadeDaLuzDoEnfeite: number
  /** O último modo da busca que a pessoa escolheu. */
  modoDaBusca: ModoDaBusca
  /** O último modo da tela da Rede: a constelação ou o Mapa. */
  modoDaRede: ModoDaRede

  carregado: boolean
  ocupado: boolean
  progresso: ProgressoDoMotor | null
  erro: string | null
  aviso: string | null
  /** O botão do aviso, quando ele tem um (o "Mudar" depois de o Porto escolher). */
  acaoDoAviso: AcaoDoAviso | null

  carregar: () => Promise<void>
  /**
   * Devolve o neurônio já com o livro final — num "Automático", o que o Porto
   * escolheu, ou `null` se ele ficou no porto — ou null se o motor não conseguiu.
   */
  criarNeuronio: (novo: NovoNeuronio) => Promise<NeuronioCriado | null>
  editarNeuronio: (id: string, mudancas: NovoNeuronio) => Promise<boolean>
  /** `false` se o motor não conseguiu — quem confirmou fica onde está e lê o erro. */
  apagarNeuronio: (id: string) => Promise<boolean>
  /**
   * Põe o neurônio num livro de conceitos, sem reler o texto. `livroId` `null` é "Automático":
   * o motor escolhe pelo texto, fora dos executáveis. `false` se o motor não conseguiu.
   */
  guardarNeuronio: (id: string, livroId: string | null) => Promise<boolean>
  /**
   * O andamento de uma ideia num livro executável, e o link do resultado
   * quando ela está feita. Otimista. `false` se o motor não conseguiu.
   */
  definirEstado: (
    id: string,
    estado: EstadoDaIdeia,
    resultadoLink: string | null,
    resultadoImagem?: ImagemParaGuardar | null,
  ) => Promise<boolean>
  /**
   * Um toque numa ideia de livro executável: abrir a tela dela, ou o
   * "Acordar". Otimista — fora de livro executável não faz nada.
   */
  tocar: (id: string) => Promise<void>
  /**
   * Nasce no `lugar` tocado (ou no buraco mais perto dele). Devolve o id do
   * livro criado, ou null se o motor não conseguiu.
   */
  criarLivro: (
    novo: NovoLivro,
    prateleira: number,
    lugar?: number,
    tipo?: TipoDeLivro,
  ) => Promise<string | null>
  editarLivro: (id: string, mudancas: NovoLivro) => Promise<boolean>
  apagarLivro: (id: string) => Promise<boolean>
  /** Põe o livro no lugar `(prateleira, lugar)`, empurrando se já houver livro ali. */
  moverLivro: (id: string, prateleira: number, lugar: number) => Promise<void>
  /** Tira o enfeite de um lugar sem livro: fica a madeira à mostra. */
  tirarEnfeite: (prateleira: number, lugar: number) => Promise<void>
  /** Devolve um enfeite a um lugar aberto. */
  porEnfeite: (prateleira: number, lugar: number) => Promise<void>
  /** Grava o enfeite que a pessoa definiu. Otimista. `false` se o motor não conseguiu. */
  salvarEnfeite: (enfeite: EnfeiteGravado) => Promise<boolean>
  /**
   * Põe o enfeite de `origem` em `destino`, com as regras do livro. `dados` é a cara
   * que a tela mostrava nele — sorteada ou gravada. Otimista.
   */
  moverEnfeite: (
    origem: { prateleira: number; ordem: number },
    destino: { prateleira: number; ordem: number },
    dados: DadosDoEnfeite,
  ) => Promise<void>
  /** Recusa diminuir se sobrar livro numa prateleira que deixaria de existir. */
  definirQuantidadeDePrateleiras: (quantidade: number) => Promise<void>
  /** Otimista, como o resto das preferências — a estante já lava na hora. */
  definirIntensidadeDaLuz: (valor: number) => Promise<void>
  /** O mesmo, para a luz sobre os enfeites. */
  definirIntensidadeDaLuzDoEnfeite: (valor: number) => Promise<void>
  /** Otimista: a busca troca de modo na hora, e a escolha fica gravada para a próxima vez. */
  definirModoDaBusca: (modo: ModoDaBusca) => Promise<void>
  /** O mesmo, para a tela da Rede (constelação ou Mapa). */
  definirModoDaRede: (modo: ModoDaRede) => Promise<void>
  /** Desenha o Mapa inteiro de novo — só a pedido, em Ajustes. `false` se o motor não conseguiu. */
  reorganizarMapa: () => Promise<boolean>
  /**
   * A pessoa soltou uma ilha (ou um neurônio) no Mapa. Devolve o mapa como
   * ficou — a tela anima a chegada até lá — ou null se o motor não conseguiu.
   */
  moverIlhaNoMapa: (livroId: string, centro: Ponto) => Promise<MapaDoPalacio | null>
  moverNeuronioNoMapa: (id: string, ponto: Ponto) => Promise<MapaDoPalacio | null>
  /**
   * Solta um neurônio arrastado no ponto novo. Devolve o layout reagindo a
   * ele na hora — a tela anima o assentamento com o resultado, sem esperar
   * o próximo render para saber onde a vizinhança parou.
   */
  moverNeuronioNaRede: (id: string, ponto: Ponto) => Promise<Readonly<Record<string, Ponto>>>
  /**
   * Sem otimismo: a imagem ainda vai ser reduzida no Worker, e a medida dela só
   * se sabe depois. Devolve o id criado, ou null se o motor não conseguiu.
   */
  criarAnexo: (novo: NovoAnexo) => Promise<string | null>
  /**
   * A legenda, o endereço de um link ou a imagem de um item. `false` se o motor
   * não conseguiu.
   */
  editarAnexo: (
    id: string,
    legenda: string,
    url?: string,
    imagem?: { bytes: Uint8Array; mime: string },
  ) => Promise<boolean>
  apagarAnexo: (id: string) => Promise<boolean>
  /** Os bytes de uma imagem do acervo, para quem vai desenhá-la. Não é estado. */
  lerImagem: (anexoId: string, tamanho: 'miniatura' | 'inteira') => Promise<Uint8Array | null>
  /** Os bytes da imagem do resultado de uma ideia, para quem vai desenhá-la. Não é estado. */
  lerImagemDoResultado: (
    neuronioId: string,
    tamanho: 'miniatura' | 'inteira',
  ) => Promise<Uint8Array | null>
  /**
   * Os ids dos neurônios mais parecidos com a consulta, em ordem. Não é estado,
   * como `lerImagem`: quem pergunta guarda a resposta. Falhar é com quem chamou
   * — uma busca enquanto se digita não pode encher a tela de avisos de erro.
   */
  buscarPorSentido: (consulta: string) => Promise<string[]>
  /** Mostra um aviso flutuante, com ou sem botão. */
  avisar: (texto: string, acao?: AcaoDoAviso) => void
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
    anexos: [],
    vinculos: [],
    vagas: [],
    enfeites: [],
    posicoesDaRede: {},
    mapa: MAPA_VAZIO,
    quantidadeDePrateleiras: MINIMO_DE_PRATELEIRAS,
    intensidadeDaLuz: INTENSIDADE_DA_LUZ_PADRAO,
    intensidadeDaLuzDoEnfeite: INTENSIDADE_DA_LUZ_PADRAO,
    modoDaBusca: MODO_DA_BUSCA_PADRAO,
    modoDaRede: MODO_DA_REDE_PADRAO,
    carregado: false,
    ocupado: false,
    progresso: null,
    erro: null,
    aviso: null,
    acaoDoAviso: null,

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

    async criarNeuronio(novo): Promise<NeuronioCriado | null> {
      const id = newId()
      const agora = new Date()

      // Otimista: o neurônio aparece antes de o modelo dizer qualquer coisa.
      // O id vem daqui de propósito — é o que dispensa correlacionar depois.
      const livro = get().livros.find((l) => l.id === novo.livroId)
      const provisorio: NeuronioNaTela = {
        id,
        livroId: novo.livroId,
        titulo: novo.titulo.trim(),
        conteudo: novo.conteudo.trim(),
        processando: true,
        // A mesma regra do motor: nascer num livro executável é "para fazer".
        estado: estadoAoGuardar(undefined, livro),
        ultimoToque: agora,
        resultadoLink: null,
        resultadoImagem: null,
        createdAt: agora,
        updatedAt: agora,
      }

      // No topo, não no fim: a lista é "o mais recente primeiro" (ver
      // `porMaisRecente` no dexieRepo), e o otimismo tem que nascer já no
      // lugar onde o motor vai devolvê-lo — senão o neurônio aparece no fim e
      // salta para o topo quando a inferência termina.
      set((s) => ({ neuronios: [provisorio, ...s.neuronios], ocupado: true, erro: null }))

      try {
        const { neuronio, neuronios, conexoes, posicoesDaRede, vinculos, mapa, acordadas } =
          await engine.criarNeuronio({ id, ...novo })
        // O palácio inteiro, não só o que foi escrito: um reprocessamento tira o
        // "processando…" dos outros também — e o despertar mexeu no toque de
        // outras ideias.
        set({ neuronios, conexoes, posicoesDaRede, vinculos, mapa })
        return { neuronio, acordadas }
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
      const livro = get().livros.find((l) => l.id === mudancas.livroId)
      set((s) => ({
        neuronios: s.neuronios.map((n) =>
          n.id === id
            ? {
                ...n,
                titulo: mudancas.titulo.trim(),
                conteudo: mudancas.conteudo.trim(),
                livroId: mudancas.livroId,
                estado: estadoAoGuardar(n, livro),
                processando: true,
              }
            : n,
        ),
        ocupado: true,
        erro: null,
      }))

      try {
        const { neuronios, conexoes, posicoesDaRede, vinculos, mapa } = await engine.editarNeuronio(
          {
            id,
            ...mudancas,
          },
        )
        set({ neuronios, conexoes, posicoesDaRede, vinculos, mapa })
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
        const { neuronios, conexoes, posicoesDaRede, vinculos, mapa } =
          await engine.apagarNeuronio(id)
        set({ neuronios, conexoes, posicoesDaRede, vinculos, mapa })
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    avisar(texto, acao) {
      set({ aviso: texto, acaoDoAviso: acao ?? null })
    },

    dispensarAvisos() {
      set({ erro: null, aviso: null, acaoDoAviso: null })
    },

    async guardarNeuronio(id, livroId): Promise<boolean> {
      // Otimista: o neurônio já aparece no livro; a ponte chega com o motor.
      const anterior = get().neuronios.find((n) => n.id === id)
      const livro = get().livros.find((l) => l.id === livroId)
      // "Automático" (`null`) não sabe o destino até o motor ler o texto.
      set((s) => ({
        neuronios:
          livroId === null
            ? s.neuronios
            : s.neuronios.map((n) =>
                n.id === id ? { ...n, livroId, estado: estadoAoGuardar(n, livro) } : n,
              ),
        erro: null,
      }))

      try {
        const { neuronios, conexoes, mapa } = await engine.guardarNeuronio(id, livroId)
        set({ neuronios, conexoes, mapa })
        return true
      } catch (e) {
        set((s) => ({
          neuronios: s.neuronios.map((n) => (n.id === id && anterior ? anterior : n)),
          erro: mensagem(e),
        }))
        return false
      }
    },

    async tocar(id): Promise<void> {
      const ideia = get().neuronios.find((n) => n.id === id)
      const livro = get().livros.find((l) => l.id === ideia?.livroId)
      if (!ideia || !livro?.executavel) return
      set((s) => ({
        neuronios: s.neuronios.map((n) => (n.id === id ? { ...n, ultimoToque: new Date() } : n)),
      }))

      try {
        const tocada = await engine.tocar(id)
        if (tocada) {
          set((s) => ({ neuronios: s.neuronios.map((n) => (n.id === id ? tocada : n)) }))
        }
      } catch (e) {
        set({ erro: mensagem(e) })
      }
    },

    async definirEstado(id, estado, resultadoLink, resultadoImagem): Promise<boolean> {
      const anterior = get().neuronios.find((n) => n.id === id)
      set((s) => ({
        neuronios: s.neuronios.map((n) =>
          n.id === id
            ? {
                ...n,
                estado,
                resultadoLink: estado === 'feita' ? resultadoLink : n.resultadoLink,
                ultimoToque: new Date(),
              }
            : n,
        ),
        erro: null,
      }))

      try {
        // A imagem não tem otimismo: ela ainda vai ser reduzida no Worker, e as medidas
        // só se sabem depois. O estado e o link já estão na tela.
        set({
          neuronios: await engine.definirEstado(id, estado, resultadoLink, resultadoImagem),
        })
        return true
      } catch (e) {
        set((s) => ({
          neuronios: s.neuronios.map((n) => (n.id === id && anterior ? anterior : n)),
          erro: mensagem(e),
        }))
        return false
      }
    },

    async criarLivro(novo, prateleira, lugar, tipo = 'conceitos'): Promise<string | null> {
      const { livros: antes, vagas: vagasAntes, enfeites: enfeitesAntes } = get()
      const input = { id: newId(), ...novo, prateleira, lugar, tipo }
      // A mesma regra do motor: o lugar tocado, ou o buraco mais perto dele se
      // outro livro já chegou ali — nascer nunca empurra ninguém.
      const ordem = primeiroLugarLivre(antes, prateleira, lugar ?? 0)
      if (ordem === null) {
        set({
          acaoDoAviso: null,
          aviso: `A prateleira ${String(prateleira + 1)} não tem lugar sem livro.`,
        })
        return null
      }
      const provisorio = novoLivro(input, new Date(), ordem)

      // Otimista, como o neurônio: o livro já está na prateleira quando o painel
      // fecha, em vez de aparecer um instante depois.
      set({
        livros: [...antes, provisorio],
        vagas: vagasAntes.filter((v) => chaveDoLugar(v) !== chaveDoLugar(provisorio)),
        enfeites: enfeitesSemLivroEmCima(enfeitesAntes, [provisorio]),
        erro: null,
      })

      try {
        set(await engine.criarLivro(input))
        return input.id
      } catch (e) {
        set({ livros: antes, vagas: vagasAntes, enfeites: enfeitesAntes, erro: mensagem(e) })
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
                estilo: mudancas.estilo,
                emblema: mudancas.emblema,
                larguraLombada: mudancas.larguraLombada,
                comprimentoLombada: mudancas.comprimentoLombada,
                executavel: l.tipo === 'conceitos' && mudancas.executavel,
                diasParaAdormecer: clampDiasParaAdormecer(mudancas.diasParaAdormecer),
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
      const { livros: antes, vagas: vagasAntes, enfeites: enfeitesAntes } = get()
      const depois = moverLivroNaEstante(antes, id, prateleira, lugar)
      if (!depois) {
        set({
          acaoDoAviso: null,
          aviso: `A prateleira ${String(prateleira + 1)} não tem lugar sem livro.`,
        })
        return
      }

      // Otimista: quem solta o livro tem que vê-lo já no lugar novo. Esperar o
      // banco faria o livro voltar à origem e só depois pular — parece erro.
      set({
        livros: depois,
        vagas: vagasDepoisDeMover(vagasAntes, antes, depois, id),
        enfeites: enfeitesSemLivroEmCima(enfeitesAntes, depois),
        erro: null,
      })

      try {
        set(await engine.moverLivro(id, prateleira, lugar))
      } catch (e) {
        set({ livros: antes, vagas: vagasAntes, enfeites: enfeitesAntes, erro: mensagem(e) })
      }
    },

    async tirarEnfeite(prateleira, lugar) {
      const { vagas: antes, enfeites: enfeitesAntes } = get()
      const chave = chaveDoLugar({ prateleira, ordem: lugar })
      set({
        vagas: [...antes, { prateleira, ordem: lugar }],
        enfeites: enfeitesAntes.filter((e) => chaveDoLugar(e) !== chave),
        erro: null,
      })

      try {
        const { vagas, enfeites } = await engine.tirarEnfeite(prateleira, lugar)
        set({ vagas, enfeites })
      } catch (e) {
        set({ vagas: antes, enfeites: enfeitesAntes, erro: mensagem(e) })
      }
    },

    async porEnfeite(prateleira, lugar) {
      const antes = get().vagas
      const chave = chaveDoLugar({ prateleira, ordem: lugar })
      set({ vagas: antes.filter((v) => chaveDoLugar(v) !== chave), erro: null })

      try {
        set({ vagas: (await engine.porEnfeite(prateleira, lugar)).vagas })
      } catch (e) {
        set({ vagas: antes, erro: mensagem(e) })
      }
    },

    async salvarEnfeite(enfeite): Promise<boolean> {
      const { vagas: vagasAntes, enfeites: enfeitesAntes } = get()
      const chave = chaveDoLugar(enfeite)
      set({
        vagas: vagasAntes.filter((v) => chaveDoLugar(v) !== chave),
        enfeites: [...enfeitesAntes.filter((e) => chaveDoLugar(e) !== chave), enfeite],
        erro: null,
      })

      try {
        const { vagas, enfeites } = await engine.salvarEnfeite(enfeite)
        set({ vagas, enfeites })
        return true
      } catch (e) {
        set({ vagas: vagasAntes, enfeites: enfeitesAntes, erro: mensagem(e) })
        return false
      }
    },

    async moverEnfeite(origem, destino, dados) {
      const { livros: livrosAntes, vagas: vagasAntes, enfeites: enfeitesAntes } = get()
      const depois = moverEnfeiteNaEstante(
        { livros: livrosAntes, vagas: vagasAntes, enfeites: enfeitesAntes },
        origem,
        destino,
        dados,
      )
      if (!depois) {
        set({
          acaoDoAviso: null,
          aviso: `A prateleira ${String(destino.prateleira + 1)} não tem lugar sem livro.`,
        })
        return
      }

      // Otimista, como o livro: quem solta o enfeite o vê já no lugar novo.
      set({ ...depois, erro: null })

      try {
        set(await engine.moverEnfeite(origem, destino, dados))
      } catch (e) {
        set({
          livros: livrosAntes,
          vagas: vagasAntes,
          enfeites: enfeitesAntes,
          erro: mensagem(e),
        })
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
          enfeites: get().enfeites.filter((e) => e.prateleira < gravada),
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

    async definirIntensidadeDaLuzDoEnfeite(valor) {
      const antes = get().intensidadeDaLuzDoEnfeite
      set({ intensidadeDaLuzDoEnfeite: valor, erro: null })

      try {
        set({ intensidadeDaLuzDoEnfeite: await engine.definirIntensidadeDaLuzDoEnfeite(valor) })
      } catch (e) {
        set({ intensidadeDaLuzDoEnfeite: antes, erro: mensagem(e) })
      }
    },

    async definirModoDaRede(modo) {
      set({ modoDaRede: modo })
      try {
        await engine.definirModoDaRede(modo)
      } catch (e) {
        // Como no modo da busca: a tela já trocou; só não fica lembrado.
        set({ erro: mensagem(e) })
      }
    },

    async moverIlhaNoMapa(livroId, centro): Promise<MapaDoPalacio | null> {
      try {
        const mapa = await engine.moverIlhaNoMapa(livroId, centro)
        set({ mapa })
        return mapa
      } catch (e) {
        set({ erro: mensagem(e) })
        return null
      }
    },

    async moverNeuronioNoMapa(id, ponto): Promise<MapaDoPalacio | null> {
      try {
        const mapa = await engine.moverNeuronioNoMapa(id, ponto)
        set({ mapa })
        return mapa
      } catch (e) {
        set({ erro: mensagem(e) })
        return null
      }
    },

    async reorganizarMapa(): Promise<boolean> {
      set({ ocupado: true, erro: null })
      try {
        set({ mapa: await engine.reorganizarMapa() })
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false })
      }
    },

    async definirModoDaBusca(modo) {
      set({ modoDaBusca: modo })
      try {
        await engine.definirModoDaBusca(modo)
      } catch (e) {
        // Sem desfazer: a pessoa tocou no modo e a busca já está nele. Só
        // não fica lembrado para a próxima vez — e isso ela precisa saber.
        set({ erro: mensagem(e) })
      }
    },

    async criarAnexo(novo): Promise<string | null> {
      const id = newId()
      set({ ocupado: true, erro: null })

      try {
        set(await engine.criarAnexo({ id, ...novo }))
        return id
      } catch (e) {
        set({ erro: mensagem(e) })
        return null
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    async editarAnexo(id, legenda, url, imagem): Promise<boolean> {
      set({ ocupado: true, erro: null })

      try {
        set(await engine.editarAnexo({ id, legenda, url, imagem }))
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false, progresso: null })
      }
    },

    async apagarAnexo(id): Promise<boolean> {
      set({ ocupado: true, erro: null })

      try {
        set(await engine.apagarAnexo(id))
        return true
      } catch (e) {
        set({ erro: mensagem(e) })
        return false
      } finally {
        set({ ocupado: false })
      }
    },

    lerImagem(anexoId, tamanho) {
      return engine.lerImagem(anexoId, tamanho)
    },

    lerImagemDoResultado(neuronioId, tamanho) {
      return engine.lerImagemDoResultado(neuronioId, tamanho)
    },

    async buscarPorSentido(consulta) {
      try {
        return await engine.buscarPorSentido(consulta)
      } finally {
        // Se foi a busca que carregou o modelo, o fio de progresso subiu por
        // causa dela. Com uma escrita em curso o fio é dela, e fica.
        if (!get().ocupado) set({ progresso: null })
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
