import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Public text walkthrough preview. GitHub Pages cannot run the voice-token Worker.
export default defineConfig({
  base: '/groomnote-ai/',
  plugins: [react()],
  build: { outDir: 'dist/pages' },
})
