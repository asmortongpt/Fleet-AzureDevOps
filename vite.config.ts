import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
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
    rollupOptions: {
      output: {
        // Granular chunking strategy for optimal bundle size
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core - split into smaller chunks
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }

            // UI Libraries - more granular splitting
            if (id.includes('@radix-ui')) {
              // Split radix by component type
              if (id.includes('dialog') || id.includes('alert-dialog') || id.includes('popover')) {
                return 'ui-dialogs';
              }
              if (id.includes('dropdown') || id.includes('menu') || id.includes('select')) {
                return 'ui-menus';
              }
              return 'ui-radix';
            }

            // MUI - separate chunk due to size
            if (id.includes('@mui/')) {
              if (id.includes('@mui/icons-material')) {
                return 'mui-icons';
              }
              return 'mui-core';
            }

            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor';
            }

            // Date/time utilities
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'date-vendor';
            }

            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }

            // 3D/Three.js
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }

            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'form-vendor';
            }

            // State management and data fetching
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }

            // Utilities
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
          }

          // Lazy-loaded modules
          if (id.includes('lazy')) {
            return 'lazy-modules';
          }
        },
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        pure_getters: true,
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true,
      },
      output: {
        comments: false,
        ecma: 2020,
      },
    },
    assetsInlineLimit: 4096, // 4KB
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  esbuild: {
    treeShaking: true,
    drop: ['console', 'debugger'], // Drop console/debugger in production
  },
});
