import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

/**
 * Handles auth callback from:
 * 1. PKCE flow: ?code=<pkce-code>
 * 2. Magic-link (generateLink): ?token_hash=<hashed_token>
 *
 * URL shape: /auth/callback?code=...&next=/path  or  ?token_hash=...&next=/path
 *
 * On success, links employees.user_id to the signed-in user (by email)
 * so RLS and useCurrentEmployee work.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const next      = searchParams.get('next') ?? '/dashboard'

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  let success = false

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    success = !error && !!data.user
    if (success && data.user) {
      await linkEmployeeUserId(data.user.id, data.user.email)
    }
  } else if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      type:       'magiclink',
      token_hash: tokenHash,
    })
    success = !error && !!data.user
    if (success && data.user) {
      await linkEmployeeUserId(data.user.id, data.user.email)
    }
  }

  if (success) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

async function linkEmployeeUserId(userId: string, email: string | undefined) {
  if (!email) return
  try {
    const admin = createAdminClient()
    await admin
      .from('employees')
      .update({ user_id: userId })
      .eq('email', email)
  } catch {
    // Non-fatal: user can still use the app; link will happen on next sign-in
  }
}
