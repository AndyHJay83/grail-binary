import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
      includeAssets: [
        'favicon.ico',
        'pwa-icon.svg',
        'apple-touch-icon-180x180.png',
        'apple-touch-icon-167x167.png',
        'apple-touch-icon-152x152.png',
        'apple-touch-icon-120x120.png',
        'apple-touch-icon-76x76.png',
        'apple-touch-icon-60x60.png',
        'apple-touch-icon-40x40.png',
        'icon-192x192.png',
        'icon-512x512.png',
        'icon-72x72.png',
        'icon-96x96.png',
        'icon-128x128.png',
        'icon-144x144.png',
        'icon-152x152.png',
        'icon-384x384.png'
      ],
      manifest: {
        name: 'Word Filter PWA',
        short_name: 'WordFilter',
        description: 'A Progressive Web App for filtering word lists using binary input',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/grail-binary/',
        start_url: '/grail-binary/',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          // iOS specific
          {
            src: 'apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon-167x167.png',
            sizes: '167x167',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon-120x120.png',
            sizes: '120x120',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon-76x76.png',
            sizes: '76x76',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon-60x60.png',
            sizes: '60x60',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'apple-touch-icon-40x40.png',
            sizes: '40x40',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  base: '/grail-binary/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  publicDir: 'public'
}) 