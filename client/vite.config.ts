import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const rawUrl = req.url?.split('?')[0].split('#')[0]
        if (
          req.method === 'GET' &&
          rawUrl &&
          !path.extname(rawUrl) &&
          rawUrl !== '/' &&
          !rawUrl.startsWith('/@') &&
          !rawUrl.startsWith('/__') &&
          !rawUrl.startsWith('/node_modules') &&
          !rawUrl.startsWith('/api') &&
          !rawUrl.startsWith('/uploads') &&
          !rawUrl.startsWith('/socket.io')
        ) {
          const accept = req.headers.accept
          if (accept === undefined || accept === '' || accept.includes('text/html') || accept.includes('*/*')) {
            req.url = '/index.html'
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  appType: 'spa',
  plugins: [
    react(),
    spaFallbackPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'GlowUp — AI-Powered Beauty Platform',
        short_name: 'GlowUp',
        description: 'Discover verified stylists, watch live beauty sessions, get AI-powered matches, and earn rewards.',
        theme_color: '#f43f5e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/auth\/(refresh|me)/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 12 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@mediapipe/tasks-vision'],
  },
  build: {
    sourcemap: false,
    cssMinify: 'esbuild',
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
})