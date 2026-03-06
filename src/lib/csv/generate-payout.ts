import type { PayslipWithEmployee } from '@/lib/supabase/types'
import { formatDateDDMMYYYY } from '@/lib/format'

/** Bank name from IFSC (first 4 chars). Extend as needed. */
const IFSC_TO_BANK: Record<string, string> = {
  HDFC: 'HDFC BANK',
  ICIC: 'ICICI BANK',
  SBIN: 'STATE BANK OF INDIA',
  UTIB: 'AXIS BANK',
  PUNB: 'PUNJAB NATIONAL BANK',
  CNRB: 'CANARA BANK',
  BKID: 'BANK OF INDIA',
  CBIN: 'CENTRAL BANK OF INDIA',
  IDIB: 'INDIAN BANK',
  IOBA: 'INDIAN OVERSEAS BANK',
}

function getBankName(ifscCode: string): string {
  const prefix = ifscCode.slice(0, 4).toUpperCase()
  return IFSC_TO_BANK[prefix] ?? `${prefix} BANK`
}

/** Short name: first word of full name, uppercased (e.g. "Hisham Ahammed K M" → "HISHAM") */
function getShortName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? fullName
  return first.toUpperCase()
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Generates bank submission CSV.
 * Format: 30 columns, no header. Empty columns preserved.
 * Col 1: I (HDFC) or N (other)
 * Col 2: shortname
 * Col 3: bank_account
 * Col 4: amount (whole rupees)
 * Col 5: full name
 * Col 6-14: empty
 * Col 15: shortname
 * Col 16-24: empty
 * Col 25: pay_date (DD/MM/YYYY)
 * Col 26: empty
 * Col 27: IFSC
 * Col 28: bank name
 * Col 29: empty
 * Col 30: email
 */
export function generatePayoutCSV(payslips: PayslipWithEmployee[]): string {
  const rows = payslips.map((p) => {
    const emp = p.employee
    const isHDFC = emp.ifsc_code.toUpperCase().startsWith('HDFC')
    const shortname = getShortName(emp.name)
    const amount = Math.round(p.net_pay_cents / 100)
    const payDateDDMMYYYY = formatDateDDMMYYYY(p.pay_date)
    const bankName = getBankName(emp.ifsc_code)

    const cells = [
      isHDFC ? 'I' : 'N',
      shortname,
      emp.bank_account,
      String(amount),
      escapeCsvCell(emp.name),
      '', '', '', '', '', '', '', '', '',  // 6-14 empty
      shortname,
      '', '', '', '', '', '', '', '', '',  // 16-24 empty
      payDateDDMMYYYY,
      '',  // 26 empty
      emp.ifsc_code,
      bankName,
      '',  // 29 empty
      emp.email ?? '',
    ]
    return cells.join(',')
  })

  return rows.join('\r\n')
}

/**
 * Triggers a browser download of the bank payout CSV.
 * Filename format: YYYYMMDD001.csv (e.g. 20260502001.csv)
 */
export function downloadPayoutCSV(payslips: PayslipWithEmployee[], month: string): void {
  const csv = generatePayoutCSV(payslips)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  // Filename: YYYYMMDD + batch suffix (e.g. 20260502001.csv for May 2026)
  const datePart = month.replace(/-/g, '').slice(0, 8)
  anchor.download = `${datePart}001.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
