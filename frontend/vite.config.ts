import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Vite ko batana hai ki index.html ek level bahar (root) mein hai
  root: path.resolve(__dirname, '../'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  build: {
    // Build hone ke baad files wapas frontend/dist mein hi save honi chahiye
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
