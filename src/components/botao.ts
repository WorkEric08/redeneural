/**
 * As classes de botão do app inteiro, para `<button>` e para `<Link>`.
 *
 * Só as classes, e não um componente: metade dos botões daqui são links do
 * roteador, e um componente teria que saber virar os dois. E uma função de
 * mapas, não `cva` + `tailwind-merge`: nenhuma variante aqui briga com outra
 * classe, e os dois juntos custavam 11 KB gzipped no bundle principal.
 *
 * - `primario`: Platinum sobre a sala — a ação que a tela existe para fazer.
 * - `secundario`: superfície com borda — as outras ações. Ligado
 *   (`aria-pressed`), vira realce.
 * - `fantasma`: só texto em Silver Lake Blue — voltar, fechar, ações de barra.
 * - `perigo`: apagar. Vermelho é, como o ouro, cor de significado fora da
 *   paleta.
 *
 * O primário desabilitado vira realce com texto apagado, e não Platinum
 * translúcido: meio transparente sobre a sala ele virava um bloco cinza que
 * ainda parecia o botão mais importante da tela.
 */

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-[transform,background-color,color,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none'

const TIPOS = {
  primario: 'bg-papel text-sala disabled:bg-realce disabled:text-poeira',
  secundario:
    'border-linha bg-parede text-papel active:bg-realce aria-pressed:bg-realce aria-pressed:border-transparent border disabled:opacity-45',
  fantasma: 'text-poeira active:bg-realce active:text-papel disabled:opacity-45',
  perigo: 'bg-destructive text-sala disabled:opacity-60',
} as const

const TAMANHOS = {
  normal: 'h-12 rounded-xl px-5 text-[0.95rem]',
  pequeno: 'h-10 rounded-lg px-3.5 text-sm',
  icone: 'size-11 rounded-full',
} as const

interface OpcoesDoBotao {
  tipo?: keyof typeof TIPOS
  tamanho?: keyof typeof TAMANHOS
  largo?: boolean
}

export function botao({
  tipo = 'secundario',
  tamanho = 'normal',
  largo = false,
}: OpcoesDoBotao = {}): string {
  return `${BASE} ${TIPOS[tipo]} ${TAMANHOS[tamanho]}${largo ? ' w-full' : ''}`
}
