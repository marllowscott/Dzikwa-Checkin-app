import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep React and react-dom in single chunk to prevent hook issues
        // Also keep recharts with React to avoid initialization errors
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group third-party libraries but keep React together
            if (id.includes('react-dom') || id.includes('react') || id.includes('scheduler') || id.includes('recharts')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-router',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'recharts'
    ],
    // Force re-include React to fix hook issues
    force: true,
  },
}));
