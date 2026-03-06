'use client'

import Link from 'next/link'
import { AlertCircle, RefreshCw, Users } from 'lucide-react'

import { useEmployees } from '@/hooks/useEmployees'

async function promoteToAdmin(email: string): Promise<void> {
  const res = await fetch('/api/admin/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? res.statusText)
}
import { EmployeeTable } from '@/components/admin/EmployeeTable'

// ── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border animate-pulse">
      {/* Header row */}
      <div className="flex gap-8 border-b border-border bg-muted/20 px-4 py-3">
        {[80, 140, 120, 100, 60].map(w => (
          <div key={w} className={`h-2.5 rounded-full bg-muted`} style={{ width: w }} />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-8 border-b border-border/60 px-4 py-3.5 last:border-b-0">
          <div className="h-3 w-16 rounded-full bg-muted" />
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded-full bg-muted" />
              <div className="h-2.5 w-36 rounded-full bg-muted" />
            </div>
          </div>
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-3 w-20 rounded-full bg-muted" />
          <div className="h-3 w-12 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const {
    employees,
    deletedEmployees,
    isLoading,
    error,
    refetch,
    addEmployee,
    importEmployees,
    updateEmployee,
    softDeleteEmployee,
    hardDeleteEmployee,
    restoreEmployee,
  } = useEmployees()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>7Unit Softwares India</span>
          <span aria-hidden="true" className="text-border">/</span>
          <span className="text-foreground">Employees</span>
        </nav>
        <div className="flex items-end justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Users className="size-5 text-muted-foreground" aria-hidden="true" />
            Team Directory
          </h1>
          <Link
            href="/admin/payslips"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Payroll →
          </Link>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={refetch}
            aria-label="Retry"
            className="flex items-center gap-1.5 text-xs font-medium underline-offset-2 hover:underline"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
        {isLoading ? (
          <SkeletonTable />
        ) : (
          <EmployeeTable
          employees={employees}
          deletedEmployees={deletedEmployees}
          onAdd={addEmployee}
          onImport={importEmployees}
          onUpdate={updateEmployee}
          onSoftDelete={softDeleteEmployee}
          onHardDelete={hardDeleteEmployee}
          onRestore={restoreEmployee}
          onPromoteToAdmin={promoteToAdmin}
        />
        )}
      </div>
    </main>
  )
}
