import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Stratégie de chunking — objectif bundle initial < 150 kB gzip
 *
 * Groupes de chunks :
 *   react-core      → React + ReactDOM + Router (chargé toujours)
 *   mui-core        → MUI composants de base (chargé toujours)
 *   mui-icons       → ~900 icônes tree-shaked (chargé toujours)
 *   charts          → Recharts (chargé sur dashboards / statistiques)
 *   calendar        → FullCalendar (chargé sur pages emploi-du-temps)
 *   pdf-export      → jsPDF + jspdf-autotable (chargé on-demand)
 *   excel-export    → XLSX + PapaParse (chargé on-demand)
 *   auth            → Contextes auth (chargé toujours, léger)
 *   query           → TanStack Query (chargé toujours)
 *
 * ⚠️  pdf-export et excel-export ne doivent JAMAIS être importés statiquement.
 *     Utiliser uniquement via import() dynamique dans les handlers d'export.
 */
function manualChunks(id) {
  // ── React core — critique, toujours chargé ────────────────────────────
  if (id.includes('node_modules/react/') ||
      id.includes('node_modules/react-dom/') ||
      id.includes('node_modules/react-router')) {
    return 'react-core';
  }

  // ── TanStack Query ────────────────────────────────────────────────────
  if (id.includes('@tanstack/react-query')) {
    return 'query';
  }

  // ── MUI Icons — séparé du core car tree-shaking agressif ─────────────
  if (id.includes('@mui/icons-material')) {
    return 'mui-icons';
  }

  // ── MUI core + date-fns ───────────────────────────────────────────────
  if (id.includes('@mui/material') ||
      id.includes('@mui/system') ||
      id.includes('@mui/base') ||
      id.includes('@emotion/') ||
      id.includes('date-fns')) {
    return 'mui-core';
  }

  // ── Recharts — uniquement sur dashboards et statistiques ─────────────
  if (id.includes('recharts') || id.includes('d3-')) {
    return 'charts';
  }

  // ── FullCalendar — uniquement sur pages emploi-du-temps ──────────────
  if (id.includes('@fullcalendar')) {
    return 'calendar';
  }

  // ── Export PDF — chargé UNIQUEMENT via import() dynamique ────────────
  if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
    return 'pdf-export';
  }

  // ── Export Excel / CSV — chargé UNIQUEMENT via import() dynamique ────
  if (id.includes('xlsx') || id.includes('papaparse') || id.includes('file-saver')) {
    return 'excel-export';
  }

  // ── Motion / Animations ───────────────────────────────────────────────
  if (id.includes('framer-motion') || id.includes('motion')) {
    return 'animation';
  }

  // ── Virtualisation tableaux ───────────────────────────────────────────
  if (id.includes('react-window')) {
    return 'virtualization';
  }

  // ── Axios ─────────────────────────────────────────────────────────────
  if (id.includes('axios')) {
    return 'http-client';
  }
}

export default defineConfig({
  plugins: [
    react({
      // Babel plugin pour React 19 compiler (décommenter si installé)
      // babel: { plugins: ['babel-plugin-react-compiler'] },
    }),
    splitVendorChunkPlugin(), // Fallback pour les modules non mappés
  ],

  // ── Alias pour imports propres ─────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },

  // ── Optimisation des dépendances (pre-bundling) ────────────────────────
  optimizeDeps: {
    include: [
      // Pré-bundler les libs synchrones critiques
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@tanstack/react-query',
      'axios',
    ],
    exclude: [
      // NE PAS pré-bundler les libs on-demand (elles seraient dans le bundle initial)
      'jspdf',
      'jspdf-autotable',
      'xlsx',
      'papaparse',
    ],
    esbuildOptions: { target: 'esnext' },
  },

  // ── Build production ───────────────────────────────────────────────────
  build: {
    target: 'esnext',
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks,
        // Nommage des chunks pour le debugging
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Seuil d'avertissement bundle (on vise < 300 kB par chunk)
    chunkSizeWarningLimit: 300,

    // Activer source maps en prod pour le monitoring des erreurs (Sentry)
    sourcemap: false, // Passer à true si Sentry configuré

    commonjsOptions: {
      include: [/jspdf-autotable/, /node_modules/],
    },
  },

  // ── Serveur de développement ───────────────────────────────────────────
  server: {
    port: 5173,
    hmr: { overlay: true },
  },
});
