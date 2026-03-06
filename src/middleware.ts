import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import type { Database } from '@/lib/supabase/types'
import type { UserRole } from '@/lib/supabase/types'

/**
 * Middleware runs on every matched request before the page renders.
 * Responsibilities:
 *   1. Refresh the Supabase session (rotates cookies on expiry).
 *   2. Redirect unauthenticated users to /login.
 *   3. Redirect employees away from /admin/* routes.
 *   4. Redirect already-authenticated users away from /login.
 *
 * IMPORTANT: createServerClient + auth.getUser() must stay together with no
 * code in between — the SSR package needs to finish its cookie work first.
 */
export async function middleware(request: NextRequest) {
  // Start with a passthrough response so cookies can be mutated.
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies onto the request first so the server client can read them.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Then rebuild the response with the updated request + set cookies on it.
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() validates the JWT with the Supabase auth server.
  // getSession() only reads the cookie without re-validation — do not use it here.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const role = user?.user_metadata?.role as UserRole | undefined

  // ── / (root) — redirect to login or home ─────────────────────────────────────
  if (pathname === '/' || pathname === '') {
    const dest = user ? (role === 'admin' ? '/admin/employees' : '/dashboard') : '/login'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // ── /login ──────────────────────────────────────────────────────────────────
  // Public. Already-authenticated users skip back to their home route.
  if (pathname.startsWith('/login')) {
    if (user) {
      const destination = role === 'admin' ? '/admin/employees' : '/dashboard'
      return NextResponse.redirect(new URL(destination, request.url))
    }
    return response
  }

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── /admin/* — admin only ────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match every route except:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - common image extensions
     *   - auth/callback (PKCE code exchange must run without a session)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
