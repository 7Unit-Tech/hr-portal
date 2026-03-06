'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/supabase/types'
import type { User } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  role: UserRole | null
  isLoading: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const role: UserRole | null = (user?.user_metadata?.role as UserRole | undefined) ?? null

  return { user, role, isLoading }
}
