/** All display-layer formatting helpers. Never divide by 100 outside this module. */

export const formatRupees = (cents: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cents / 100)

/** PDF-safe: uses Rs. instead of ₹ (jsPDF Helvetica is Latin-1 only). No decimals for whole amounts. */
export const formatRupeesForPDF = (cents: number): string => {
  const rupees = cents / 100
  const formatted =
    rupees % 1 === 0
      ? Math.round(rupees).toLocaleString('en-IN')
      : rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `Rs. ${formatted}`
}

/** '2025-01-01' → 'January 2025' */
export const formatMonthLabel = (isoDate: string): string => {
  const [y, m] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

/** '2025-01-01' → 'Jan 2025' */
export const formatShortMonth = (isoDate: string): string => {
  const [y, m] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** '2025-01-15' → '15 Jan 2025' */
export const formatDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** '2025-01-15' → '15/01/2025' (DD/MM/YYYY for payslip PDF) */
export const formatDateDDMMYYYY = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

/** URL param → DB date: '2025-01' → '2025-01-01' */
export const monthParamToDate = (month: string): string => `${month}-01`

/** DB date → URL param: '2025-01-01' → '2025-01' */
export const dateToMonthParam = (isoDate: string): string => isoDate.slice(0, 7)

/**
 * Convert number (whole rupees) to Indian English words.
 * e.g. 66200 → "Rupees Sixty-Six Thousand Two Hundred Only"
 */
export function numberToWords(rupees: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function toHundreds(n: number): string {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')).trim()
    return (ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + toHundreds(n % 100) : '')).trim()
  }

  const whole = Math.floor(rupees)
  if (whole === 0) return 'Rupees Zero Only'

  const lakh = Math.floor(whole / 100_000)
  const thousand = Math.floor((whole % 100_000) / 1000)
  const hundred = whole % 1000

  const parts: string[] = []
  if (lakh > 0) parts.push(toHundreds(lakh) + ' Lakh')
  if (thousand > 0) parts.push(toHundreds(thousand) + ' Thousand')
  if (hundred > 0) parts.push(toHundreds(hundred))

  return 'Rupees ' + (parts.join(' ') || 'Zero') + ' Only'
}
