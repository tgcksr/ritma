import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Pre-bundle deps of lazy routes up front; otherwise Vite discovers them on first navigation
  // and re-optimizes mid-session, which breaks the already-loaded React tree in dev.
  optimizeDeps: {
    include: [
      'recharts',
      '@fullcalendar/core',
      '@fullcalendar/core/locales/tr',
      '@fullcalendar/react',
      '@fullcalendar/daygrid',
      '@fullcalendar/timegrid',
      '@fullcalendar/interaction',
      '@fullcalendar/list',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
    ],
  },
  server: {
    port: 5173,
    // Same-origin API in development so the httpOnly session cookie just works.
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
});
