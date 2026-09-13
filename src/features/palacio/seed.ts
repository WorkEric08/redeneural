import type { Livro, Neuronio, PalacioRepo } from '@/core'

/**
 * Seed de exemplo — três livros que existem para exercitar o motor de conexões,
 * não para ilustrar a UI. Os textos foram escolhidos para gerar pontes óbvias
 * entre livros diferentes (cache ↔ memória de trabalho, prática deliberada ↔
 * neuroplasticidade), que é o que a Fase 4 precisa validar.
 *
 * Ids e datas são fixos de propósito: rodar o seed duas vezes não duplica nada.
 *
 * As cores são pano de encadernação — ver a paleta de lombadas em index.css.
 */

const T0 = new Date('2026-01-01T12:00:00.000Z')

const PSICOLOGIA = '382f8b34-7e8e-4074-ab84-ad134110b691'
const PROGRAMACAO = 'b5fd3212-5d84-4311-af05-4c88dd388516'
const MUSICA = '8ef85fba-622d-458c-825c-ce1c1fae647d'

// A `ordem` repete a que a estante mostrava antes de guardar ordem — mesma data,
// desempate pelo id —, para um aparelho novo e um migrado verem a mesma estante.
export const SEED_LIVROS: Livro[] = [
  { id: PSICOLOGIA, titulo: 'Psicologia', cor: '#7b6ae0', ordem: 0, createdAt: T0 },
  { id: PROGRAMACAO, titulo: 'Programação', cor: '#3e9a93', ordem: 2, createdAt: T0 },
  { id: MUSICA, titulo: 'Música', cor: '#c8734a', ordem: 1, createdAt: T0 },
]

function neuronio(id: string, livroId: string, titulo: string, conteudo: string): Neuronio {
  return { id, livroId, titulo, conteudo, embedding: null, createdAt: T0, updatedAt: T0 }
}

export const SEED_NEURONIOS: Neuronio[] = [
  neuronio(
    '73c21e8d-fa72-4035-896a-4f4bad4c046e',
    PSICOLOGIA,
    'Neuroplasticidade',
    'O cérebro reorganiza suas próprias conexões conforme é usado. Repetir uma prática reforça as sinapses envolvidas; abandoná-la enfraquece. Não é uma metáfora: a estrutura física muda.',
  ),
  neuronio(
    '9a23524c-ca96-4006-965f-6629a8dc0682',
    PSICOLOGIA,
    'Memória de trabalho',
    'O espaço mental onde a informação fica disponível enquanto você a manipula. É pequeno e rápido, guarda poucos itens de cada vez, e é o gargalo de quase toda tarefa cognitiva difícil.',
  ),
  neuronio(
    'ffd40481-e13f-4a16-a3db-9885e536c651',
    PSICOLOGIA,
    'Viés de confirmação',
    'A tendência a procurar e lembrar aquilo que confirma o que já se acredita, ignorando o resto. Não corrige sozinho: quanto mais informação disponível, mais fácil escolher só a parte conveniente.',
  ),
  neuronio(
    '743fdedd-7f76-40e8-bea7-89140ff8a8d0',
    PROGRAMACAO,
    'Cache',
    'Guardar perto o resultado que custou caro para calcular, apostando que ele será pedido de novo. O espaço é pequeno e rápido, então decidir o que descartar importa tanto quanto decidir o que guardar.',
  ),
  neuronio(
    'f9d51add-7a6b-415e-9df8-a7cef6241a97',
    PROGRAMACAO,
    'Recursão',
    'Resolver um problema descrevendo-o em termos de uma versão menor de si mesmo, até chegar num caso base trivial. A estrutura se repete em escalas diferentes.',
  ),
  neuronio(
    '1908b9bf-1519-4baf-afbe-11dfde084bad',
    PROGRAMACAO,
    'Refatoração',
    'Mudar a forma do código sem mudar o que ele faz, para que a próxima alteração fique mais barata. É manutenção da estrutura, feita continuamente e em passos pequenos.',
  ),
  neuronio(
    '10c608e4-fb21-47d0-b406-9a7e4e950a5f',
    MUSICA,
    'Prática deliberada',
    'Repetir de propósito o trecho que ainda não sai, devagar e com atenção ao erro, em vez de tocar de novo o que já se sabe. É desconfortável — e é o que de fato reescreve o gesto.',
  ),
  neuronio(
    'cb33d85b-2b9e-454d-b312-49af47d11bde',
    MUSICA,
    'Forma e repetição',
    'Uma peça se organiza repetindo seções em escalas diferentes: um motivo dentro de uma frase, a frase dentro de um tema, o tema dentro do movimento. Reconhecer a estrutura é o que permite decorar.',
  ),
  neuronio(
    '168941e9-1c8b-4786-9038-8324dd66c4eb',
    MUSICA,
    'Improvisação',
    'Compor em tempo real dentro de restrições combinadas. Depende de ter vocabulário automatizado o bastante para não ocupar a atenção, deixando-a livre para escutar o que os outros estão tocando.',
  ),
]

/** Popula o palácio se ele estiver vazio. Seguro de chamar em todo boot. */
export async function seedPalacio(repo: PalacioRepo): Promise<boolean> {
  const livros = await repo.listLivros()
  if (livros.length > 0) return false

  for (const l of SEED_LIVROS) await repo.upsertLivro(l)
  for (const n of SEED_NEURONIOS) await repo.upsertNeuronio(n)

  return true
}
