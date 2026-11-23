// Vite-configuratie. Vite is de bundler/dev-server die react.dev aanbeveelt
// voor een React-app zonder framework. Zie https://vite.dev/config/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // De React-plugin zorgt voor JSX-ondersteuning en "Fast Refresh"
  // (wijzigingen in componenten verschijnen direct zonder state te verliezen).
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // opent automatisch de browser bij `npm run dev`
  },
})
