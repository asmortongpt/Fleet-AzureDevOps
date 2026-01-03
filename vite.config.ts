import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: process.env.NODE_ENV === 'development',
    cssCodeSplit: true,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Gemini AI FIX: Disabled manualChunks to fix React TDZ in chart-vendor
        // Let Vite handle chunk ordering automatically to prevent "Cannot access React before initialization"
        manualChunks: undefined,
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(png|jpe?g|svg|gif|webp|avif)$/)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(woff2?|eot|ttf|otf)$/)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (assetInfo.name?.match(/\.(gltf|glb|obj|fbx)$/)) {
            return 'assets/models/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
      plugins: [
        visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
    },
    // DIAGNOSTIC: Disable minification to identify if the issue is in source code or minifier
    // TDZ errors persist with both Terser and esbuild - investigating source code issue
    minify: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'react-reconciler',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
    ],
  },
  esbuild: {
    treeShaking: true,
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
});
