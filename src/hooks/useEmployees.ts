'use client'

import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Employee, EmployeeInsert, EmployeeUpdate } from '@/lib/supabase/types'

interface UseEmployeesReturn {
  employees:          Employee[]
  deletedEmployees:   Employee[]
  isLoading:          boolean
  error:              string | null
  refetch:            () => void
  addEmployee:        (data: EmployeeInsert) => Promise<void>
  importEmployees:    (data: EmployeeInsert[]) => Promise<{ imported: number; failed: number }>
  updateEmployee:     (id: string, data: EmployeeUpdate) => Promise<void>
  softDeleteEmployee: (id: string) => Promise<void>
  hardDeleteEmployee: (id: string) => Promise<void>
  restoreEmployee:    (id: string) => Promise<void>
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees]         = useState<Employee[]>([])
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading]         = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('employees')
        .select('*')
        .is('deleted_at', null)
        .order('employee_id')

      if (dbError) throw new Error(dbError.message)
      setEmployees(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchDeletedEmployees = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error: dbError } = await supabase
        .from('employees')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      if (dbError) throw new Error(dbError.message)
      setDeletedEmployees(data ?? [])
    } catch {
      // Non-blocking; active list is primary
    }
  }, [])

  const addEmployee = async (data: EmployeeInsert): Promise<void> => {
    const supabase = createClient()
    const { error: dbError } = await supabase.from('employees').insert(data)
    if (dbError) throw new Error(dbError.message)
    await fetchEmployees()
    // Send welcome email (fire-and-forget; do not block or throw)
    try {
      await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, name: data.name }),
      })
    } catch {
      // ignore
    }
  }

  const importEmployees = async (rows: EmployeeInsert[]): Promise<{ imported: number; failed: number }> => {
    const supabase = createClient()
    let imported = 0
    let failed = 0
    for (const row of rows) {
      const { error } = await supabase.from('employees').insert(row)
      if (error) {
        failed++
      } else {
        imported++
        try {
          await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: row.email, name: row.name }),
          })
        } catch { /* ignore */ }
      }
    }
    await fetchEmployees()
    await fetchDeletedEmployees()
    return { imported, failed }
  }

  const updateEmployee = async (id: string, data: EmployeeUpdate): Promise<void> => {
    const supabase = createClient()
    const { error: dbError } = await supabase.from('employees').update(data).eq('id', id)
    if (dbError) throw new Error(dbError.message)
    await fetchEmployees()
    await fetchDeletedEmployees()
  }

  const softDeleteEmployee = async (id: string): Promise<void> => {
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('employees')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
    if (dbError) throw new Error(dbError.message)
    await fetchEmployees()
    await fetchDeletedEmployees()
  }

  const hardDeleteEmployee = async (id: string): Promise<void> => {
    const supabase = createClient()
    const { data: payslips } = await supabase
      .from('payslips')
      .select('id')
      .eq('employee_id', id)
      .limit(1)
    if (payslips && payslips.length > 0) {
      throw new Error('Cannot permanently delete: employee has payslips. Soft delete instead.')
    }
    const { error: dbError } = await supabase.from('employees').delete().eq('id', id)
    if (dbError) throw new Error(dbError.message)
    await fetchEmployees()
    await fetchDeletedEmployees()
  }

  const restoreEmployee = async (id: string): Promise<void> => {
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('employees')
      .update({ deleted_at: null, is_active: true })
      .eq('id', id)
    if (dbError) throw new Error(dbError.message)
    await fetchEmployees()
    await fetchDeletedEmployees()
  }

  useEffect(() => {
    void fetchEmployees().then(() => void fetchDeletedEmployees())
  }, [fetchEmployees, fetchDeletedEmployees])

  const refetchAll = useCallback(async () => {
    await fetchEmployees()
    await fetchDeletedEmployees()
  }, [fetchEmployees, fetchDeletedEmployees])

  return {
    employees,
    deletedEmployees,
    isLoading,
    error,
    refetch: refetchAll,
    addEmployee,
    importEmployees,
    updateEmployee,
    softDeleteEmployee,
    hardDeleteEmployee,
    restoreEmployee,
  }
}
