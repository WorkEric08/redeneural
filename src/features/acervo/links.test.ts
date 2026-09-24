import { describe, expect, it } from 'vitest'

import { dominioDe, ehLinkValido, idDoYoutube, miniaturaDoLink } from './links'

describe('ehLinkValido', () => {
  it('aceita http e https, com espaço sobrando de quem colou', () => {
    expect(ehLinkValido('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(ehLinkValido('  http://exemplo.com/a  ')).toBe(true)
  })

  it('recusa o que não vira link tocável seguro', () => {
    expect(ehLinkValido('javascript:alert(1)')).toBe(false)
    expect(ehLinkValido('file:///etc/passwd')).toBe(false)
    expect(ehLinkValido('exemplo.com')).toBe(false)
    expect(ehLinkValido('')).toBe(false)
  })
})

describe('idDoYoutube', () => {
  it('reconhece os formatos que o app do YouTube compartilha', () => {
    expect(idDoYoutube('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(idDoYoutube('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ')
    expect(idDoYoutube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')).toBe('dQw4w9WgXcQ')
    expect(idDoYoutube('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(idDoYoutube('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(idDoYoutube('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('não inventa id para o que não é vídeo', () => {
    expect(idDoYoutube('https://www.youtube.com/@canal')).toBeNull()
    expect(idDoYoutube('https://www.youtube.com/watch?v=curto')).toBeNull()
    expect(idDoYoutube('https://exemplo.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(idDoYoutube('não é url')).toBeNull()
  })
})

describe('miniaturaDoLink', () => {
  it('só existe para vídeo do YouTube', () => {
    expect(miniaturaDoLink('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
    expect(miniaturaDoLink('https://exemplo.com/artigo')).toBeNull()
  })
})

describe('dominioDe', () => {
  it('mostra o domínio sem o www', () => {
    expect(dominioDe('https://www.exemplo.com.br/a/b?c=1')).toBe('exemplo.com.br')
    expect(dominioDe('https://blog.exemplo.com/post')).toBe('blog.exemplo.com')
  })

  it('devolve o texto como veio se não for URL', () => {
    expect(dominioDe('qualquer coisa')).toBe('qualquer coisa')
  })
})
