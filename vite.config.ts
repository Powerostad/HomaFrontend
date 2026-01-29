import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@context': path.resolve(__dirname, './src/context'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@layout': path.resolve(__dirname, './src/layout'),
      '@data': path.resolve(__dirname, './src/data'),
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
    // Disable sourcemaps in production to reduce bundle size and improve load times
    sourcemap: false,
    // Clear outDir on build
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Use a function for better control over chunk splitting
        manualChunks: (id) => {
          // Core React - loaded immediately, keep small
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Router - separate chunk for lazy routes
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // Motion animations - can be deferred
          if (id.includes('node_modules/motion/')) {
            return 'ui-vendor';
          }
          // Radix UI - only load when dialogs/dropdowns are used
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-vendor';
          }
          // Note: i18n is not chunked separately as it depends on react-vendor
          // causing circular dependencies
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
