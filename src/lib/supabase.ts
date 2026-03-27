// ============================================
// OPTIMAL BREAKS — Supabase Client
// ============================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/** Permite `next build` sin .env; en runtime usa siempre URL y clave reales en Vercel. */
function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (url && key) return { url, key }
  return {
    url: 'https://placeholder.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  }
}

const { url: supabaseUrl, key: supabaseAnonKey } = supabaseEnv()

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export function createServerSupabase() {
  const { url, key } = supabaseEnv()
  return createClient<Database>(url, key)
}