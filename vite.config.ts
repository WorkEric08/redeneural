import { fileURLToPath, URL } from 'node:url'

import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * `HTTPS=1` liga um certificado autoassinado. Serve para rodar o spike num
 * celular pela rede local: sem https, `isSecureContext` é falso e o Cache API
 * some — aí não dá para medir cache nenhum, e todo teste rebaixa os modelos.
 */
const comHttps = process.env['HTTPS'] === '1'

/**
 * O spike só entra no build com `SPIKE=1`: é uma página de medição, não o
 * produto, e arrasta o transformers.js inteiro num segundo bundle.
 * Em `npm run dev` a página existe sempre, servida sob demanda.
 */
const comSpike = process.env['SPIKE'] === '1'

/**
 * `scripts/build-android.mjs`. Dentro do APK o app já está em disco, então o
 * service worker não protege de nada — só guardaria, num cache da WebView, uma
 * segunda cópia de arquivos que vieram no pacote, com o risco extra de servir a
 * versão velha depois de uma atualização.
 */
const paraAndroid = process.env['VITE_ANDROID'] === '1'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    ...(comHttps ? [basicSsl()] : []),
    react(),
    tailwindcss(),
    VitePWA({
      disable: paraAndroid,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Palácio Mental',
        short_name: 'Palácio',
        description:
          'Seu palácio mental: conceitos viram neurônios dentro de livros e se conectam sozinhos por significado.',
        lang: 'pt-BR',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        theme_color: '#0a1226',
        background_color: '#0a1226',
        icons: [
          { src: '/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/logo-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // O spike não é o app: seu bundle carrega o transformers.js inteiro e não
        // pode entrar no precache do produto.
        globIgnores: ['**/spike*', '**/assets/spike-*'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...(comSpike ? { spike: fileURLToPath(new URL('./spike.html', import.meta.url)) } : {}),
      },
    },
  },
  // onnxruntime-web não sobrevive ao pré-bundle do Vite.
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
