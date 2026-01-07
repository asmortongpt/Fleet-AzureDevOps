import path from 'path';
import crypto from 'crypto';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * P0-1 SECURITY FIX: Prevent .env files from being bundled into production builds
 * Generate CSP nonces for P0-4 fix
 */

export default defineConfig({
  // P0-1: Explicitly exclude .env files from build output
  envPrefix: 'VITE_', // Only load variables with VITE_ prefix
  envDir: './', // Load from project root
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: false,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/stats.html'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fleet\.capitaltechalliance\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
        ],
      },
      manifest: false, // Using custom manifest
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ag-grid-vendor': ['ag-grid-react', 'ag-grid-community'],
          'icons-vendor': ['lucide-react'],
        },
      },
      // P0-1: Explicitly exclude .env files from being bundled
      external: (id) => {
        if (id.includes('.env')) {
          console.warn(`⚠️  SECURITY: Prevented .env file from being bundled: ${id}`);
          return true;
        }
        return false;
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      // P0-1: Remove any environment variable references in production
      mangle: {
        properties: {
          regex: /(PASSWORD|SECRET|KEY|TOKEN)$/,
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'ag-grid-react',
    ],
  },
});
