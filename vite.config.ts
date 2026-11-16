/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      pwaAssets: { config: true },
      manifest: {
        name: 'Recetario',
        short_name: 'Recetario',
        description: 'Tus recetas, en cualquier cocina.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        theme_color: '#b8401f',
        background_color: '#f7f0e3',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
        navigateFallback: '/index.html',
        // Sin runtimeCaching: los datos de Convex y Clerk nunca pasan por la caché.
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    server: { deps: { inline: ['convex-test'] } },
    alias: { 'virtual:pwa-register/react': '/src/test/pwa-register-stub.ts' },
  },
})
