'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { role } = useAuth()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
        <nav className="flex items-center gap-4" aria-label="Main">
          <Link
            href="/dashboard"
            className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            7Unit Softwares Pvt. Ltd
          </Link>
          {role === 'admin' && (
            <>
              <Link
                href="/admin/employees"
                className={`text-sm ${pathname?.startsWith('/admin/employees') ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Employees
              </Link>
              <Link
                href="/admin/payslips"
                className={`text-sm ${pathname?.startsWith('/admin/payslips') ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Payslips
              </Link>
            </>
          )}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
