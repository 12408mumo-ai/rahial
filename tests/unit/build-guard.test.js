import { describe, expect, it } from 'vitest'
import {
  SUPABASE_ANON_KEY_ENV_KEYS,
  SUPABASE_URL_ENV_KEYS,
  assertSupabaseBuildEnv,
  firstEnvValue,
} from '../../vite.config.js'

describe('Vite build environment guard', () => {
  it('declares both supported credential families', () => {
    expect(SUPABASE_URL_ENV_KEYS).toEqual([
      'VITE_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
    ])
    expect(SUPABASE_ANON_KEY_ENV_KEYS).toEqual([
      'VITE_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ])
  })

  it('accepts VITE_ variables', () => {
    expect(
      assertSupabaseBuildEnv({
        VITE_SUPABASE_URL: 'https://demo.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({ url: 'https://demo.supabase.co', anonKey: 'anon-key' })
  })

  it('accepts NEXT_PUBLIC_ variables', () => {
    expect(
      assertSupabaseBuildEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({ url: 'https://demo.supabase.co', anonKey: 'anon-key' })
  })

  it('fails early with the missing variable names', () => {
    expect(() => assertSupabaseBuildEnv({})).toThrow(
      /Build stopped: missing required environment variable\(s\): VITE_SUPABASE_URL.*VITE_SUPABASE_ANON_KEY/,
    )
  })

  it('ignores whitespace-only values', () => {
    expect(
      firstEnvValue(
        { VITE_SUPABASE_URL: '   ', NEXT_PUBLIC_SUPABASE_URL: ' https://ok ' },
        SUPABASE_URL_ENV_KEYS,
      ),
    ).toBe('https://ok')
  })
})
