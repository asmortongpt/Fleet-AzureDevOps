import path from 'path';

import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Define env variables for client-side access
    define: {
      'import.meta.env.VITE_USE_MOCK_DATA': JSON.stringify(env.VITE_USE_MOCK_DATA || 'true'),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    },
    // Development server configuration
    server: {
      port: 5173,
      proxy: env.VITE_USE_MOCK_DATA !== 'true' && env.VITE_API_URL ? {
        // Only proxy API calls if NOT in mock mode and API URL is configured
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        }
      } : undefined,
    },
    build: {
      target: 'esnext',
      sourcemap: env.NODE_ENV === 'development',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('shadcn')) {
                return 'ui-vendor';
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
            open: false, // Don't auto-open in CI/CD
          }),
        ],
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: env.NODE_ENV === 'production',
          drop_debugger: true,
          passes: 2,
        },
        output: {
          comments: false,
        },
      },
      assetsInlineLimit: 4096, // 4KB
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    esbuild: {
      treeShaking: true,
    },
  };
});