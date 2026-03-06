import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/lib/supabase/types'

/**
 * Browser Supabase client — safe to import in Client Components and hooks.
 * Re-uses a single instance across renders (createBrowserClient is memoised).
 * Never import this in Server Components or server actions — use server.ts.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
