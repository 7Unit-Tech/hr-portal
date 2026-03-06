import { NextResponse } from 'next/server'
import { Resend } from 'resend'

import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const PORTAL_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

function getWelcomeEmailHtml({
  name,
  email,
  loginUrl,
}: {
  name: string
  email: string
  loginUrl: string
}): string {
  const n = escapeHtml(name)
  const e = escapeHtml(email)
  const url = escapeHtml(loginUrl)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to 7Unit HR Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; background-color: #18181b; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #fafafa; letter-spacing: -0.5px;">7Unit Softwares Pvt Ltd</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #a1a1aa;">HR Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #18181b;">Hi ${n},</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #52525b;">You have been added to the 7Unit HR Portal. Sign in with your email to view payslips, download PDFs, and manage your payroll information.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td>
                    <a href="${url}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #18181b; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Open HR Portal</a>
                  </td>
                </tr>
              </table>
              <div style="padding: 20px; background-color: #f4f4f5; border-radius: 8px; border-left: 4px solid #18181b;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52525b;"><strong>Sign in:</strong> Use <strong>${e}</strong> and request a magic link. No password needed.</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #e4e4e7; background-color: #fafafa;">
              <p style="margin: 0; font-size: 13px; color: #71717a;">— 7Unit Softwares Pvt Ltd</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role

  if (!user || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured' },
      { status: 503 }
    )
  }

  let body: { email: string; name: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, name } = body
  if (!email || typeof email !== 'string' || !name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'email and name are required' },
      { status: 400 }
    )
  }

  const loginUrl = `${PORTAL_URL}/login`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to 7Unit HR Portal',
      html: getWelcomeEmailHtml({ name, email, loginUrl }),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
