import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Static export for grok.me Build Mode is `publish/` (see README).
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 47331,
    strictPort: true,
    open: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 47331,
    strictPort: true,
  },
  build: {
    outDir: 'publish',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        lookdev: resolve('lookdev.html'),
      },
    },
  },
});
