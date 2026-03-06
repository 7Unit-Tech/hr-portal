'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Calendar, RefreshCw } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee'
import { usePayslips } from '@/hooks/usePayslips'
import { PayslipCard } from '@/components/payslip/PayslipCard'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getMonthYearOptions() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  return { months: MONTHS, years }
}

// ── Skeleton card ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="h-3 w-12 rounded-full bg-muted" />
      </div>
      <div className="mt-4 h-8 w-32 rounded-lg bg-muted" />
      <div className="mt-1.5 h-3 w-16 rounded-full bg-muted" />
      <div className="my-4 h-px bg-border" />
      <div className="space-y-2">
        <div className="h-3 w-40 rounded-full bg-muted" />
        <div className="h-3 w-36 rounded-full bg-muted" />
        <div className="h-2.5 w-20 rounded-full bg-muted" />
      </div>
    </div>
  )
}

const selectCls = cn(
  'h-9 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground',
  'focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10',
  'transition-colors',
)

// ── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { employee } = useCurrentEmployee()
  const { payslips, isLoading, error, refetch } = usePayslips()

  const now = useMemo(() => new Date(), [])
  const { months, years } = useMemo(() => getMonthYearOptions(), [])

  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const displayName =
    employee?.name
    ?? (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? ''

  const selectedMonthStr = `${year}-${String(month).padStart(2, '0')}-01`
  const filteredPayslip = useMemo(
    () => payslips.find(p => p.month === selectedMonthStr),
    [payslips, selectedMonthStr],
  )

  const handleCardClick = () => {
    router.push(`/payslips/${year}-${String(month).padStart(2, '0')}`)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          7Unit Softwares India
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {displayName ? `Good to see you, ${displayName}` : 'Payslips'}
        </h1>
      </div>

      {/* ── Month / Year filter ────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">View payslip for</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Select month"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className={selectCls}
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            aria-label="Select year"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className={selectCls}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Error state ────────────────────────────────────── */}
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
            aria-label="Retry loading payslips"
            className="flex items-center gap-1.5 text-xs font-medium underline-offset-2 hover:underline"
          >
            <RefreshCw className="size-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* ── Payslip content ────────────────────────────────── */}
      {isLoading ? (
        <SkeletonCard />
      ) : filteredPayslip ? (
        <div role="article" aria-label={`Payslip for ${months[month - 1]} ${year}`}>
          <PayslipCard
            payslip={filteredPayslip}
            payslipForDownload={filteredPayslip}
            index={0}
            onClick={handleCardClick}
          />
        </div>
      ) : !error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <span className="text-xl">📄</span>
          </div>
          <h2 className="text-sm font-medium text-foreground">
            No payslip for {months[month - 1]} {year}
          </h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Your payslip for this month hasn&apos;t been published yet. Try selecting another month.
          </p>
        </div>
      ) : null}
    </main>
  )
}
