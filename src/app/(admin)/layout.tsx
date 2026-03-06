import type { ReactNode } from 'react'

import { AppHeader } from '@/components/AppHeader'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        {children}
      </div>
    </div>
  )
}
