/**
 * O que dá para saber de um link sem ir à rede.
 *
 * Buscar o título de uma página qualquer esbarra em CORS no navegador (no
 * nativo, `CapacitorHttp` resolve — ver CLAUDE.md, "Web agora, nativo
 * depois"). O que sobra é o próprio endereço: o domínio, e o id de um vídeo do
 * YouTube, cuja miniatura mora num endereço previsível.
 */

const HOSTS_DO_YOUTUBE = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com'])
const ID_DO_VIDEO = /^[A-Za-z0-9_-]{11}$/

function lerUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/**
 * A mesma regra que o repositório aplica ao gravar (`urlDeLink`): só http e
 * https. Aqui é para o botão de guardar saber antes, e não depois do erro.
 */
export function ehLinkValido(url: string): boolean {
  const u = lerUrl(url.trim())
  return u !== null && (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname !== ''
}

/** `youtu.be/ID`, `youtube.com/watch?v=ID`, `/shorts/ID`, `/embed/ID`, `/live/ID`. */
export function idDoYoutube(url: string): string | null {
  const u = lerUrl(url)
  if (!u) return null

  let candidato: string | null = null
  if (u.hostname === 'youtu.be') {
    candidato = u.pathname.slice(1).split('/')[0] ?? null
  } else if (HOSTS_DO_YOUTUBE.has(u.hostname)) {
    const [primeiro, segundo] = u.pathname.split('/').filter(Boolean)
    candidato =
      primeiro === 'watch'
        ? u.searchParams.get('v')
        : primeiro && ['shorts', 'embed', 'live'].includes(primeiro)
          ? (segundo ?? null)
          : null
  }

  return candidato && ID_DO_VIDEO.test(candidato) ? candidato : null
}

/**
 * A miniatura de um link, quando existe uma sem pedir nada a ninguém. Só
 * aparece com rede — offline, quem desenha cai no glifo do link.
 */
export function miniaturaDoLink(url: string): string | null {
  const id = idDoYoutube(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

/** `www.exemplo.com.br/a/b` → `exemplo.com.br`. O endereço inteiro, se não for URL. */
export function dominioDe(url: string): string {
  const u = lerUrl(url)
  return u ? u.hostname.replace(/^www\./, '') : url
}
