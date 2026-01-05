import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@styles': path.resolve(__dirname, './styles'),
      '@utils': path.resolve(__dirname, './utils'),
      '@types': path.resolve(__dirname, './types'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  // Optimize asset handling for Figma imports and SVGs
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp'],
  server: {
    port: 3000,
    open: true,
    host: true,
    // Force clear cache on startup
    force: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Clear outDir on build
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['motion'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'motion',
      'lucide-react',
    ],
    force: false, // Set to true if you want to force re-optimization
  },
});
