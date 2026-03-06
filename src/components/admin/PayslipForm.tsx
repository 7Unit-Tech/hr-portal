'use client'

import { type FC, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatRupees } from '@/lib/format'
import { useSavePayslip } from '@/hooks/usePayslips'
import type { Employee, Payslip, PayslipInsert } from '@/lib/supabase/types'

// ── Schema (all monetary fields in rupees for UX, stored as cents) ────────

const schema = z.object({
  basic_pay:         z.number().min(0, 'Must be ≥ 0'),
  hra:               z.number().min(0, 'Must be ≥ 0'),
  special_allowance: z.number().min(0, 'Must be ≥ 0'),
  income_tax:        z.number().min(0, 'Must be ≥ 0'),
  pf:                z.number().min(0, 'Must be ≥ 0'),
  professional_tax:  z.number().min(0, 'Must be ≥ 0'),
  paid_days:         z.number().int('Must be whole number').min(0).max(31, 'Max 31'),
  lop_days:          z.number().int('Must be whole number').min(0).max(31, 'Max 31'),
  pay_date:          z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────────────────

function buildDefaults(
  existing: Payslip | null,
  monthDate: string,
  employee: {
    basic_pay_cents?: number
    hra_cents?: number
    special_allowance_cents?: number
    income_tax_cents?: number
    pf_cents?: number
    professional_tax_cents?: number
  },
): FormValues {
  if (existing) {
    return {
      basic_pay:         existing.basic_pay_cents / 100,
      hra:               existing.hra_cents / 100,
      special_allowance: existing.special_allowance_cents / 100,
      income_tax:        existing.income_tax_cents / 100,
      pf:                existing.pf_cents / 100,
      professional_tax:  existing.professional_tax_cents / 100,
      paid_days:         existing.paid_days,
      lop_days:          existing.lop_days,
      pay_date:          existing.pay_date,
    }
  }
  // Pre-fill earnings from employee salary; admin approves/edits and saves
  const [y, m] = monthDate.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const payDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return {
    basic_pay:         (employee.basic_pay_cents ?? 0) / 100,
    hra:               (employee.hra_cents ?? 0) / 100,
    special_allowance: (employee.special_allowance_cents ?? 0) / 100,
    income_tax:        (employee.income_tax_cents ?? 0) / 100,
    pf:                (employee.pf_cents ?? 0) / 100,
    professional_tax:  (employee.professional_tax_cents ?? 0) / 100,
    paid_days: lastDay, lop_days: 0,
    pay_date: payDate,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────

interface FieldProps {
  label:       string
  name:        keyof FormValues
  type?:       'number' | 'date'
  prefix?:     string
  error?:      string
  register:    ReturnType<typeof useForm<FormValues>>['register']
}

const Field: FC<FieldProps> = ({ label, name, type = 'number', prefix, error, register }) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={name}
      className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70"
    >
      {label}
    </label>
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-muted-foreground/50">
          {prefix}
        </span>
      )}
      <input
        id={name}
        type={type}
        step={type === 'number' ? 'any' : undefined}
        min={type === 'number' ? 0 : undefined}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={cn(
          'h-8 w-full rounded-md border bg-muted/20 text-sm text-foreground',
          'transition-colors placeholder:text-muted-foreground/30',
          'focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10',
          prefix ? 'pl-5 pr-2' : 'px-2.5',
          error ? 'border-destructive/60' : 'border-border',
        )}
      />
    </div>
    {error && <p className="text-[10px] text-destructive">{error}</p>}
  </div>
)

// ── PayslipForm ───────────────────────────────────────────────────────────

interface PayslipFormProps {
  employee:        Employee
  existingPayslip: Payslip | null
  month:           string      // 'YYYY-MM-01'
  onSaved:         () => void
}

export const PayslipForm: FC<PayslipFormProps> = ({
  employee,
  existingPayslip,
  month,
  onSaved,
}) => {
  const { savePayslip, isSaving } = useSavePayslip()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(existingPayslip, month, employee),
  })

  // Sync form when existing payslip data loads or month changes
  useEffect(() => {
    reset(buildDefaults(existingPayslip, month, employee))
  }, [existingPayslip, month, employee, reset])

  // Live-preview derived values
  const watched = useWatch({ control })
  const gross       = (watched.basic_pay ?? 0) + (watched.hra ?? 0) + (watched.special_allowance ?? 0)
  const deductions  = (watched.income_tax ?? 0) + (watched.pf ?? 0) + (watched.professional_tax ?? 0)
  const netPay      = gross - deductions

  const onSubmit = async (values: FormValues) => {
    const data: PayslipInsert = {
      employee_id:              employee.employee_id,
      month,
      basic_pay_cents:          Math.round(values.basic_pay * 100),
      hra_cents:                Math.round(values.hra * 100),
      special_allowance_cents:  Math.round(values.special_allowance * 100),
      income_tax_cents:         Math.round(values.income_tax * 100),
      pf_cents:                 Math.round(values.pf * 100),
      professional_tax_cents:   Math.round(values.professional_tax * 100),
      paid_days:                values.paid_days,
      lop_days:                 values.lop_days,
      pay_date:                 values.pay_date,
    }
    await savePayslip(data)
    reset(values) // clear dirty state
    onSaved()
  }

  const isSaved = !!existingPayslip && !isDirty

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={`Payslip form for ${employee.name}`}
    >
      {/* ── Employee header row ──────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground/70">
            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{employee.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {employee.designation} · {employee.department}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Saved
            </span>
          )}
          <span className="font-mono text-[11px] text-muted-foreground/50">
            {employee.employee_id}
          </span>
        </div>
      </div>

      {/* ── Fields grid ──────────────────────────────────────── */}
      <div className="grid gap-x-6 gap-y-4 px-5 pb-4 sm:grid-cols-3">
        {/* Earnings */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Earnings
          </p>
          <Field label="Basic Pay"         name="basic_pay"         prefix="₹" register={register} error={errors.basic_pay?.message} />
          <Field label="HRA"               name="hra"               prefix="₹" register={register} error={errors.hra?.message} />
          <Field label="Special Allowance" name="special_allowance" prefix="₹" register={register} error={errors.special_allowance?.message} />
        </div>

        {/* Deductions */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Deductions
          </p>
          <Field label="Income Tax"       name="income_tax"       prefix="₹" register={register} error={errors.income_tax?.message} />
          <Field label="Provident Fund"   name="pf"               prefix="₹" register={register} error={errors.pf?.message} />
          <Field label="Professional Tax" name="professional_tax" prefix="₹" register={register} error={errors.professional_tax?.message} />
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Summary
          </p>
          <Field label="Paid Days" name="paid_days" register={register} error={errors.paid_days?.message} />
          <Field label="LOP Days"  name="lop_days"  register={register} error={errors.lop_days?.message} />
          <Field label="Pay Date"  name="pay_date"  type="date" register={register} error={errors.pay_date?.message} />
        </div>
      </div>

      {/* ── Footer: preview + save ───────────────────────────── */}
      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Gross <span className="font-medium text-foreground/70">{formatRupees(gross * 100)}</span></span>
          <span className="text-border">·</span>
          <span>Deductions <span className="font-medium text-foreground/70">{formatRupees(deductions * 100)}</span></span>
          <span className="text-border">·</span>
          <span className="font-semibold text-foreground">Net {formatRupees(netPay * 100)}</span>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium',
            'bg-primary text-primary-foreground',
            'transition-all duration-150 hover:opacity-90 active:scale-[0.98]',
            'disabled:cursor-wait disabled:opacity-60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          {isSaving && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
          {isSaving ? 'Saving…' : existingPayslip ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  )
}
