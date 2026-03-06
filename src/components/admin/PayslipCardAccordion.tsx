'use client'

import { type FC, useEffect, useState } from 'react'
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatRupees } from '@/lib/format'
import { PayslipForm } from '@/components/admin/PayslipForm'
import type { Employee, Payslip } from '@/lib/supabase/types'

function computeNetPreview(
  payslip: Payslip | null,
  employee: Pick<Employee, 'basic_pay_cents' | 'hra_cents' | 'special_allowance_cents' | 'income_tax_cents' | 'pf_cents' | 'professional_tax_cents'>,
): number {
  if (payslip) {
    const gross = payslip.basic_pay_cents + payslip.hra_cents + payslip.special_allowance_cents
    const deductions = payslip.income_tax_cents + payslip.pf_cents + payslip.professional_tax_cents
    return gross - deductions
  }
  const gross = (employee.basic_pay_cents ?? 0) + (employee.hra_cents ?? 0) + (employee.special_allowance_cents ?? 0)
  const deductions = (employee.income_tax_cents ?? 0) + (employee.pf_cents ?? 0) + (employee.professional_tax_cents ?? 0)
  return gross - deductions
}

interface PayslipCardAccordionProps {
  employee:        Employee
  existingPayslip: Payslip | null
  month:           string
  onSaved:         () => void
  defaultExpanded?: boolean
  /** When set, overrides internal state (controlled from parent "Expand all" / "Collapse all") */
  expanded?: boolean
}

export const PayslipCardAccordion: FC<PayslipCardAccordionProps> = ({
  employee,
  existingPayslip,
  month,
  onSaved,
  defaultExpanded = false,
  expanded: controlledExpanded,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  useEffect(() => {
    if (controlledExpanded !== undefined) {
      queueMicrotask(() => setInternalExpanded(controlledExpanded))
    }
  }, [controlledExpanded])

  const setIsExpanded = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(internalExpanded) : next
    setInternalExpanded(value)
  }
  const isSaved = !!existingPayslip
  const netPreview = computeNetPreview(existingPayslip, employee)

  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card transition-all duration-200',
        'hover:border-border focus-within:ring-2 focus-within:ring-ring/30 focus-within:ring-offset-2 focus-within:ring-offset-background',
      )}
    >
      {/* Compact header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left',
          'transition-colors hover:bg-white/[0.02]',
          'focus-visible:outline-none focus-visible:ring-0',
        )}
        aria-expanded={isExpanded}
        aria-controls={`payslip-form-${employee.id}`}
        id={`payslip-trigger-${employee.id}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-semibold text-foreground/80">
            {employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{employee.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {employee.designation} · {employee.department}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatRupees(netPreview)}
          </span>
          {isSaved ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400/90">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Saved
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500/90">
              <Circle className="size-3" aria-hidden />
              Pending
            </span>
          )}
          <span className="font-mono text-[11px] text-muted-foreground/60">
            {employee.employee_id}
          </span>
          <ChevronDown
            className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')}
            aria-hidden
          />
        </div>
      </button>

      {/* Expandable form */}
      <div
        id={`payslip-form-${employee.id}`}
        role="region"
        aria-labelledby={`payslip-trigger-${employee.id}`}
        className={cn(
          'grid transition-all duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border/60">
            <PayslipForm
              employee={employee}
              existingPayslip={existingPayslip}
              month={month}
              onSaved={() => {
                onSaved()
                // Keep expanded after save so user can see confirmation
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
