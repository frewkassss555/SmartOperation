import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app from /SmartOperation/; `vite build --mode pages` builds for it.
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/SmartOperation/' : '/',
  plugins: [
    react(),
    VitePWA({
      // The app shows its own "update available" bar and asks before reloading.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        // Relative to the manifest, so the same build works at / and at /SmartOperation/.
        id: './',
        name: 'SmartOperation',
        short_name: 'SmartOperation',
        description: 'Оценки, финансы, расписание, заметки и котировки. Данные хранятся на устройстве.',
        lang: 'ru',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#101110',
        background_color: '#101110',
        categories: ['education', 'finance', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The whole shell: JS, CSS, HTML, fonts (woff2 only: every target browser reads it), icons.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Quotes: network first with a 4 s timeout, then the last cached answer.
            urlPattern: ({ url }) => url.origin === 'https://api.coingecko.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'quotes-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  // Bind to IPv4 explicitly: on some Windows setups "localhost" resolves to ::1 only
  // and the browser cannot reach the dev server.
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: true,
  },
  preview: {
    host: '127.0.0.1',
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Stable dates in tests that touch "today".
    env: { TZ: 'Europe/Minsk' },
  },
}));
