'use client'

import { type FC } from 'react'

import { formatDate, formatMonthLabel, formatRupees } from '@/lib/format'
import { getPdfLogoOptions } from '@/lib/pdf/logo-options'
import type { PayslipWithEmployee } from '@/lib/supabase/types'
import { DownloadButton } from './DownloadButton'

interface PayslipDetailProps {
  payslip: PayslipWithEmployee
}

// ── Sub-components ────────────────────────────────────────────────────────

interface LineItemProps {
  label:     string
  cents:     number
  emphasis?: boolean
}

const LineItem: FC<LineItemProps> = ({ label, cents, emphasis }) => (
  <div className={`flex items-baseline justify-between py-2.5 ${emphasis ? 'border-t border-border mt-1 pt-3' : ''}`}>
    <span className={emphasis ? 'text-sm font-semibold text-foreground' : 'text-sm text-muted-foreground'}>
      {label}
    </span>
    <span className={emphasis ? 'text-sm font-semibold text-foreground' : 'text-sm tabular-nums text-foreground/80'}>
      {formatRupees(cents)}
    </span>
  </div>
)

interface MetaPillProps {
  label: string
  value: string | number
}

const MetaPill: FC<MetaPillProps> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
      {label}
    </span>
    <span className="text-sm font-medium text-foreground/80">{value}</span>
  </div>
)

// ── Main component ────────────────────────────────────────────────────────

export const PayslipDetail: FC<PayslipDetailProps> = ({ payslip }) => {
  const { employee } = payslip

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* ── Employee header ──────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {employee?.name ?? 'Employee'}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {employee
                ? `${employee.designation} · ${employee.department}`
                : `ID: ${payslip.employee_id}`}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
            {employee?.employee_id ?? payslip.employee_id}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap gap-6 border-t border-border pt-4">
          <MetaPill label="Pay Period"  value={formatMonthLabel(payslip.month)} />
          <MetaPill label="Pay Date"    value={formatDate(payslip.pay_date)} />
          <MetaPill label="Paid Days"   value={payslip.paid_days} />
          <MetaPill label="LOP Days"    value={payslip.lop_days} />
        </div>
      </div>

      {/* ── Earnings + Deductions ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Earnings */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Earnings
          </h3>
          <div className="divide-y divide-border/60">
            <LineItem label="Basic Pay"         cents={payslip.basic_pay_cents} />
            <LineItem label="HRA"               cents={payslip.hra_cents} />
            <LineItem label="Special Allowance" cents={payslip.special_allowance_cents} />
          </div>
          <LineItem label="Gross Earnings" cents={payslip.gross_earnings_cents} emphasis />
        </div>

        {/* Deductions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Deductions
          </h3>
          <div className="divide-y divide-border/60">
            <LineItem label="Income Tax"       cents={payslip.income_tax_cents} />
            <LineItem label="Provident Fund"   cents={payslip.pf_cents} />
            <LineItem label="Professional Tax" cents={payslip.professional_tax_cents} />
          </div>
          <LineItem label="Total Deductions" cents={payslip.total_deductions_cents} emphasis />
        </div>
      </div>

      {/* ── Net Pay banner ───────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#17171c] px-6 py-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Net Pay
          </p>
          <p className="mt-1 text-[32px] font-semibold tracking-tight text-foreground leading-none">
            {formatRupees(payslip.net_pay_cents)}
          </p>
        </div>
        <DownloadButton payslip={payslip} pdfOptions={getPdfLogoOptions()} />
      </div>
    </div>
  )
}
