import { TEMA_PADRAO, temaOuPadrao, type Tema } from '@/core'

/**
 * O tema na tela — o adaptador do navegador para a preferência de tema.
 *
 * A preferência de verdade mora no banco (`meta.preferencias`), que só o Worker lê, e a resposta
 * chega depois da primeira pintura. Sem este espelho, quem escolheu o Padrão veria o clássico por
 * um instante a cada abertura. O espelho é só isso — um atalho para a primeira pintura, nunca a
 * fonte da verdade e nunca dado do palácio (CLAUDE.md, "Nunca usar localStorage para dados de
 * domínio"): se o aparelho o apagar, o banco confirma o tema logo depois.
 *
 * O mesmo valor é lido por um script de uma linha no `index.html`, antes do CSS pintar.
 */
const CHAVE = 'locus-tema'

/** O último tema que este aparelho aplicou. O clássico se nunca houve, ou se o acesso falhar. */
export function temaLembrado(): Tema {
  try {
    return temaOuPadrao(localStorage.getItem(CHAVE))
  } catch {
    return TEMA_PADRAO
  }
}

/** Liga o tema na página (`<html data-tema>`, que o CSS lê) e o lembra para a próxima abertura. */
export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // Armazenamento bloqueado (janela privada, por exemplo): o tema vale nesta sessão.
  }
}
