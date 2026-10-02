/**
 * O aviso discreto de quando uma ideia nova acorda outras: no máximo dois
 * nomes, e o resto vira contagem — nunca uma lista. `null` quando ninguém
 * acordou.
 */
export function textoDoDespertar(titulos: readonly string[]): string | null {
  const [primeiro, segundo] = titulos
  if (primeiro === undefined) return null
  if (segundo === undefined) return `Isso acordou “${primeiro}”.`
  if (titulos.length === 2) return `Isso acordou “${primeiro}” e “${segundo}”.`
  return `Isso acordou “${primeiro}”, “${segundo}” e mais ${String(titulos.length - 2)}.`
}
