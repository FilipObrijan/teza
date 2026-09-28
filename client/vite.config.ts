import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Cloudflare Pages servește site-ul la rădăcină ("/"); GitHub Pages l-ar servi la "/teza/".
  base: process.env.BASE_PATH ?? '/',
  server: {
    port: 5173,
  },
});
