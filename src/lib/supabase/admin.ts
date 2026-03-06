import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/types'

/**
 * Admin client with service role — bypasses RLS.
 * Use ONLY in server-side code (API routes, server actions).
 * Never expose or import in client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase admin env vars')
  return createClient<Database>(url, key)
}
