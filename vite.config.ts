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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            if (id.includes('react-router')) {
              return 'react-router';
            }
            if (id.includes('@radix-ui')) {
              if (id.includes('dialog') || id.includes('alert-dialog') || id.includes('popover')) {
                return 'ui-dialogs';
              }
              if (id.includes('dropdown') || id.includes('menu') || id.includes('select')) {
                return 'ui-menus';
              }
              return 'ui-radix';
            }
            if (id.includes('@mui/')) {
              if (id.includes('@mui/icons-material')) {
                return 'mui-icons';
              }
              return 'mui-core';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor';
            }
            if (id.includes('date-fns') || id.includes('dayjs')) {
              return 'date-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('three')) {
              if (id.includes('@react-three/drei')) {
                return 'three-helpers';
              }
              if (id.includes('@react-three/fiber')) {
                return 'three-react';
              }
              return 'three-core';
            }
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('mapbox') || id.includes('maplibre') || id.includes('leaflet')) {
              return 'maps-vendor';
            }
            if (id.includes('@azure')) {
              return 'azure-vendor';
            }
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'utils-vendor';
            }
          }
          if (id.includes('lazy')) {
            return 'lazy-modules';
          }
        },
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
