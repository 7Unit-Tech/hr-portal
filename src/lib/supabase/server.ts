import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from '@/lib/supabase/types'

/**
 * Server Supabase client — for Server Components, server actions, and Route Handlers.
 * Reads and writes the auth session via Next.js cookies().
 * Never import this in Client Components — use client.ts.
 *
 * Uses the anon key + user session (RLS enforced).
 * For service-role operations that bypass RLS, pass the SUPABASE_SERVICE_ROLE_KEY
 * only in specific admin server actions — never expose it to the client.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll is called from Server Components where cookies are read-only.
            // The middleware is responsible for refreshing the session in those cases.
          }
        },
      },
    },
  )
}
