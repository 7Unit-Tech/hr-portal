'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'

import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { usePayslip } from '@/hooks/usePayslips'
import { PayslipDetail } from '@/components/payslip/PayslipDetail'
import { formatMonthLabel, monthParamToDate } from '@/lib/format'

// ── Skeleton ──────────────────────────────────────────────────────────────

function PayslipDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded-lg bg-muted" />
            <div className="h-3.5 w-56 rounded-full bg-muted" />
          </div>
          <div className="h-6 w-16 rounded-md bg-muted" />
        </div>
        <div className="mt-4 flex gap-6 border-t border-border pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 w-14 rounded-full bg-muted" />
              <div className="h-3.5 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
      {/* Two-col breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map(col => (
          <div key={col} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-2.5 w-20 rounded-full bg-muted" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-32 rounded-full bg-muted" />
                <div className="h-3 w-20 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Net pay banner */}
      <div className="rounded-xl border border-white/[0.08] bg-[#17171c] px-6 py-5">
        <div className="space-y-2">
          <div className="h-2.5 w-16 rounded-full bg-muted" />
          <div className="h-9 w-44 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ month: string }>
}

export default function PayslipPage({ params }: PageProps) {
  const { month }  = use(params)
  const router     = useRouter()
  const { employee, isLoading: employeeLoading } = useCurrentEmployee()
  const { payslip, isLoading, error } = usePayslip(month, employee?.employee_id ?? employee?.id)

  const monthLabel = formatMonthLabel(monthParamToDate(month))

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* ── Back nav ───────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back to payslips"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>

        {/* Breadcrumb */}
        <span className="text-muted-foreground/40" aria-hidden="true">/</span>
        <span className="text-sm text-foreground">{monthLabel}</span>
      </div>

      {/* ── Error state ────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Could not load payslip</p>
            <p className="mt-0.5 text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      {(employeeLoading || isLoading) && <PayslipDetailSkeleton />}

      {!isLoading && !error && payslip && (
        <PayslipDetail payslip={payslip} />
      )}

      {!isLoading && !error && !payslip && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
          <h2 className="text-sm font-medium text-foreground">Payslip not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No payslip found for {monthLabel}.
          </p>
        </div>
      )}
    </main>
  )
}
