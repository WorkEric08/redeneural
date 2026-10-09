import { ESTILOS_DA_LOMBADA, type EstiloDaLombada } from '@/core'

/** Os nomes das oito formas da lombada, como o formulário os mostra. */
const ROTULOS: Record<EstiloDaLombada, string> = {
  solido: 'Sólido',
  faixa: 'Faixa',
  contorno: 'Contorno',
  ponto: 'Ponto',
  fio: 'Fio',
  degrade: 'Degradê',
  papel: 'Papel',
  bloco: 'Bloco',
}

export const FORMAS = ESTILOS_DA_LOMBADA.map((chave) => ({ chave, rotulo: ROTULOS[chave] }))
