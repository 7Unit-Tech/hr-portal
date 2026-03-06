'use client'

import { type FC, useState } from 'react'
import { Check, Download, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { downloadPayoutCSV } from '@/lib/csv/generate-payout'
import type { PayslipWithEmployee } from '@/lib/supabase/types'

interface ExportCsvButtonProps {
  payslips:   PayslipWithEmployee[]
  month:      string      // YYYY-MM-01 — used for filename
  disabled?:  boolean
  className?: string
}

type ExportState = 'idle' | 'generating' | 'done' | 'error'

export const ExportCsvButton: FC<ExportCsvButtonProps> = ({
  payslips,
  month,
  disabled,
  className,
}) => {
  const [state, setState] = useState<ExportState>('idle')

  const handleExport = async () => {
    if (state === 'generating' || disabled || payslips.length === 0) return
    setState('generating')
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 30))
      downloadPayoutCSV(payslips, month)
      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  const isDisabled = disabled || payslips.length === 0 || state === 'generating'

  const label = {
    idle:       `Export CSV (${payslips.length})`,
    generating: 'Generating…',
    done:       'Downloaded',
    error:      'Failed — retry',
  }[state]

  const Icon = {
    idle:       Download,
    generating: Loader2,
    done:       Check,
    error:      Download,
  }[state]

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium',
        'transition-all duration-150',
        // Default
        'border-border bg-card text-foreground',
        'hover:border-white/[0.14] hover:bg-white/[0.03]',
        // States
        isDisabled && 'cursor-not-allowed opacity-40',
        state === 'done'  && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
        state === 'error' && 'border-destructive/40 bg-destructive/10 text-destructive',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('size-3.5 shrink-0', state === 'generating' && 'animate-spin')}
      />
      {label}
    </button>
  )
}
