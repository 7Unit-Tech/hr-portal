'use client'

import { type FC, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronRight, FileUp, Loader2, MoreVertical, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, UserMinus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { downloadEmployeeTemplate } from '@/lib/csv/employee-template'
import { parseEmployeesCSV, type ParseEmployeeResult } from '@/lib/csv/parse-employees'
import type { Employee, EmployeeInsert, EmployeeUpdate } from '@/lib/supabase/types'

// ── Shared schema for Add/Edit ────────────────────────────────────────────

const employeeSchema = z.object({
  employee_id:     z.string().min(1, 'Required').toUpperCase(),
  name:            z.string().min(1, 'Required'),
  email:           z.string().email('Invalid email'),
  designation:     z.string().min(1, 'Required'),
  department:      z.string().min(1, 'Required'),
  bank_account:    z.string().min(9, 'Min 9 digits').max(18, 'Max 18 digits'),
  ifsc_code:       z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Format: HDFC0001234'),
  date_of_joining: z.string().optional(),
  pf_uan:          z.string().optional(),
  basic_pay:         z.number().min(0, 'Must be ≥ 0'),
  hra:              z.number().min(0, 'Must be ≥ 0'),
  special_allowance: z.number().min(0, 'Must be ≥ 0'),
  income_tax:       z.number().min(0, 'Must be ≥ 0'),
  pf:               z.number().min(0, 'Must be ≥ 0'),
  professional_tax: z.number().min(0, 'Must be ≥ 0'),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

// ── Add Employee Modal ────────────────────────────────────────────────────

interface AddEmployeeModalProps {
  onAdd: (data: EmployeeInsert) => Promise<void>
}

const AddEmployeeModal: FC<AddEmployeeModalProps> = ({ onAdd }) => {
  const [open, setOpen]       = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { basic_pay: 0, hra: 0, special_allowance: 0, income_tax: 0, pf: 0, professional_tax: 0 },
  })

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitError(null)
    try {
      const insert: EmployeeInsert = {
        employee_id: values.employee_id,
        name: values.name,
        email: values.email,
        designation: values.designation,
        department: values.department,
        bank_account: values.bank_account,
        ifsc_code: values.ifsc_code,
        date_of_joining: values.date_of_joining || null,
        pf_uan: values.pf_uan?.trim() || null,
        basic_pay_cents: Math.round(values.basic_pay * 100),
        hra_cents: Math.round(values.hra * 100),
        special_allowance_cents: Math.round(values.special_allowance * 100),
        income_tax_cents: Math.round(values.income_tax * 100),
        pf_cents: Math.round(values.pf * 100),
        professional_tax_cents: Math.round(values.professional_tax * 100),
      }
      await onAdd(insert)
      reset()
      setOpen(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add employee')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium',
            'bg-primary text-primary-foreground',
            'transition-all duration-150 hover:opacity-90 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add Employee
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby="add-employee-desc"
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-card p-6 shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-200',
          )}
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-foreground">
                Add Employee
              </Dialog.Title>
              <Dialog.Description id="add-employee-desc" className="mt-0.5 text-sm text-muted-foreground">
                New employee will appear in the payroll list next run.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Employee ID" error={errors.employee_id?.message}>
                <input {...register('employee_id')} placeholder="EMP001" className={inputCls(!!errors.employee_id)} />
              </FormField>
              <FormField label="Full Name" error={errors.name?.message}>
                <input {...register('name')} placeholder="Jane Smith" className={inputCls(!!errors.name)} />
              </FormField>
              <FormField label="Work Email" error={errors.email?.message} className="col-span-2">
                <input {...register('email')} type="email" placeholder="jane@7unit.in" className={inputCls(!!errors.email)} />
              </FormField>
              <FormField label="Designation" error={errors.designation?.message}>
                <input {...register('designation')} placeholder="Software Engineer" className={inputCls(!!errors.designation)} />
              </FormField>
              <FormField label="Department" error={errors.department?.message}>
                <input {...register('department')} placeholder="Engineering" className={inputCls(!!errors.department)} />
              </FormField>
              <FormField label="Bank Account No." error={errors.bank_account?.message}>
                <input {...register('bank_account')} placeholder="1234567890" className={inputCls(!!errors.bank_account)} />
              </FormField>
              <FormField label="IFSC Code" error={errors.ifsc_code?.message}>
                <input
                  {...register('ifsc_code', { setValueAs: v => (v as string).toUpperCase() })}
                  placeholder="HDFC0001234"
                  className={inputCls(!!errors.ifsc_code)}
                />
              </FormField>
              <FormField label="Date of Joining" error={errors.date_of_joining?.message}>
                <input {...register('date_of_joining')} type="date" className={inputCls(!!errors.date_of_joining)} />
              </FormField>
              <FormField label="PF UAN" error={errors.pf_uan?.message}>
                <input {...register('pf_uan')} placeholder="101645519369" className={inputCls(!!errors.pf_uan)} />
              </FormField>
            </div>
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Monthly salary (pre-fills payroll)
              </p>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Basic Pay (₹)" error={errors.basic_pay?.message}>
                  <input {...register('basic_pay', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.basic_pay)} />
                </FormField>
                <FormField label="HRA (₹)" error={errors.hra?.message}>
                  <input {...register('hra', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.hra)} />
                </FormField>
                <FormField label="Special Allowance (₹)" error={errors.special_allowance?.message}>
                  <input {...register('special_allowance', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.special_allowance)} />
                </FormField>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Monthly deductions (pre-fills payroll)
              </p>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Income Tax (₹)" error={errors.income_tax?.message}>
                  <input {...register('income_tax', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.income_tax)} />
                </FormField>
                <FormField label="PF (₹)" error={errors.pf?.message}>
                  <input {...register('pf', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.pf)} />
                </FormField>
                <FormField label="Professional Tax (₹)" error={errors.professional_tax?.message}>
                  <input {...register('professional_tax', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.professional_tax)} />
                </FormField>
              </div>
            </div>

            {submitError && (
              <p role="alert" className="text-xs text-destructive">{submitError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
                  'bg-primary text-primary-foreground hover:opacity-90',
                  'disabled:cursor-wait disabled:opacity-60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                {isSubmitting ? 'Adding…' : 'Add Employee'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Import Employees Modal ──────────────────────────────────────────────────

interface ImportEmployeesModalProps {
  onImport: (data: EmployeeInsert[]) => Promise<{ imported: number; failed: number }>
}

const IMPORT_INSTRUCTIONS = `1. Download the template below (CSV format; opens in Excel, Sheets, or any spreadsheet app).
2. Fill in employee details. First row must be the header. Required columns:
   employee_id, name, email, designation, department, bank_account, ifsc_code
3. Optional: date_of_joining (YYYY-MM-DD), pf_uan, basic_pay, hra, special_allowance, income_tax, pf, professional_tax (₹)
4. IFSC format: HDFC0001234 (4 letters + 0 + 6 alphanumeric)
5. Save as CSV and upload here. Duplicate employee_id or email will be skipped.`

const ImportEmployeesModal: FC<ImportEmployeesModalProps> = ({ onImport }) => {
  const [open, setOpen]                 = useState(false)
  const [results, setResults]           = useState<ParseEmployeeResult[] | null>(null)
  const [fileName, setFileName]         = useState<string | null>(null)
  const [importError, setImportError]   = useState<string | null>(null)
  const [isImporting, setIsImporting]   = useState(false)
  const [importSummary, setImportSummary] = useState<{ imported: number; failed: number } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImportError(null)
    setImportSummary(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsed = parseEmployeesCSV(text)
      setResults(parsed)
    }
    reader.onerror = () => setImportError('Failed to read file')
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const handleImport = async () => {
    if (!results) return
    const valid = results.filter((r): r is ParseEmployeeResult & { success: true } => r.success).map((r) => r.data)
    if (valid.length === 0) {
      setImportError('No valid rows to import')
      return
    }
    setIsImporting(true)
    setImportError(null)
    try {
      const summary = await onImport(valid)
      setImportSummary(summary)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const onOpenChange = (next: boolean) => {
    if (!next) {
      setResults(null)
      setFileName(null)
      setImportError(null)
      setImportSummary(null)
    }
    setOpen(next)
  }

  const validCount = results?.filter((r) => r.success).length ?? 0
  const invalidCount = results?.filter((r) => !r.success).length ?? 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium',
            'border border-border bg-transparent text-foreground',
            'transition-all duration-150 hover:bg-white/5 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <FileUp className="size-3.5" aria-hidden="true" />
          Import
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby="import-employee-desc"
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto',
            'rounded-xl border border-border bg-card p-6 shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-200',
          )}
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-foreground">
                Import employees from CSV
              </Dialog.Title>
              <Dialog.Description id="import-employee-desc" className="mt-0.5 text-sm text-muted-foreground">
                Bulk add employees using a spreadsheet.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground whitespace-pre-line">
              {IMPORT_INSTRUCTIONS}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={downloadEmployeeTemplate}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                  'border border-border bg-transparent hover:bg-white/5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                Download template
              </button>
              <label className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer',
                'border border-border bg-transparent hover:bg-white/5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}>
                <FileUp className="size-3.5" />
                {fileName ?? 'Choose CSV file'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>

            {results && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="text-emerald-400 font-medium">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <> · <span className="text-amber-500 font-medium">{invalidCount} invalid</span></>
                  )}
                </p>
                {invalidCount > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/10 px-3 py-2 text-xs">
                    {results.filter((r) => !r.success).map((r) => (
                      <p key={r.rowIndex} className="text-amber-500/90">
                        Row {r.rowIndex}: {r.errors.join(', ')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {importSummary && (
              <p role="status" className="text-sm text-emerald-400">
                Imported {importSummary.imported} employee{importSummary.imported !== 1 ? 's' : ''}
                {importSummary.failed > 0 && ` · ${importSummary.failed} skipped (duplicate)`}
              </p>
            )}

            {importError && (
              <p role="alert" className="text-sm text-destructive">{importError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleImport}
                disabled={validCount === 0 || isImporting}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
                  'bg-primary text-primary-foreground hover:opacity-90',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                {isImporting && <Loader2 className="size-3 animate-spin" />}
                {isImporting ? 'Importing…' : `Import ${validCount} employee${validCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Edit Employee Modal ────────────────────────────────────────────────────

interface EditEmployeeModalProps {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, data: EmployeeUpdate) => Promise<void>
}

const EditEmployeeModal: FC<EditEmployeeModalProps> = ({ employee, open, onOpenChange, onUpdate }) => {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema) })

  useEffect(() => {
    if (employee && open) {
      reset({
        employee_id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
        department: employee.department,
        bank_account: employee.bank_account,
        ifsc_code: employee.ifsc_code,
        date_of_joining: employee.date_of_joining ?? '',
        pf_uan: employee.pf_uan ?? '',
        basic_pay: (employee.basic_pay_cents ?? 0) / 100,
        hra: (employee.hra_cents ?? 0) / 100,
        special_allowance: (employee.special_allowance_cents ?? 0) / 100,
        income_tax: (employee.income_tax_cents ?? 0) / 100,
        pf: (employee.pf_cents ?? 0) / 100,
        professional_tax: (employee.professional_tax_cents ?? 0) / 100,
      })
    }
  }, [employee, open, reset])

  const onSubmit = async (values: EmployeeFormValues) => {
    if (!employee) return
    setSubmitError(null)
    try {
      const update: EmployeeUpdate = {
        employee_id: values.employee_id,
        name: values.name,
        email: values.email,
        designation: values.designation,
        department: values.department,
        bank_account: values.bank_account,
        ifsc_code: values.ifsc_code,
        date_of_joining: values.date_of_joining || null,
        pf_uan: values.pf_uan?.trim() || null,
        basic_pay_cents: Math.round(values.basic_pay * 100),
        hra_cents: Math.round(values.hra * 100),
        special_allowance_cents: Math.round(values.special_allowance * 100),
        income_tax_cents: Math.round(values.income_tax * 100),
        pf_cents: Math.round(values.pf * 100),
        professional_tax_cents: Math.round(values.professional_tax * 100),
      }
      await onUpdate(employee.id, update)
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update employee')
    }
  }

  if (!employee) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby="edit-employee-desc"
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-card p-6 shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-200',
          )}
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-base font-semibold text-foreground">
                Edit Employee
              </Dialog.Title>
              <Dialog.Description id="edit-employee-desc" className="mt-0.5 text-sm text-muted-foreground">
                Update {employee.name}&apos;s details and salary.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Employee ID" error={errors.employee_id?.message}>
                <input {...register('employee_id')} placeholder="EMP001" className={inputCls(!!errors.employee_id)} />
              </FormField>
              <FormField label="Full Name" error={errors.name?.message}>
                <input {...register('name')} placeholder="Jane Smith" className={inputCls(!!errors.name)} />
              </FormField>
              <FormField label="Work Email" error={errors.email?.message} className="col-span-2">
                <input {...register('email')} type="email" placeholder="jane@7unit.in" className={inputCls(!!errors.email)} />
              </FormField>
              <FormField label="Designation" error={errors.designation?.message}>
                <input {...register('designation')} placeholder="Software Engineer" className={inputCls(!!errors.designation)} />
              </FormField>
              <FormField label="Department" error={errors.department?.message}>
                <input {...register('department')} placeholder="Engineering" className={inputCls(!!errors.department)} />
              </FormField>
              <FormField label="Bank Account No." error={errors.bank_account?.message}>
                <input {...register('bank_account')} placeholder="1234567890" className={inputCls(!!errors.bank_account)} />
              </FormField>
              <FormField label="IFSC Code" error={errors.ifsc_code?.message}>
                <input
                  {...register('ifsc_code', { setValueAs: v => (v as string).toUpperCase() })}
                  placeholder="HDFC0001234"
                  className={inputCls(!!errors.ifsc_code)}
                />
              </FormField>
              <FormField label="Date of Joining" error={errors.date_of_joining?.message}>
                <input {...register('date_of_joining')} type="date" className={inputCls(!!errors.date_of_joining)} />
              </FormField>
              <FormField label="PF UAN" error={errors.pf_uan?.message}>
                <input {...register('pf_uan')} placeholder="101645519369" className={inputCls(!!errors.pf_uan)} />
              </FormField>
            </div>
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Monthly salary (pre-fills payroll)
              </p>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Basic Pay (₹)" error={errors.basic_pay?.message}>
                  <input {...register('basic_pay', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.basic_pay)} />
                </FormField>
                <FormField label="HRA (₹)" error={errors.hra?.message}>
                  <input {...register('hra', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.hra)} />
                </FormField>
                <FormField label="Special Allowance (₹)" error={errors.special_allowance?.message}>
                  <input {...register('special_allowance', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.special_allowance)} />
                </FormField>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Monthly deductions (pre-fills payroll)
              </p>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Income Tax (₹)" error={errors.income_tax?.message}>
                  <input {...register('income_tax', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.income_tax)} />
                </FormField>
                <FormField label="PF (₹)" error={errors.pf?.message}>
                  <input {...register('pf', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.pf)} />
                </FormField>
                <FormField label="Professional Tax (₹)" error={errors.professional_tax?.message}>
                  <input {...register('professional_tax', { valueAsNumber: true, setValueAs: (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0) })} type="number" min={0} step="any" placeholder="0" className={inputCls(!!errors.professional_tax)} />
                </FormField>
              </div>
            </div>

            {submitError && (
              <p role="alert" className="text-xs text-destructive">{submitError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
                  'bg-primary text-primary-foreground hover:opacity-90',
                  'disabled:cursor-wait disabled:opacity-60',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  variant: 'soft' | 'hard'
  onConfirm: () => Promise<void>
}

const ConfirmDeleteModal: FC<ConfirmDeleteModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant,
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete action')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDestructive = variant === 'hard'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-card p-6 shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-200',
          )}
        >
          <Dialog.Title className="text-base font-semibold text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">{description}</Dialog.Description>
          {error && (
            <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
                isDestructive ? 'bg-destructive text-destructive-foreground hover:opacity-90' : 'bg-amber-600 text-white hover:opacity-90',
                'disabled:cursor-wait disabled:opacity-60',
              )}
            >
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Shared input style helpers ────────────────────────────────────────────

const inputCls = (hasError: boolean) => cn(
  'h-9 w-full rounded-md border bg-muted/20 px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground/30 transition-colors',
  'focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10',
  hasError ? 'border-destructive/60' : 'border-border',
)

interface FormFieldProps {
  label:     string
  error?:    string
  children:  React.ReactNode
  className?: string
}

const FormField: FC<FormFieldProps> = ({ label, error, children, className }) => (
  <div className={cn('flex flex-col gap-1', className)}>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
    {error && <p className="text-[10px] text-destructive">{error}</p>}
  </div>
)

// ── EmployeeTable ─────────────────────────────────────────────────────────

interface EmployeeTableProps {
  employees:            Employee[]
  deletedEmployees:     Employee[]
  onAdd:                (data: EmployeeInsert) => Promise<void>
  onImport:             (data: EmployeeInsert[]) => Promise<{ imported: number; failed: number }>
  onUpdate:             (id: string, data: EmployeeUpdate) => Promise<void>
  onSoftDelete:         (id: string) => Promise<void>
  onHardDelete:         (id: string) => Promise<void>
  onRestore:            (id: string) => Promise<void>
  onPromoteToAdmin?:    (email: string) => Promise<void>
}

function formatDeletedAt(deletedAt: string | null): string {
  if (!deletedAt) return '—'
  try {
    const d = new Date(deletedAt)
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return '—'
  }
}

export const EmployeeTable: FC<EmployeeTableProps> = ({
  employees,
  deletedEmployees,
  onAdd,
  onImport,
  onUpdate,
  onSoftDelete,
  onHardDelete,
  onRestore,
  onPromoteToAdmin,
}) => {
  const [editEmployee, setEditEmployee]           = useState<Employee | null>(null)
  const [editModalOpen, setEditModalOpen]         = useState(false)
  const [deleteEmployee, setDeleteEmployee]       = useState<Employee | null>(null)
  const [deleteType, setDeleteType]               = useState<'soft' | 'hard' | null>(null)
  const [deleteModalOpen, setDeleteModalOpen]     = useState(false)
  const [deletedExpanded, setDeletedExpanded]     = useState(false)
  const [promoteEmail, setPromoteEmail]           = useState<string | null>(null)
  const [promoteError, setPromoteError]           = useState<string | null>(null)

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp)
    setEditModalOpen(true)
  }

  const openSoftDelete = (emp: Employee) => {
    setDeleteEmployee(emp)
    setDeleteType('soft')
    setDeleteModalOpen(true)
  }

  const openHardDelete = (emp: Employee) => {
    setDeleteEmployee(emp)
    setDeleteType('hard')
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteEmployee) return
    if (deleteType === 'soft') await onSoftDelete(deleteEmployee.id)
    else if (deleteType === 'hard') await onHardDelete(deleteEmployee.id)
  }

  const handlePromoteToAdmin = async (email: string) => {
    if (!onPromoteToAdmin) return
    setPromoteEmail(email)
    setPromoteError(null)
    try {
      await onPromoteToAdmin(email)
    } catch (err) {
      setPromoteError(err instanceof Error ? err.message : 'Failed to promote')
    } finally {
      setPromoteEmail(null)
    }
  }

  return (
  <div>
    {/* Table header */}
    <div className="mb-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {employees.length} employee{employees.length !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        <ImportEmployeesModal onImport={onImport} />
        <AddEmployeeModal onAdd={onAdd} />
      </div>
    </div>

    {promoteError && (
      <div
        role="alert"
        className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
      >
        {promoteError}
        <button
          type="button"
          onClick={() => setPromoteError(null)}
          className="ml-auto text-xs underline underline-offset-2 hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    )}

    {/* Table */}
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {['ID', 'Name', 'Designation', 'Department', 'Status', 'Actions'].map(col => (
              <th
                key={col}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70',
                  col === 'Actions' && 'w-0 pr-2 text-right',
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr
              key={emp.id}
              className={cn(
                'border-b border-border/60 transition-colors duration-100',
                'hover:bg-white/[0.02]',
                i === employees.length - 1 && 'border-b-0',
              )}
            >
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground">{emp.employee_id}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground/70">
                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{emp.designation}</td>
              <td className="px-4 py-3 text-muted-foreground">{emp.department}</td>
              <td className="px-4 py-3">
                {emp.is_active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.2)]" aria-hidden="true" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/60">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(emp)}
                    aria-label={`Edit ${emp.name}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        aria-label={`Actions for ${emp.name}`}
                        aria-haspopup="menu"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={4}
                        className="min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-xl"
                      >
                        {onPromoteToAdmin && (
                          <DropdownMenu.Item
                            onSelect={() => handlePromoteToAdmin(emp.email)}
                            disabled={promoteEmail === emp.email}
                            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground outline-none hover:bg-white/5 focus:bg-white/5 disabled:opacity-50"
                          >
                            {promoteEmail === emp.email ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
                            )}
                            Make admin
                          </DropdownMenu.Item>
                        )}
                        <DropdownMenu.Item
                          onSelect={() => openSoftDelete(emp)}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-amber-500 outline-none hover:bg-white/5 focus:bg-white/5"
                        >
                          <UserMinus className="size-3.5" />
                          Soft delete
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => openHardDelete(emp)}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-destructive outline-none hover:bg-white/5 focus:bg-white/5"
                        >
                          <Trash2 className="size-3.5" />
                          Hard delete (permanent)
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-foreground">No employees yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add the first team member to get started.</p>
        </div>
      )}
    </div>

    <EditEmployeeModal
      employee={editEmployee}
      open={editModalOpen}
      onOpenChange={setEditModalOpen}
      onUpdate={onUpdate}
    />
    <ConfirmDeleteModal
      open={deleteModalOpen}
      onOpenChange={setDeleteModalOpen}
      title={deleteType === 'hard' ? 'Permanently delete employee?' : 'Soft delete employee?'}
      description={
        deleteType === 'hard'
          ? `This will permanently remove ${deleteEmployee?.name ?? 'this employee'} from the database. This action cannot be undone.`
          : `${deleteEmployee?.name ?? 'This employee'} will be hidden from the active list but data is preserved.`
      }
      confirmLabel={deleteType === 'hard' ? 'Delete permanently' : 'Soft delete'}
      variant={deleteType ?? 'soft'}
      onConfirm={handleConfirmDelete}
    />

    {/* Soft-deleted employees */}
    {deletedEmployees.length > 0 && (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setDeletedExpanded((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border border-border/60 px-4 py-3 text-left text-sm',
            'hover:bg-white/[0.02] transition-colors',
          )}
          aria-expanded={deletedExpanded}
        >
          {deletedExpanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <span className="font-medium text-muted-foreground">
            Soft-deleted employees ({deletedEmployees.length})
          </span>
        </button>
        {deletedExpanded && (
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['ID', 'Name', 'Designation', 'Department', 'Deleted', 'Actions'].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70',
                        col === 'Actions' && 'w-0 pr-2 text-right',
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deletedEmployees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    className={cn(
                      'border-b border-border/60 transition-colors duration-100',
                      'hover:bg-white/[0.02]',
                      i === deletedEmployees.length - 1 && 'border-b-0',
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{emp.employee_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-[10px] font-semibold text-muted-foreground">
                          {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground/80">{emp.name}</p>
                          <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.designation}</td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.department}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatDeletedAt(emp.deleted_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onRestore(emp.id)}
                          aria-label={`Restore ${emp.name}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <RotateCcw className="size-3" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteEmployee(emp)
                            setDeleteType('hard')
                            setDeleteModalOpen(true)
                          }}
                          aria-label={`Permanently delete ${emp.name}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3" />
                          Delete permanently
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
  )
}
