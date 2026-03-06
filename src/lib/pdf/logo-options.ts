import type { GeneratePayslipOptions } from './generate-payslip'

/**
 * Returns PDF options (logo, company name, address) from env vars.
 * Use for both PayslipDetail and PayslipCard download buttons.
 *
 * Env vars:
 *   NEXT_PUBLIC_PAYSLIP_LOGO_DATA_URL - base64 data URL (optional)
 *   NEXT_PUBLIC_PAYSLIP_COMPANY_NAME   - company name (optional, default: 7Unit Softwares India)
 *   NEXT_PUBLIC_PAYSLIP_COMPANY_ADDRESS - company address (optional)
 *
 * Note: Restart the dev server after changing .env.local.
 */
export function getPdfLogoOptions(): GeneratePayslipOptions {
  if (typeof process === 'undefined') return {}
  const url = process.env.NEXT_PUBLIC_PAYSLIP_LOGO_DATA_URL?.trim()
  const opts: GeneratePayslipOptions = {}
  if (url && url.startsWith('data:image/')) opts.logoDataUrl = url
  const name = process.env.NEXT_PUBLIC_PAYSLIP_COMPANY_NAME?.trim()
  if (name) opts.companyName = name
  const addr = process.env.NEXT_PUBLIC_PAYSLIP_COMPANY_ADDRESS?.trim()
  if (addr) opts.companyAddress = addr
  return opts
}
