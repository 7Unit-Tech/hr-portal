'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, FileText } from 'lucide-react'

import { useEmployees } from '@/hooks/useEmployees'
import { useAdminPayslips } from '@/hooks/usePayslips'
import { PayslipCardAccordion } from '@/components/admin/PayslipCardAccordion'
import { ExportCsvButton } from '@/components/admin/ExportCsvButton'
import { formatMonthLabel, monthParamToDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Month navigation helpers ──────────────────────────────────────────────

function currentYYYYMM(): string {
  const now = new Date()
  const m   = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${m}`
}

function shiftMonth(yyyyMM: string, delta: number): string {
  const [y, m] = yyyyMM.split('-').map(Number)
  const d       = new Date(y, m - 1 + delta, 1)
  const nm      = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${nm}`
}

// ── PayslipForm skeleton ──────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-px overflow-hidden rounded-xl border border-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b border-border/60 bg-card last:border-b-0">
          {/* Employee header */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded-full bg-muted" />
                <div className="h-2.5 w-40 rounded-full bg-muted" />
              </div>
            </div>
          </div>
          {/* Field rows */}
          <div className="grid grid-cols-3 gap-6 px-5 pb-4">
            {Array.from({ length: 9 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-2 w-20 rounded-full bg-muted" />
                <div className="h-8 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PayslipsPage() {
  const [monthParam, setMonthParam] = useState(currentYYYYMM)
  const [expandAll, setExpandAll] = useState<boolean | null>(null)
  const [employeeFilter, setEmployeeFilter] = useState<string>('') // '' = all, else employee_id
  const monthDate = monthParamToDate(monthParam)

  const { employees, isLoading: empLoading, error: empError } = useEmployees()
  const {
    payslipsByEmployeeId,
    payslipsWithEmployee,
    isLoading: slipLoading,
    error:     slipError,
    refetch:   refetchPayslips,
  } = useAdminPayslips(monthDate)

  const activeEmployees = employees.filter(e => e.is_active)
  const filteredEmployees = useMemo(() => {
    if (!employeeFilter) return activeEmployees
    return activeEmployees.filter((e) => e.employee_id === employeeFilter)
  }, [activeEmployees, employeeFilter])
  const isLoading       = empLoading || slipLoading
  const error           = empError ?? slipError

  const savedCount = payslipsByEmployeeId.size
  const totalCount = activeEmployees.length
  const pendingCount = totalCount - savedCount

  // First pending employee (unsaved) expands by default; rest collapsed
  const defaultExpandedIndex = useMemo(() => {
    const list = employeeFilter ? filteredEmployees : activeEmployees
    const idx = list.findIndex((e) => !payslipsByEmployeeId.has(e.employee_id))
    return idx >= 0 ? idx : 0
  }, [activeEmployees, filteredEmployees, employeeFilter, payslipsByEmployeeId])

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>7Unit Softwares India</span>
          <span aria-hidden="true" className="text-border">/</span>
          <Link href="/admin/employees" className="hover:text-foreground transition-colors">
            Employees
          </Link>
          <span aria-hidden="true" className="text-border">/</span>
          <span className="text-foreground">Payroll</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Payroll
            </h1>

            {/* Employee filter */}
            {activeEmployees.length > 0 && (
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                aria-label="Filter by employee"
                className={cn(
                  'h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground',
                  'min-w-[180px] max-w-[220px]',
                  'focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10',
                )}
              >
                <option value="">All employees</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.employee_id}>
                    {emp.name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            )}

            {/* Month navigator */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
              <button
                type="button"
                onClick={() => setMonthParam(p => shiftMonth(p, -1))}
                aria-label="Previous month"
                className={cn(
                  'flex size-6 items-center justify-center rounded-md',
                  'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="min-w-[112px] text-center text-sm font-medium text-foreground">
                {formatMonthLabel(monthDate)}
              </span>
              <button
                type="button"
                onClick={() => setMonthParam(p => shiftMonth(p, +1))}
                aria-label="Next month"
                className={cn(
                  'flex size-6 items-center justify-center rounded-md',
                  'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Right: status + expand controls + export */}
          <div className="flex flex-wrap items-center gap-3">
            {!isLoading && totalCount > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className={cn('font-medium', savedCount > 0 ? 'text-emerald-400' : 'text-foreground')}>
                    {savedCount}
                  </span>
                  <span className="text-muted-foreground/60"> / {totalCount} saved</span>
                  {pendingCount > 0 && (
                    <span className="ml-1.5 text-amber-500/90">· {pendingCount} pending</span>
                  )}
                </p>
                <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => setExpandAll(true)}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                      'text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    )}
                    title="Expand all"
                  >
                    <ChevronDown className="size-3 rotate-180" />
                    Expand all
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandAll(false)}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                      'text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    )}
                    title="Collapse all"
                  >
                    <ChevronsUpDown className="size-3" />
                    Collapse all
                  </button>
                </div>
              </>
            )}
            <ExportCsvButton
              payslips={payslipsWithEmployee}
              month={monthDate}
              disabled={isLoading || payslipsWithEmployee.length === 0}
            />
          </div>
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
        </div>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      {isLoading ? (
        <FormSkeleton />
      ) : activeEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
          <p className="text-sm font-medium text-foreground">No active employees</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/admin/employees" className="underline underline-offset-2 hover:text-foreground">
              Add employees
            </Link>{' '}
            first, then return here to enter payroll.
          </p>
        </div>
      ) : (
        <div
          aria-label="Employee payslip cards"
          className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-3"
        >
          {filteredEmployees.map((emp, i) => (
            <PayslipCardAccordion
              key={emp.id}
              employee={emp}
              existingPayslip={payslipsByEmployeeId.get(emp.employee_id) ?? null}
              month={monthDate}
              onSaved={refetchPayslips}
              defaultExpanded={employeeFilter ? true : i === defaultExpandedIndex}
              expanded={expandAll ?? undefined}
            />
          ))}
        </div>
      )}
    </main>
  )
}
