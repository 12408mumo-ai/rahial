import { describe, expect, it, vi } from 'vitest'
import {
  createSupabaseFetch,
  isSupabaseRequest,
  resolveSupabaseConfig,
} from '../../src/lib/supabase.js'

const SUPABASE_URL = 'https://demo.supabase.co'
const ANON_KEY = 'anon-key'

describe('Supabase environment resolver', () => {
  it('reads the VITE_ credential pair', () => {
    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: ` ${SUPABASE_URL} `,
        VITE_SUPABASE_ANON_KEY: ` ${ANON_KEY} `,
      }),
    ).toEqual({ url: SUPABASE_URL, anonKey: ANON_KEY })
  })

  it('reads the NEXT_PUBLIC_ credential pair', () => {
    expect(
      resolveSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
      }),
    ).toEqual({ url: SUPABASE_URL, anonKey: ANON_KEY })
  })

  it('supports a mixed prefix and removes a trailing URL slash', () => {
    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: `${SUPABASE_URL}/`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
      }),
    ).toEqual({ url: SUPABASE_URL, anonKey: ANON_KEY })
  })

  it('throws an explicit error when either value is missing', () => {
    expect(() => resolveSupabaseConfig({ VITE_SUPABASE_URL: SUPABASE_URL })).toThrow(
      /Missing Supabase configuration/,
    )
  })
})

describe('Supabase fetch header guard', () => {
  it('recognizes requests made to the configured project', () => {
    expect(
      isSupabaseRequest(`${SUPABASE_URL}/rest/v1/products`, SUPABASE_URL),
    ).toBe(true)
    expect(
      isSupabaseRequest(new Request(`${SUPABASE_URL}/rest/v1/orders`), SUPABASE_URL),
    ).toBe(true)
    expect(isSupabaseRequest('https://other.example.com/data', SUPABASE_URL)).toBe(
      false,
    )
  })

  it('adds apikey and bearer headers while preserving request headers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const guardedFetch = createSupabaseFetch({
      supabaseUrl: SUPABASE_URL,
      anonKey: ANON_KEY,
      fetchImpl,
    })

    await guardedFetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: 'stale-key',
        authorization: 'Bearer stale-key',
      },
    })

    const [input, init] = fetchImpl.mock.calls[0]
    expect(input).toBe(`${SUPABASE_URL}/rest/v1/products`)
    expect(init.headers.apikey).toBe(ANON_KEY)
    expect(init.headers.Authorization).toBe(`Bearer ${ANON_KEY}`)

    const headers = new Headers(init.headers)
    expect(headers.get('apikey')).toBe(ANON_KEY)
    expect(headers.get('authorization')).toBe(`Bearer ${ANON_KEY}`)
    expect(headers.get('content-type')).toBe('application/json')
  })

  it('adds headers when the fetch input is a Request object', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const guardedFetch = createSupabaseFetch({
      supabaseUrl: SUPABASE_URL,
      anonKey: ANON_KEY,
      fetchImpl,
    })
    const request = new Request(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })

    await guardedFetch(request)

    const [input, init] = fetchImpl.mock.calls[0]
    expect(input).toBe(request)
    expect(new Headers(init.headers).get('apikey')).toBe(ANON_KEY)
    expect(new Headers(init.headers).get('authorization')).toBe(
      `Bearer ${ANON_KEY}`,
    )
  })

  it('leaves unrelated requests untouched', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const guardedFetch = createSupabaseFetch({
      supabaseUrl: SUPABASE_URL,
      anonKey: ANON_KEY,
      fetchImpl,
    })
    const init = { headers: { 'X-Trace': 'abc' } }

    await guardedFetch('https://example.com/data', init)

    expect(fetchImpl).toHaveBeenCalledWith('https://example.com/data', init)
    expect(fetchImpl.mock.calls[0][1].headers).toEqual({ 'X-Trace': 'abc' })
  })
})
