import type { ReactNode } from 'react'

import { AppHeader } from '@/components/AppHeader'

interface EmployeeLayoutProps {
  children: ReactNode
}

/**
 * Activates the dark theme for all employee routes by placing the `.dark` class
 * on the outermost wrapper — this triggers the dark CSS custom properties defined
 * in globals.css for every descendant element.
 */
export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return (
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        {children}
      </div>
    </div>
  )
}
