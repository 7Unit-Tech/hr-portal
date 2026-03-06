'use client'

import { type FC } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { dateToMonthParam, formatMonthLabel, formatRupees } from '@/lib/format'
import { getPdfLogoOptions } from '@/lib/pdf/logo-options'
import { DownloadButton } from '@/components/payslip/DownloadButton'
import type { PayslipComputed, PayslipWithEmployee } from '@/lib/supabase/types'

interface PayslipCardProps {
  payslip:           PayslipComputed
  onClick:           () => void
  /** When provided, shows a Download PDF button on the card (e.g. employee dashboard). */
  payslipForDownload?: PayslipWithEmployee
  index?:            number
  className?:        string
}

export const PayslipCard: FC<PayslipCardProps> = ({ payslip, onClick, payslipForDownload, index = 0, className }) => {
  const monthLabel = formatMonthLabel(payslip.month)
  const monthSlug  = dateToMonthParam(payslip.month)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`View payslip for ${monthLabel}`}
      style={{ animationDelay: `${index * 40}ms` }}
      className={cn(
        // Layout
        'group relative flex w-full flex-col rounded-xl p-5 text-left',
        // Surface — card bg from dark CSS vars
        'border border-border bg-card',
        // Interaction
        'cursor-pointer transition-colors duration-150',
        'hover:border-white/[0.14] hover:bg-white/[0.03]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // Active press
        'active:scale-[0.99] transition-transform',
        // Entrance animation
        'animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both',
        className,
      )}
    >
      {/* Top row: month + paid badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {monthLabel}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="size-3" aria-hidden="true" />
          Paid
        </span>
      </div>

      {/* Net pay */}
      <div className="mt-3">
        <p className="text-[28px] font-semibold tracking-tight text-foreground leading-none">
          {formatRupees(payslip.net_pay_cents)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">Net Pay</p>
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-border" />

      {/* Download button when full payslip data is available */}
      {payslipForDownload && (
        <div className="mb-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DownloadButton payslip={payslipForDownload} pdfOptions={getPdfLogoOptions()} className="h-8 px-3 text-xs" />
        </div>
      )}

      {/* Earnings / deductions footer */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Gross{' '}
            <span className="font-medium text-foreground/70">
              {formatRupees(payslip.gross_earnings_cents)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Deductions{' '}
            <span className="font-medium text-foreground/70">
              {formatRupees(payslip.total_deductions_cents)}
            </span>
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            {payslip.paid_days} days paid
            {payslip.lop_days > 0 && (
              <span className="ml-1 text-amber-500/80">· {payslip.lop_days} LOP</span>
            )}
          </p>
        </div>

        {/* Arrow — slides on hover */}
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        />
      </div>

      {/* Invisible URL metadata for accessibility */}
      <span className="sr-only">Month: {monthSlug}</span>
    </div>
  )
}
