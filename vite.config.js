import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsDir: 'assets',
    emptyOutDir: true,
    manifest: 'manifest.json',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'src/main.js',
      },
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  server: {
    cors: true,
    host: '0.0.0.0',
    origin: 'http://localhost:5173',
    port: 5173,
    strictPort: true,
  },
});
