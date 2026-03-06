'use client'

import { type FC, useState } from 'react'
import { Check, Download, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { generatePayslipPDF, type GeneratePayslipOptions } from '@/lib/pdf/generate-payslip'
import type { PayslipWithEmployee } from '@/lib/supabase/types'

interface DownloadButtonProps {
  payslip:    PayslipWithEmployee
  className?: string
  /** Optional PDF options (e.g. logoDataUrl for company logo). */
  pdfOptions?: GeneratePayslipOptions
}

type DownloadState = 'idle' | 'generating' | 'done' | 'error'

export const DownloadButton: FC<DownloadButtonProps> = ({ payslip, className, pdfOptions }) => {
  const [state, setState] = useState<DownloadState>('idle')

  const handleDownload = async () => {
    if (state === 'generating') return
    setState('generating')
    try {
      // jsPDF is synchronous but may take a moment for large payslips —
      // yield to the browser first so the loading state renders.
      await new Promise<void>(resolve => setTimeout(resolve, 50))
      generatePayslipPDF(payslip, pdfOptions)
      setState('done')
      // Reset after brief confirmation
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  const label = {
    idle:       'Download PDF',
    generating: 'Generating…',
    done:       'Downloaded',
    error:      'Try again',
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
      onClick={handleDownload}
      disabled={state === 'generating'}
      aria-label={label}
      className={cn(
        // Base
        'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium',
        'transition-all duration-150',
        // Default — primary surface
        'bg-primary text-primary-foreground',
        'hover:opacity-90 active:scale-[0.98]',
        // States
        state === 'generating' && 'cursor-wait opacity-70',
        state === 'done'       && 'bg-emerald-600 text-white',
        state === 'error'      && 'bg-destructive text-destructive-foreground',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('size-4 shrink-0', state === 'generating' && 'animate-spin')}
      />
      {label}
    </button>
  )
}
