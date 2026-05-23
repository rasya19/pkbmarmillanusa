import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
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
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        // Taktik paling aman: Matikan precache otomatis, biarkan browser mengambil file CSS/JS secara alami
        globPatterns: [], 
        runtimeCaching: [
          {
            urlPattern: ({ request }) => true, // Izinkan semua file lewat tanpa disandera cache buntu
            handler: 'NetworkFirst',
            options: {
              cacheName: 'universal-cache'
            }
          }
        ]
      }
    })
  ]
});
