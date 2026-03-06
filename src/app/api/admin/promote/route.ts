import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Promote a user to admin by email.
 * Requires the caller to be an admin. Uses Supabase Auth Admin API.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role

  if (!user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (!targetUser) {
    return NextResponse.json(
      { error: 'No account found with this email. User must sign in once before promoting to admin.' },
      { status: 404 },
    )
  }

  const merged = { ...targetUser.user_metadata, role: 'admin' }
  const { error } = await admin.auth.admin.updateUserById(targetUser.id, {
    user_metadata: merged,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
