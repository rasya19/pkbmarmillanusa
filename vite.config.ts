import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
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
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        short_name: "LMS Armilla",
        name: "LMS PKBM Armilla Nusa",
        description: "Platform Layanan Belajar Masyarakat PKBM Armilla Nusa",
        icons: [
          {
            src: "/icon-192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any"
          },
          {
            src: "/icon-512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any"
          }
        ],
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#2196F3",
        display: "standalone",
        orientation: "portrait"
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 7 * 1024 * 1024, // Naikkan ke 7 MB agar aman
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
