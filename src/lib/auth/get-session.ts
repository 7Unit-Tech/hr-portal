import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { UserMetadata, UserRole } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'

export interface AuthSession {
  user: User
  role: UserRole
  metadata: UserMetadata
}

/**
 * Returns the current session or null if unauthenticated.
 * Uses getUser() — validates the JWT server-side, not just cookie reads.
 * Safe to call from any Server Component or server action.
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error ?? !user) return null

  const role = user.user_metadata?.role as UserRole | undefined
  if (!role) return null

  return {
    user,
    role,
    metadata: user.user_metadata as UserMetadata,
  }
}

/**
 * Returns the current session or redirects to /login.
 * Use in Server Components / server actions that require authentication.
 */
export async function requireSession(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/**
 * Returns the current session or redirects.
 * Use in Server Components / server actions that require admin access.
 * Non-admins are sent to /dashboard, not /login.
 */
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireSession()
  if (session.role !== 'admin') redirect('/dashboard')
  return session
}
