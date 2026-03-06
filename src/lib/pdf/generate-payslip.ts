import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import {
  formatRupeesForPDF,
  formatMonthLabel,
  formatDateDDMMYYYY,
  numberToWords,
} from '@/lib/format'
import type { PayslipWithEmployee } from '@/lib/supabase/types'

// jspdf-autotable augments jsPDF instances at runtime
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number }
}

/** Options for PDF generation. Pass a base64 data URL for the company logo. */
export interface GeneratePayslipOptions {
  /** Base64 data URL of the company logo (e.g. data:image/png;base64,...). Placed top-right. */
  logoDataUrl?: string
  /** Logo width in mm. Default 40. */
  logoWidth?: number
  /** Logo height in mm. Default 12. */
  logoHeight?: number
  /** Company name (left side). Default: 7Unit Softwares India */
  companyName?: string
  /** Company address (left side). Optional. */
  companyAddress?: string
}

const L = 15
const R = 195
const W = 180

export function generatePayslipPDF(
  payslip: PayslipWithEmployee,
  options?: GeneratePayslipOptions,
): void {
  const doc = new jsPDF() as JsPDFWithAutoTable
  const emp = payslip.employee ?? {
    id: '',
    name: 'Employee',
    employee_id: payslip.employee_id,
    designation: '',
    department: '',
    bank_account: '',
    ifsc_code: '',
    date_of_joining: null,
    pf_uan: null,
  }

  const doj = emp.date_of_joining ? formatDateDDMMYYYY(emp.date_of_joining) : '—'
  const pfUan = emp.pf_uan ?? '—'

  // ── Header: left = company name & address, right = logo ───────────────────
  const companyName = options?.companyName ?? '7Unit Softwares India'
  const companyAddress = options?.companyAddress ?? ''
  const imgW = options?.logoWidth ?? 40
  const imgH = options?.logoHeight ?? 9
  let headerBottom = 36

  // Left: company name + address
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(24, 24, 32)
  doc.text(companyName, L, 12)
  let y = 18
  if (companyAddress) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 90)
    doc.text(companyAddress, L, y)
    y += 6
  }
  headerBottom = Math.max(headerBottom, y + 4)

  // Right: logo (when available)
  if (options?.logoDataUrl) {
    try {
      const d = options.logoDataUrl
      const fmt =
        d.startsWith('data:image/jpeg') || d.startsWith('data:image/jpg')
          ? 'JPEG'
          : 'PNG'
      doc.addImage(d, fmt, R - imgW, 8, imgW, imgH)
      headerBottom = Math.max(headerBottom, 8 + imgH + 4)
    } catch {
      // Fallback: logo omitted
    }
  }

  // Payslip title + month
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 90)
  doc.text('Payslip For the Month', L, headerBottom)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(24, 24, 32)
  doc.text(formatMonthLabel(payslip.month), L, headerBottom + 8)

  const contentStartY = headerBottom + 16

  // ── Employee Details (2 columns side by side) ─────────────────────────────
  const colW = (W - 4) / 2  // two equal columns with gap
  autoTable(doc as unknown as jsPDF, {
    startY: contentStartY,
    head: [[{ content: 'Employee Details', colSpan: 4 }]],
    body: [
      ['Name', emp.name, 'DOJ', doj],
      ['Employee ID', emp.employee_id, 'PF UAN', pfUan],
      ['Designation', emp.designation, 'Paid days', String(payslip.paid_days)],
      ['Pay Date', formatDateDDMMYYYY(payslip.pay_date), 'LOP days', String(payslip.lop_days)],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [248, 248, 252], textColor: [24, 24, 32], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: colW * 0.35, textColor: [100, 100, 120] },
      1: { cellWidth: colW * 0.65, textColor: [24, 24, 32] },
      2: { cellWidth: colW * 0.35, textColor: [100, 100, 120] },
      3: { cellWidth: colW * 0.65, textColor: [24, 24, 32] },
    },
  })

  const afterDetails = doc.lastAutoTable.finalY + 8

  // ── Net Payout callout ────────────────────────────────────────────────────
  const netBoxH = 20
  const netBoxY = afterDetails
  doc.setFillColor(23, 23, 39)
  doc.roundedRect(L, netBoxY, W, netBoxH, 2, 2, 'F')
  const netBaseline = netBoxY + netBoxH / 2 + 2
  const netPad = 12
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(148, 148, 180)
  doc.text('Net Payout', L + netPad, netBaseline)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(248, 248, 252)
  doc.text(formatRupeesForPDF(payslip.net_pay_cents) + '/-', L + W - netPad, netBaseline, { align: 'right' })

  const afterNetPayout = afterDetails + netBoxH + 6

  // ── Earnings and Deductions (side by side) ────────────────────────────────
  autoTable(doc as unknown as jsPDF, {
    startY: afterNetPayout,
    head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
    body: [
      ['Basic pay', formatRupeesForPDF(payslip.basic_pay_cents), 'Income Tax', formatRupeesForPDF(payslip.income_tax_cents)],
      ['House Rent Allowance', formatRupeesForPDF(payslip.hra_cents), 'Provident Fund', formatRupeesForPDF(payslip.pf_cents)],
      ['Special Allowance', formatRupeesForPDF(payslip.special_allowance_cents), 'Professional Tax', formatRupeesForPDF(payslip.professional_tax_cents)],
    ],
    foot: [
      [
        'Gross Earnings',
        { content: formatRupeesForPDF(payslip.gross_earnings_cents), styles: { halign: 'right' } },
        'Total Deductions',
        { content: formatRupeesForPDF(payslip.total_deductions_cents), styles: { halign: 'right' } },
      ],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [245, 245, 250], textColor: [24, 24, 32], fontStyle: 'bold' },
    footStyles: { fillColor: [245, 245, 250], textColor: [24, 24, 32], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [252, 252, 254] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 55 },
      3: { cellWidth: 35, halign: 'right' },
    },
  })

  const afterTables = doc.lastAutoTable.finalY + 10

  // ── Total Net Payable ─────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 90)
  doc.text('Total Net Payable', L, afterTables)
  doc.text('Gross Earnings – Total Deductions', L, afterTables + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(24, 24, 32)
  doc.text(formatRupeesForPDF(payslip.net_pay_cents), R, afterTables + 4, { align: 'right' })

  const afterNetPayable = afterTables + 14

  // ── Amount In Words ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 90)
  doc.text('Amount In Words', L, afterNetPayable)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(24, 24, 32)
  const words = numberToWords(Math.round(payslip.net_pay_cents / 100))
  doc.text(words, L, afterNetPayable + 6)

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 150)
  doc.text(
    'This is a system generated payslip, hence the signature is not required',
    105, 287, { align: 'center' },
  )

  doc.save(`payslip-${emp.employee_id}-${payslip.month.slice(0, 7)}.pdf`)
}
