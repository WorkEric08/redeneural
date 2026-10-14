import type { Tema } from '@/core'

/**
 * O tema na tela — o adaptador do navegador para o tema em uso.
 *
 * A preferência de verdade mora no banco (`meta.preferencias`) e o Clássico depende dos livros
 * (`temaEmUso`): os dois só chegam do Worker depois da primeira pintura. Sem este espelho, quem usa o
 * Padrão veria o outro por um instante a cada abertura. O espelho guarda o **tema em uso** da última
 * vez e é só isso — um atalho para a primeira pintura, nunca a fonte da verdade e nunca dado do
 * palácio (CLAUDE.md, "Nunca usar localStorage para dados de domínio"): se o aparelho o apagar, o
 * banco confirma o tema logo depois.
 *
 * É lido por um script de uma linha no `index.html`, antes do CSS pintar; por isso aqui só se grava.
 */
const CHAVE = 'locus-tema'

/** Liga o tema na página (`<html data-tema>`, que o CSS lê) e o lembra para a próxima abertura. */
export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // Armazenamento bloqueado (janela privada, por exemplo): o tema vale nesta sessão.
  }
}
