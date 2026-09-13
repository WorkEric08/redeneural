/**
 * O neurônio que ainda espera o modelo. Um ponto que pulsa, e não só a palavra:
 * "processando" parado no meio de uma lista lê como estado permanente.
 *
 * Contorno, e não fundo de realce: Silver Lake Blue sobre o realce dá 3,3:1 à
 * noite, pouco para letra desse tamanho; sobre a superfície dá 4,6:1.
 */
export function EtiquetaProcessando({ texto = 'processando' }: { texto?: string }) {
  return (
    <span className="border-linha text-poeira inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-medium">
      <span className="bg-poeira size-1.5 animate-pulse rounded-full" aria-hidden />
      {texto}
    </span>
  )
}
