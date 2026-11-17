import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // In production the preview server only sits behind Caddy, which routes just the app's own domain to it
  preview: { allowedHosts: true },
  plugins: [devtools(), tailwindcss(), tanstackStart({ importProtection: { server: { excludeFiles: ['**/services/api.client.ts'] } } }), viteReact()],
})

export default config
