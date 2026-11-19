import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { BROWSER_API_BASE_PATH, parseServerEnv } from './src/config/env.ts'

const LOAD_ALL_ENV_PREFIXES = ''

type BuildApiProxyParams = {
  mode: string
}

type BuildApiProxyResult = {
  proxy: Record<string, ProxyOptions>
}

function buildApiProxy({ mode }: BuildApiProxyParams): BuildApiProxyResult {
  const { env } = parseServerEnv({ source: loadEnv(mode, process.cwd(), LOAD_ALL_ENV_PREFIXES) })
  const apiProxy: ProxyOptions = {
    target: env.API_URL,
    changeOrigin: true,
    rewrite: (path) => path.slice(BROWSER_API_BASE_PATH.length),
  }

  return { proxy: { [BROWSER_API_BASE_PATH]: apiProxy } }
}

export default defineConfig(({ command, mode }) => {
  const isServing = command === 'serve'

  return {
    resolve: { tsconfigPaths: true },
    server: isServing ? buildApiProxy({ mode }) : undefined,
    // In production the preview server only sits behind Caddy, which routes just the app's own domain to it
    preview: { allowedHosts: true },
    plugins: [devtools(), tailwindcss(), tanstackStart({ importProtection: { server: { excludeFiles: ['**/services/api.client.ts'] } } }), viteReact()],
  }
})
