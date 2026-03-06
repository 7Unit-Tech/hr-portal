import { z } from 'zod'
import type { EmployeeInsert } from '@/lib/supabase/types'

/** CSV row schema - matches add form validation. */
const csvRowSchema = z.object({
  employee_id:     z.string().min(1, 'Employee ID required').transform((s) => s.trim().toUpperCase()),
  name:            z.string().min(1, 'Name required').transform((s) => s.trim()),
  email:           z.string().email('Invalid email').transform((s) => s.trim().toLowerCase()),
  designation:     z.string().min(1, 'Designation required').transform((s) => s.trim()),
  department:      z.string().min(1, 'Department required').transform((s) => s.trim()),
  bank_account:    z.string().min(9, 'Bank account: min 9 digits').max(18, 'Bank account: max 18 digits').transform((s) => s.trim().replace(/\s/g, '')),
  ifsc_code:       z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'IFSC: format HDFC0001234').transform((s) => s.trim().toUpperCase()),
  date_of_joining: z.string().optional().transform((s) => (s && s.trim() ? s.trim() : undefined)),
  pf_uan:          z.string().optional().transform((s) => (s && s.trim() ? s.trim() : undefined)),
  basic_pay:        z.string().optional().transform((s) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : 0)),
  hra:             z.string().optional().transform((s) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : 0)),
  special_allowance: z.string().optional().transform((s) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : 0)),
  income_tax:      z.string().optional().transform((s) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : 0)),
  pf:              z.string().optional().transform((s) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : 0)),
  professional_tax: z.string().optional().transform((s) => (s && s.trim() ? Math.round(parseFloat(s) * 100) : 0)),
})

export type ParseEmployeeResult =
  | { success: true; data: EmployeeInsert; rowIndex: number }
  | { success: false; rowIndex: number; errors: string[] }

/**
 * Parse a CSV string into employee rows. First row is treated as header.
 * Returns validated rows with success/failure per row.
 */
export function parseEmployeesCSV(csvText: string): ParseEmployeeResult[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase()
  const headerIdx = parseHeader(header)

  const results: ParseEmployeeResult[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    const row: Record<string, string> = {}

    for (const [key, idx] of Object.entries(headerIdx)) {
      const value = cells[idx]
      row[key] = value !== undefined && value !== null ? String(value).trim() : ''
    }

    const parsed = csvRowSchema.safeParse(row)
    if (parsed.success) {
      results.push({
        success: true,
        data: {
          employee_id: parsed.data.employee_id,
          name: parsed.data.name,
          email: parsed.data.email,
          designation: parsed.data.designation,
          department: parsed.data.department,
          bank_account: parsed.data.bank_account,
          ifsc_code: parsed.data.ifsc_code,
          date_of_joining: parsed.data.date_of_joining || null,
          pf_uan: parsed.data.pf_uan || null,
          basic_pay_cents: parsed.data.basic_pay ?? 0,
          hra_cents: parsed.data.hra ?? 0,
          special_allowance_cents: parsed.data.special_allowance ?? 0,
          income_tax_cents: parsed.data.income_tax ?? 0,
          pf_cents: parsed.data.pf ?? 0,
          professional_tax_cents: parsed.data.professional_tax ?? 0,
        },
        rowIndex: i + 1,
      })
    } else {
      const errors = parsed.error.issues.map((issue) => issue.message)
      results.push({ success: false, rowIndex: i + 1, errors })
    }
  }

  return results
}

const EXPECTED_COLUMNS = [
  'employee_id',
  'name',
  'email',
  'designation',
  'department',
  'bank_account',
  'ifsc_code',
  'date_of_joining',
  'pf_uan',
  'basic_pay',
  'hra',
  'special_allowance',
  'income_tax',
  'pf',
  'professional_tax',
] as const

function parseHeader(headerLine: string): Record<string, number> {
  const cells = parseCsvLine(headerLine)
  const map: Record<string, number> = {}

  for (const col of EXPECTED_COLUMNS) {
    const idx = cells.findIndex((c) => c.toLowerCase().trim().replace(/[\s_]/g, '') === col.replace(/_/g, ''))
    if (idx >= 0) map[col] = idx
  }

  // Fallback: assume columns are in order if header doesn't match
  for (let i = 0; i < EXPECTED_COLUMNS.length && i < cells.length; i++) {
    if (!(EXPECTED_COLUMNS[i] in map)) {
      map[EXPECTED_COLUMNS[i]] = i
    }
  }

  return map
}

/** Parse a single CSV line handling quoted fields. */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (inQuotes) {
      current += c
    } else if (c === ',') {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}
