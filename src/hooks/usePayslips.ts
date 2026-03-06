'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { monthParamToDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Employee, Payslip, PayslipComputed, PayslipInsert, PayslipWithEmployee } from '@/lib/supabase/types'

// ── Derived field computation ──────────────────────────────────────────────

function computePayslip(p: Payslip): PayslipComputed {
  const gross = p.basic_pay_cents + p.hra_cents + p.special_allowance_cents
  const deductions = p.income_tax_cents + p.pf_cents + p.professional_tax_cents
  return {
    ...p,
    gross_earnings_cents:   gross,
    total_deductions_cents: deductions,
    net_pay_cents:          gross - deductions,
  }
}

// ── usePayslips (dashboard list, employee view) ────────────────────────────
// Returns payslips with employee join so PDF download works from the card.

type EmployeePayslipRaw = Payslip & {
  employee: Pick<Employee, 'id' | 'name' | 'employee_id' | 'email' | 'designation' | 'department' | 'bank_account' | 'ifsc_code' | 'date_of_joining' | 'pf_uan'>
}

interface UsePayslipsReturn {
  payslips:  PayslipWithEmployee[]
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

export function usePayslips(): UsePayslipsReturn {
  const [payslips, setPayslips]   = useState<PayslipWithEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(
            id, name, employee_id, email,
            designation, department,
            bank_account, ifsc_code,
            date_of_joining, pf_uan
          )
        `)
        .is('deleted_at', null)
        .order('month', { ascending: false })

      if (dbError) throw new Error(dbError.message)
      const rows = (data ?? []) as unknown as EmployeePayslipRaw[]
      setPayslips(rows.map((r) => ({ ...computePayslip(r), employee: r.employee }) as PayslipWithEmployee))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payslips')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayslips() }, [fetchPayslips])

  return { payslips, isLoading, error, refetch: fetchPayslips }
}

// ── usePayslip (single month detail) ─────────────────────────────────────

// Raw shape returned by the Supabase join — cast at the query boundary
type PayslipJoinRaw = Payslip & {
  employee: Pick<Employee, 'id' | 'name' | 'employee_id' | 'email' | 'designation' | 'department' | 'bank_account' | 'ifsc_code' | 'date_of_joining' | 'pf_uan'>
}

interface UsePayslipReturn {
  payslip:   PayslipWithEmployee | null
  isLoading: boolean
  error:     string | null
}

/**
 * Fetches the payslip for a given month.
 * Pass employeeId to scope to the current user's payslip (avoids PGRST116 when
 * admin RLS returns multiple rows for that month).
 */
export function usePayslip(monthParam: string, employeeId?: string | null): UsePayslipReturn {
  const [payslip, setPayslip]     = useState<PayslipWithEmployee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (employeeId === undefined) {
      setPayslip(null)
      setError(null)
      setIsLoading(false)
      return
    }

    async function fetch() {
      setIsLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        let query = supabase
          .from('payslips')
          .select(`
            *,
            employee:employees(
              id, name, employee_id, email,
              designation, department,
              bank_account, ifsc_code,
              date_of_joining, pf_uan
            )
          `)
          .eq('month', monthParamToDate(monthParam))
          .is('deleted_at', null)

        if (employeeId) {
          query = query.eq('employee_id', employeeId)
        }
        const { data, error: dbError } = await query.maybeSingle()

        if (dbError) throw new Error(dbError.message)
        if (cancelled) return

        if (!data) {
          setPayslip(null)
          return
        }
        const raw     = data as unknown as PayslipJoinRaw
        const computed = computePayslip(raw)
        setPayslip({ ...computed, employee: raw.employee })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Payslip not found')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [monthParam, employeeId])

  return { payslip, isLoading, error }
}

// ── useAdminPayslips (all payslips for a month, admin view) ───────────────
// Returns a Map for O(1) form pre-population + a joined array for CSV export.

type AdminPayslipRaw = Payslip & {
  employee: Pick<Employee, 'id' | 'name' | 'employee_id' | 'email' | 'designation' | 'department' | 'bank_account' | 'ifsc_code' | 'date_of_joining' | 'pf_uan'>
}

interface UseAdminPayslipsReturn {
  payslipsByEmployeeId: Map<string, Payslip>
  payslipsWithEmployee:  PayslipWithEmployee[]
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

export function useAdminPayslips(monthDate: string): UseAdminPayslipsReturn {
  const [rows, setRows]           = useState<AdminPayslipRaw[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
        const { data, error: dbError } = await supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(
            id, name, employee_id, email,
            designation, department,
            bank_account, ifsc_code,
            date_of_joining, pf_uan
          )
        `)
        .eq('month', monthDate)
        .is('deleted_at', null)

      if (dbError) throw new Error(dbError.message)
      setRows((data ?? []) as unknown as AdminPayslipRaw[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payslips')
    } finally {
      setIsLoading(false)
    }
  }, [monthDate])

  useEffect(() => { fetchPayslips() }, [fetchPayslips])

  const payslipsByEmployeeId = useMemo(() => {
    const map = new Map<string, Payslip>()
    rows.forEach(r => map.set(r.employee_id, r))
    return map
  }, [rows])

  const payslipsWithEmployee = useMemo(() =>
    rows.map(r => ({ ...computePayslip(r), employee: r.employee }) as PayslipWithEmployee),
    [rows],
  )

  return { payslipsByEmployeeId, payslipsWithEmployee, isLoading, error, refetch: fetchPayslips }
}

// ── useSavePayslip (upsert one payslip row) ───────────────────────────────

interface UseSavePayslipReturn {
  savePayslip: (data: PayslipInsert) => Promise<void>
  isSaving:    boolean
}

export function useSavePayslip(): UseSavePayslipReturn {
  const [isSaving, setIsSaving] = useState(false)

  const savePayslip = async (data: PayslipInsert): Promise<void> => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/payslips/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? res.statusText)
    } finally {
      setIsSaving(false)
    }
  }

  return { savePayslip, isSaving }
}
