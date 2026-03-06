import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PayslipInsert } from '@/lib/supabase/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role

  if (!user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PayslipInsert
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()
  const employeeId = body.employee_id

  // Pre-check: employee must exist (FK references employees.employee_id)
  const { data: emp, error: empError } = await admin
    .from('employees')
    .select('employee_id, name')
    .eq('employee_id', employeeId)
    .maybeSingle()

  if (empError) {
    return NextResponse.json({ error: `Employee lookup failed: ${empError.message}` }, { status: 400 })
  }
  if (!emp) {
    return NextResponse.json({
      error: `Employee not found. No row in employees with employee_id="${employeeId}".`,
    }, { status: 400 })
  }

  const { error } = await admin
    .from('payslips')
    .upsert(body, { onConflict: 'employee_id,month' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
