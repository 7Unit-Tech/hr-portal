/**
 * Employee import CSV template.
 * Columns must match parse-employees.ts expectations.
 */

const TEMPLATE_HEADER = [
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

/** Sample row for reference (included in template). */
const SAMPLE_ROW = [
  'EMP001',
  'Jane Smith',
  'jane@7unit.in',
  'Software Engineer',
  'Engineering',
  '1234567890',
  'HDFC0001234',
  '2025-01-15',
  '101645519369',
  '50000',
  '20000',
  '10000',
  '5000',
  '6000',
  '200',
] as const

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateEmployeeTemplateCSV(): string {
  const header = TEMPLATE_HEADER.join(',')
  const sample = SAMPLE_ROW.map(escapeCsvCell).join(',')
  return [header, sample].join('\r\n')
}

export function downloadEmployeeTemplate(): void {
  const csv = generateEmployeeTemplateCSV()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'employees-import-template.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}
