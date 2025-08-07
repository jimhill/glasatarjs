import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './demo',
  base: '/',
  server: {
    port: 5174, // Different port to avoid conflicts
  },
  build: {
    outDir: '../dist-demo-test',
  },
  resolve: {
    alias: {
      // Point to the built files instead of source
      '@': path.resolve(__dirname, './dist'),
      glasatar: path.resolve(__dirname, './dist'),
    },
  },
});
