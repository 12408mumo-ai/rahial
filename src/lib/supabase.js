import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL_ENV_KEYS = [
  'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
]

export const SUPABASE_ANON_KEY_ENV_KEYS = [
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const FETCH_BASE = Symbol.for('creewrld.supabase.baseFetch')
const FETCH_CONFIG = Symbol.for('creewrld.supabase.fetchConfig')

function cleanValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function firstValue(env, names) {
  for (const name of names) {
    const value = cleanValue(env?.[name])
    if (value) return value
  }

  return ''
}

function metaEnvironment() {
  try {
    return import.meta.env || {}
  } catch {
    return {}
  }
}

function processEnvironment() {
  return globalThis.process?.env || {}
}

export function getSupabaseEnv() {
  return {
    ...processEnvironment(),
    ...metaEnvironment(),
  }
}

export function resolveSupabaseConfig(env = getSupabaseEnv()) {
  const url = firstValue(env, SUPABASE_URL_ENV_KEYS)
  const anonKey = firstValue(env, SUPABASE_ANON_KEY_ENV_KEYS)

  if (!url || !anonKey) {
    throw new Error(
      '[CREE WRLD] Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or their NEXT_PUBLIC_ equivalents.',
    )
  }

  return {
    url: url.replace(/\/+$/, ''),
    anonKey,
  }
}

function extractRequestUrl(input) {
  if (typeof input === 'string') return input

  if (input && typeof input === 'object') {
    if (typeof input.url === 'string') return input.url
    if (typeof input.href === 'string') return input.href
  }

  return ''
}

export function isSupabaseRequest(input, supabaseUrl) {
  const rawUrl = extractRequestUrl(input)
  if (!rawUrl || !supabaseUrl) return false

  try {
    const requestUrl = new URL(rawUrl, 'http://creewrld.invalid')
    const apiUrl = new URL(supabaseUrl)
    return requestUrl.origin === apiUrl.origin
  } catch {
    return false
  }
}

function withSupabaseHeaders(input, init, anonKey) {
  const merged = new Headers()
  const inputHeaders = input && typeof input === 'object' ? input.headers : undefined

  if (inputHeaders) {
    new Headers(inputHeaders).forEach((value, name) => merged.set(name, value))
  }

  if (init?.headers) {
    new Headers(init.headers).forEach((value, name) => merged.set(name, value))
  }

  const headers = {}
  merged.forEach((value, name) => {
    const normalizedName = name.toLowerCase()
    if (normalizedName === 'apikey' || normalizedName === 'authorization') return
    headers[name] = value
  })

  headers.apikey = anonKey
  headers.Authorization = `Bearer ${anonKey}`

  return headers
}

function invokeFetch(fetchImpl, fallbackFetch, input, init) {
  const activeFetch = globalThis.fetch
  const unwrappedActiveFetch =
    typeof activeFetch === 'function' ? activeFetch[FETCH_BASE] || activeFetch : undefined
  const baseFetch =
    typeof fetchImpl === 'function'
      ? fetchImpl
      : unwrappedActiveFetch || fallbackFetch

  if (typeof baseFetch !== 'function') {
    return Promise.reject(new Error('[CREE WRLD] fetch is not available.'))
  }

  return baseFetch(input, init)
}

export function createSupabaseFetch({
  supabaseUrl,
  anonKey,
  fetchImpl,
  fallbackFetch,
} = {}) {
  return function supabaseFetch(input, init = {}) {
    if (!isSupabaseRequest(input, supabaseUrl)) {
      return invokeFetch(fetchImpl, fallbackFetch, input, init)
    }

    return invokeFetch(fetchImpl, fallbackFetch, input, {
      ...init,
      headers: withSupabaseHeaders(input, init, anonKey),
    })
  }
}

export function restoreGlobalFetch() {
  const activeFetch = globalThis.fetch
  const baseFetch = activeFetch?.[FETCH_BASE]

  if (typeof baseFetch === 'function') {
    globalThis.fetch = baseFetch
  }
}

export function installGlobalFetchGuard({ supabaseUrl, anonKey }) {
  const activeFetch = globalThis.fetch
  const baseFetch =
    typeof activeFetch === 'function' && activeFetch[FETCH_BASE]
      ? activeFetch[FETCH_BASE]
      : activeFetch

  const fallbackFetch = typeof baseFetch === 'function' ? baseFetch : undefined
  const guardedFetch = createSupabaseFetch({
    supabaseUrl,
    anonKey,
    fallbackFetch,
  })

  const guard = (input, init) => guardedFetch(input, init)
  guard[FETCH_BASE] = fallbackFetch
  guard[FETCH_CONFIG] = { supabaseUrl, anonKey }
  globalThis.fetch = guard

  return { fetch: guard, guardedFetch, baseFetch: fallbackFetch }
}

let clientSequence = 0

export function createSupabaseStorefrontClient(config = resolveSupabaseConfig()) {
  const { url, anonKey } = config
  const { guardedFetch } = installGlobalFetchGuard({
    supabaseUrl: url,
    anonKey,
  })

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      // A unique key prevents GoTrue's multiple-client warning when a test
      // resets the lazy client; no session is ever persisted by this app.
      storageKey: `cree-wrld-no-session-${clientSequence++}`,
    },
    global: {
      fetch: guardedFetch,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    },
  })
}

let cachedClient = null
let cachedConfig = null

function initializeClient() {
  if (!cachedClient) {
    cachedConfig = resolveSupabaseConfig()
    cachedClient = createSupabaseStorefrontClient(cachedConfig)
  }

  return cachedClient
}

export function getSupabaseClient() {
  return initializeClient()
}

export function getSupabaseConfig() {
  initializeClient()
  return cachedConfig
}

export function resetSupabaseClient() {
  cachedClient = null
  cachedConfig = null
  restoreGlobalFetch()
}

try {
  // Create the conventional client eagerly when configuration is available,
  // while keeping the exported object lazy so tests can change env safely.
  initializeClient()
} catch {
  // vite.config.js fails the build when these variables are missing. Keeping
  // import time non-throwing also lets unit tests inspect the helpers directly.
}

const lazySupabaseClient = new Proxy(Object.create(null), {
  get(_target, property) {
    const client = getSupabaseClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
  has(_target, property) {
    return property in getSupabaseClient()
  },
  ownKeys() {
    return Reflect.ownKeys(getSupabaseClient())
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(
      getSupabaseClient(),
      property,
    )
    if (descriptor) descriptor.configurable = true
    return descriptor
  },
})

export const supabase = lazySupabaseClient
export default supabase
