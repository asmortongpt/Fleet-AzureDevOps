import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from 'path'
import { injectBuildVersion } from './plugins/injectBuildVersion'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Inject build version into service worker
    // Format: v1.0.0-{commitSHA}-{timestamp}
    injectBuildVersion({
      baseVersion: 'v1.0.0',
      swPath: 'sw.js',
      placeholder: '__BUILD_VERSION__',
    }),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst' | 'treemap' | 'network'
    }) as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    fs: {
      // Allow serving files from node_modules and project root
      allow: [
        // Allow project root
        '.',
        // Allow node_modules for CSS and asset imports
        '../node_modules'
      ]
    }
  },
  build: {
    // ========================================================================
    // CODE SPLITTING & CHUNK OPTIMIZATION
    // ========================================================================

    // Target modern browsers for smaller bundles
    target: 'es2020',

    // Increase chunk size warning limit (500kb default is too small for map apps)
    chunkSizeWarningLimit: 1000,

    // Re-enabled after fixing chunk circular dependency
    minify: 'esbuild',

    // Source maps - disable for production, enable for staging
    sourcemap: process.env.NODE_ENV === 'production' ? false : true,

    // CSS code splitting
    cssCodeSplit: true,

    // Rollup options for advanced chunking
    rollupOptions: {
      output: {
        // ===================================================================
        // SIMPLIFIED CHUNK STRATEGY
        // Let Vite handle most chunking to avoid circular dependency issues
        // ===================================================================
        manualChunks: (id) => {
          // All node_modules go to a single vendor chunk to avoid circular deps
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },

        // Chunk file naming with content hash for cache busting
        chunkFileNames: (chunkInfo) => {
          // Use chunk name if available, otherwise use hash
          const name = chunkInfo.name || 'chunk';
          return `assets/js/${name}-[hash].js`;
        },

        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',

        // Asset file naming (images, fonts, etc.)
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];

          // Organize by file type
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `assets/css/[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },
      },

      // External dependencies (CDN - optional, commented out by default)
      // Uncomment to load from CDN instead of bundling
      // external: ['react', 'react-dom'],
    },

    // ========================================================================
    // OPTIMIZATION SETTINGS
    // ========================================================================

    // Preload assets for better performance
    modulePreload: {
      polyfill: true,
    },

    // Report compressed size (slower builds, useful for analysis)
    reportCompressedSize: true,

    // Emit manifest for advanced caching strategies
    manifest: true,

    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },

  // ========================================================================
  // OPTIMIZATION - DEP PRE-BUNDLING
  // ========================================================================
  optimizeDeps: {
    // Pre-bundle large dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'date-fns',
      'axios',
      'recharts',
      '@phosphor-icons/react',
      // Three.js and React Three Fiber - must be pre-bundled for ESM compatibility
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      // Required for React Three Fiber internal dependencies
      'use-sync-external-store',
      'use-sync-external-store/shim',
      'use-sync-external-store/shim/with-selector',
    ],

    // Exclude dependencies that should be loaded dynamically (map libraries)
    exclude: [
      'leaflet',
      'mapbox-gl',
      '@react-google-maps/api',
      'azure-maps-control',
    ],
  },

  // ========================================================================
  // PERFORMANCE SETTINGS
  // ========================================================================

  // Increase the maximum file size for better performance with large apps
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
  },
});
