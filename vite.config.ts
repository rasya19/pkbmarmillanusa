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
        maximumFileSizeToCacheInBytes: 7 * 1024 * 1024,
        // Taktik NetworkFirst: Ambil file CSS/JS terbaru langsung dari server Vercel agar tidak berantakan
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css|html|svg|png)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 hari
              }
            }
          }
        ]
      }
    })
  ]
});
