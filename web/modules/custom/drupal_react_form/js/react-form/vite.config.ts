import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'DrupalReactForm',
      formats: ['iife'],
      fileName: () => 'react-form.js',
    },
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'react-form.[ext]',
      },
    },
  },
});
