// Server-only Supabase client (uses next/headers — do not import from client components)

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from './supabase'

export function createServerSupabase() {
  const { url, key } = getSupabaseEnv()
  return createServerClient<Database>(url, key, {
    cookies: {
      async getAll() {
        const store = await cookies()
        return store.getAll()
      },
      async setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          const store = await cookies()
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          )
        } catch {
          // Can't set cookies in Server Components (only in Actions/Routes)
        }
      },
    },
  })
}
