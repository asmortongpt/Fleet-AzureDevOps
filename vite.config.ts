import path from 'path';

import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10KB
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression (better compression ratio)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10KB
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    target: 'esnext',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React dependencies
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // React Router
            if (id.includes('react-router-dom') || id.includes('react-router')) {
              return 'react-router';
            }
            // UI component libraries
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            // 3D rendering (Three.js)
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            // Maps
            if (id.includes('mapbox') || id.includes('leaflet') || id.includes('@react-google-maps') || id.includes('azure-maps')) {
              return 'maps';
            }
            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'forms';
            }
            // State management
            if (id.includes('@tanstack/react-query') || id.includes('jotai') || id.includes('swr')) {
              return 'state-management';
            }
            // Material UI
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui';
            }
            // Ant Design
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'antd';
            }
            // Utilities
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils';
            }
            // Monitoring and telemetry
            if (id.includes('@sentry') || id.includes('@microsoft/applicationinsights')) {
              return 'monitoring';
            }
            // PDF and Excel
            if (id.includes('jspdf') || id.includes('exceljs')) {
              return 'document-generation';
            }
            // Framer Motion
            if (id.includes('framer-motion')) {
              return 'animations';
            }
            // Remaining vendor code
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
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
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
      },
      mangle: {
        safari10: true,
      },
      output: {
        comments: false,
        safari10: true,
      },
    },
    assetsInlineLimit: 4096, // 4KB
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
    exclude: ['@react-three/fiber', '@react-three/drei'],
  },
  esbuild: {
    treeShaking: true,
    legalComments: 'none',
  },
});