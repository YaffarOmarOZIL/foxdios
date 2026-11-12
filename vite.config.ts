import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pluginContenido } from './scripts/plugin-contenido';

// base './' hace que la web funcione igual en Cloudflare Pages, GitHub Pages o cualquier subcarpeta.
export default defineConfig({
  base: './',
  plugins: [react(), pluginContenido()],
  server: { port: 5173 },
});
