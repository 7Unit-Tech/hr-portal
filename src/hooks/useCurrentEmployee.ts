'use client'

import { useCallback, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { Employee } from '@/lib/supabase/types'

interface UseCurrentEmployeeReturn {
  employee: Employee | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches the logged-in user's employee record (RLS: employees_select_own).
 * Used on employee dashboard for read-only salary view.
 */
export function useCurrentEmployee(): UseCurrentEmployeeReturn {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployee = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setEmployee(null)
        return
      }
      const { data, error: dbError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

      if (dbError) throw new Error(dbError.message)
      setEmployee(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployee() }, [fetchEmployee])

  return { employee, isLoading, error, refetch: fetchEmployee }
}
