import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/M3FlowWeb/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (id.includes('node_modules/@codemirror') || id.includes('node_modules/@uiw') || id.includes('node_modules/@replit')) return 'codemirror';
          if (id.includes('node_modules/mermaid')) return 'mermaid';
          if (id.includes('node_modules/@blocknote')) return 'blocknote';
          if (id.includes('node_modules/react') || id.includes('node_modules/zustand')) return 'react';
        }
      }
    }
  }
})
