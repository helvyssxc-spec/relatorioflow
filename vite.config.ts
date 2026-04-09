import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "favicon-32x32.png",
        "favicon-16x16.png",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: {
        name: "RelatórioFlow",
        short_name: "RelatórioFlow",
        description:
          "Gere Relatórios Técnicos e Diários de Obra com IA em 30 segundos",
        theme_color: "#1A56DB",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/app/dashboard",
        lang: "pt-BR",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cacheia todos os assets estáticos gerados pelo Vite
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}"],
        // Aumenta o limite para não descartar chunks grandes
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Navegação: sempre tenta rede primeiro, cai para cache offline
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/supabase\//],
        runtimeCaching: [
          // API Supabase: NetworkFirst — dados frescos quando há rede
          {
            urlPattern:
              /^https:\/\/lmydxgmiytiwgfmjjxdb\.supabase\.co\/rest\//i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-v1",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 24 * 60 * 60, // 1 dia
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Storage Supabase (fotos/PDFs): CacheFirst — binários não mudam
          {
            urlPattern:
              /^https:\/\/lmydxgmiytiwgfmjjxdb\.supabase\.co\/storage\//i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-v1",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fontes externas: CacheFirst permanente
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-v1",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Desativado em dev para não interferir com HMR
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
  },
});
