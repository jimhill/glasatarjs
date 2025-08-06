import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './demo',
  base: process.env.NODE_ENV === 'production' ? '/glasatarjs/' : '/',
  build: {
    outDir: '../dist-demo',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'glasatar': path.resolve(__dirname, './src'),
    },
  },
});
