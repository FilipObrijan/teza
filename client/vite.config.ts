import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/teza/', // <-- Added this line for GitHub Pages
  server: {
    port: 5173,
  },
});