import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages servește site-ul la https://filipobrijan.github.io/teza/
  base: command === 'build' ? '/teza/' : '/',
  server: {
    port: 5173,
  },
}));
