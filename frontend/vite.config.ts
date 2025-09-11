import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better development experience
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
  ],
  // Временно отключаем строгую проверку TypeScript для dev сервера
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Игнорируем TypeScript ошибки в development режиме
    ...(process.env.NODE_ENV === 'development' && {
      logLevel: 'error',
    }),
  },
  resolve: {
    alias: {
      // Simplified alias configuration that matches TypeScript paths exactly
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/theme': path.resolve(__dirname, './src/theme'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    port: 3000,
    host: true, // Allow external connections for better development experience
    open: false, // Don't auto-open browser
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
    // Optimize development server performance
    hmr: {
      overlay: true,
    },
    watch: {
      // Ignore node_modules for better performance
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize build performance and output
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    // Increase chunk size warning limit for better performance
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      '@tanstack/react-query',
    ],
    exclude: ['@vitejs/plugin-react'],
  },
  // Enable esbuild for faster builds
  esbuild: {
    target: 'es2022',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  // Define global constants for better tree-shaking
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
})