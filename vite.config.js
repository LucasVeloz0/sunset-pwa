import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  base: '/sunset-pwa/',
  plugins: [
    react(),
    basicSsl(), // Mantenha primeiro para evitar conflitos
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sunset Compass',
        short_name: 'Sunset',
        description: 'Bússola interativa para localizar o pôr do sol',
        start_url: '/sunset-pwa/',
        scope: '/sunset-pwa/',
        theme_color: '#ff9966',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/node_modules/**/*', '**/sw.js', '**/workbox-*.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.sunrise-sunset\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Habilita PWA durante o desenvolvimento
      }
    })
  ],
  server: {
    https: true, // Usa o SSL básico automaticamente
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      protocol: 'wss', // Necessário para HTTPS
      host: 'localhost',
      port: 3000
    },
    headers: {
      'Permissions-Policy': 'gyroscope=(self), accelerometer=(self)',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor';
            }
            if (id.includes('suncalc')) {
              return 'suncalc';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ['suncalc', 'react', 'react-dom'],
    exclude: ['vite-plugin-pwa']
  }
});