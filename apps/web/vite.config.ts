import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Suppress the red error overlay on syntax errors. While the agent is
    // mid-stream the preview will briefly see incomplete files; the runnable
    // gate runs at end-of-step. A transient parse error is not user-visible
    // without this.
    hmr: {
      overlay: false,
    },
  },
})
