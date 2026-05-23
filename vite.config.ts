import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
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
            src: "icon-192.png",
            type: "image/png",
            sizes: "192x192"
          },
          {
            src: "icon-512.png",
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/embed\.tawk\.to\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tawk-to-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 hari
              }
            }
          }
        ]
      }
    })
  ]
});
