import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    allowedHosts: [
      'efx-led-shop-production.up.railway.app',
      '.railway.app', // Allow all Railway subdomains
      'localhost',
    ],
    // Ensure SPA routing works - serve index.html for all routes
    strictPort: false,
  },
  build: {
    // Ensure proper SPA build
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});



