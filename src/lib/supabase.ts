// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseFnUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL

if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is missing')
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is missing')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: helper to safely build function endpoint
export const fn = (path: string) => {
  if (!supabaseFnUrl) throw new Error('VITE_SUPABASE_FUNCTION_URL is missing')
  return `${supabaseFnUrl}/${path.replace(/^\/+/, '')}`
}