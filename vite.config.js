import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export const SUPABASE_URL_ENV_KEYS = [
  'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
]

export const SUPABASE_ANON_KEY_ENV_KEYS = [
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

function cleanValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function firstEnvValue(env, names) {
  if (!env || typeof env !== 'object') return ''

  for (const name of names) {
    const value = cleanValue(env[name])
    if (value) return value
  }

  return ''
}

export function assertSupabaseBuildEnv(env) {
  const url = firstEnvValue(env, SUPABASE_URL_ENV_KEYS)
  const anonKey = firstEnvValue(env, SUPABASE_ANON_KEY_ENV_KEYS)
  const missing = []

  if (!url) {
    missing.push('VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  }
  if (!anonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  if (missing.length > 0) {
    throw new Error(
      `[CREE WRLD] Build stopped: missing required environment variable(s): ${missing.join(
        ', ',
      )}. Add them to .env or the deployment environment before building.`,
    )
  }

  return { url, anonKey }
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const env = { ...fileEnv, ...process.env }
  const { url, anonKey } = assertSupabaseBuildEnv(env)

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anonKey),
      'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(anonKey),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: true,
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 800,
    },
  }
})
