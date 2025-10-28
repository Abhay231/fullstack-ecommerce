import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    include: "**/*.{jsx,tsx,js,ts}",
  })],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    assetsDir: 'static'
  },
  define: {
    // Replace process.env with import.meta.env for Vite
    global: 'globalThis',
  },
  envPrefix: 'REACT_APP_',
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "tsx"
      }
    }
  }
})
