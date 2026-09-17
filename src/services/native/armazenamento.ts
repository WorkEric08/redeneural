/**
 * Pedir ao navegador que não jogue o palácio fora.
 *
 * Por padrão o IndexedDB é "best-effort": sob pressão de armazenamento o
 * navegador pode despejar os dados de um site sem avisar ninguém. Para um app
 * onde tudo que a pessoa escreveu vive num aparelho só, sem login e sem
 * servidor (regra 3 do mestre), isso é a diferença entre um palácio e um
 * palácio que pode sumir numa faxina do sistema.
 *
 * `navigator.storage.persist()` troca isso por armazenamento durável: só sai
 * se a pessoa apagar os dados do site ou desinstalar o app. No Chrome — a base
 * da WebView do Android, que é o alvo — a decisão é automática e silenciosa
 * (app instalado e engajamento contam a favor); não há diálogo. O Firefox
 * pergunta, e uma recusa não quebra nada: continua tudo funcionando como
 * antes, só sem a garantia.
 *
 * Mora em `services/native/` pelo mesmo critério de `gestos.ts` e
 * `arquivos.ts` (CLAUDE.md §4): existe porque o ambiente é um navegador/WebView,
 * não porque o palácio precisa dele. Sob Capacitor o dado já é do app e isto
 * simplesmente não faz nada.
 *
 * Silencioso de propósito: não é uma ação que a pessoa pediu, então nem o
 * sucesso nem a recusa viram aviso na tela.
 */
export async function pedirArmazenamentoDuravel(): Promise<boolean> {
  const armazenamento = navigator.storage as StorageManager | undefined
  if (!armazenamento?.persist) return false

  try {
    // Já durável (visita anterior, ou app instalado): pedir de novo só
    // gastaria uma chamada — e no Firefox poderia perguntar outra vez.
    if (await armazenamento.persisted()) return true
    return await armazenamento.persist()
  } catch {
    return false
  }
}
