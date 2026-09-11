import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

async function loadPwaPlugin() {
    const { VitePWA } = await import('vite-plugin-pwa');
    return VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        injectManifest: { globPatterns: ['**/*.{js,css,svg,woff2}'], maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 },
        includeAssets: [
            'favicon.ico',
            'icons/homa-icon.svg',
            'icons/homa-icon-192.png',
            'icons/homa-icon-512.png',
            'icons/homa-maskable-512.png',
            'icons/splash.png',
        ],
        manifest: {
            name: 'هما | دستیار هوشمند دکوراسیون',
            short_name: 'همت',
            description: 'پلتفرم هوش مصنوعی برای دیزاین بهتر خانه شما',
            lang: 'fa',
            dir: 'rtl',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            background_color: '#E31E24',
            theme_color: '#E31E24',
            icons: [
                { src: '/icons/homa-icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/homa-icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: '/icons/homa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
        },
    });
}

// https://vitejs.dev/config/
export default defineConfig(async ({ isSsrBuild, command }) => {
    const plugins = [react()];
    // The PWA virtual modules (virtual:pwa-register) must also resolve in dev,
    // because src/seo/hydratePublic.tsx imports them on public pages.
    // With devOptions disabled no service worker is registered in dev; the
    // plugin is skipped only for the SSR build, which never registers a SW.
    if ((command === 'build' && !isSsrBuild) || command === 'serve') {
        plugins.push(await loadPwaPlugin());
    }
    return {
        plugins,
        ssr: { external: ['react', 'react-dom', 'react-router-dom', 'react-i18next', 'i18next'] },
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
        assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp'],
        server: {
            port: 3000,
            open: true,
            host: true,
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    entryFileNames: isSsrBuild ? '[name].mjs' : 'assets/[name]-[hash].js',
                    manualChunks: isSsrBuild ? undefined : (id) => {
                        if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react-vendor';
                        if (id.includes('node_modules/react-router')) return 'router-vendor';
                        if (id.includes('node_modules/motion/')) return 'ui-vendor';
                        if (id.includes('node_modules/@radix-ui/')) return 'radix-vendor';
                    },
                },
            },
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'motion', 'lucide-react'],
            force: false,
        },
    };
});
