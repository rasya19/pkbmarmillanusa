import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      strategies: 'generateSW',
      manifest: {
        short_name: "LMS Armilla",
        name: "LMS PKBM Armilla Nusa",
        description: "Platform Layanan Belajar Masyarakat PKBM Armilla Nusa",
        icons: [
          {
            src: "/icon-192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "/icon-512.png",
            type: "image/png",
            sizes: "512x512"
          }
        ],
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#2196F3",
        display: "standalone",
        orientation: "portrait"
      },
      workbox: {
        // MEMAKSA WORKBOX MENERIMA SEMUA UKURAN FILE TAILWIND V4
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, 
        // Hanya cache aset dasar, biarkan Tailwind CSS dimuat secara dinamis agar tidak berantakan
        globPatterns: ['**/*.{html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'style' || request.destination === 'script',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'core-scripts-styles'
            }
          }
        ]
      }
    })
  ]
});
