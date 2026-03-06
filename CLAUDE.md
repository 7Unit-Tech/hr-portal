# HR Portal — Project Memory

> **AI-assisted development**: This project was built using AI coding tools (Claude, Cursor) as a pair-programming assistant. Architecture, security, and conventions were designed by the developer; AI helped with implementation, tests, and boilerplate. This file documents project context for both humans and AI—useful for onboarding and code review.

---

## What This Is
7Unit internal HR portal. 15 employees. Payslip management + download.
Admin generates monthly payslips and exports payout CSV for bank transfers.

## Stack
- **Framework**: Next.js 14 App Router (TypeScript)
- **Database**: Supabase (PostgreSQL + RLS + Auth)
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: react-hook-form + zod
- **PDF**: jsPDF (client-side, no server cost)
- **Hosting**: Vercel (free tier)
- **Auth**: Supabase Auth (email magic link)

## Data Model (Source of Truth)
```
employees          payslips                refresh_tokens
──────────         ──────────────────      ──────────────
id (uuid)          id (uuid)               id (uuid)
email              employee_id → emp       user_id → auth
name               month (YYYY-MM)         token_hash
employee_id        basic_pay_cents         expires_at
designation        hra_cents               revoked_at
department         special_allowance_cents
bank_account       income_tax_cents
ifsc_code          pf_cents
is_active          professional_tax_cents
created_at         paid_days
                   lop_days
                   pay_date
                   created_at
```

## File Structure (Strict — Do Not Deviate)
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (employee)/
│   │   └── dashboard/page.tsx
│   │   └── payslips/[month]/page.tsx
│   ├── (admin)/
│   │   └── admin/employees/page.tsx
│   │   └── admin/payslips/page.tsx
│   └── api/
│       └── (any server actions or route handlers)
├── components/
│   ├── ui/          ← shadcn primitives only
│   ├── payslip/     ← PayslipCard, PayslipDetail, DownloadButton
│   └── admin/       ← PayslipForm, EmployeeTable, ExportCsvButton
├── hooks/
│   ├── usePayslips.ts
│   ├── useEmployees.ts
│   └── useAuth.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts    ← browser client
│   │   └── server.ts    ← server client (cookies)
│   ├── pdf/
│   │   └── generate-payslip.ts
│   └── csv/
│       └── generate-payout.ts
└── types/
    └── index.ts      ← all shared interfaces here
```

## Auth Rules
- Supabase Auth (email magic link — no passwords)
- Role stored in `user_metadata.role`: `'admin'` | `'employee'`
- Middleware protects all routes. /login is public.
- Employees only access `/(employee)/*` routes
- Admins access everything

## RLS Rules (Set in Supabase, enforced at DB level)
- `payslips`: employees SELECT only their own (match auth.uid → employee.user_id)
- `payslips`: admins SELECT/INSERT/UPDATE all
- `employees`: employees SELECT their own row only
- `employees`: admins full access

## Money Convention
- ALL monetary values stored in **cents** (integers), never floats
- Display logic divides by 100: `(basic_pay_cents / 100).toFixed(2)`
- CSV export also outputs in rupees: divide by 100

## Key Commands
```bash
npm run dev           # Start dev server
npm run build         # Build check
npx tsc --noEmit      # Type check (run after every code change)
npm run lint          # ESLint
```

## AI Tooling (used during development)
- **db-schema** — PostgreSQL migrations, RLS, indexes
- **api-scaffold** — Server actions, API routes, auth patterns
- **react-component** — UI components, hooks, forms
- **ui-ux-elite** — Design system, UX principles
- **sprint-ticket** — Feature scoping, acceptance criteria

## Out of Scope (This Version)
- Leave management
- Attendance tracking
- Performance reviews
- Multi-company / multi-tenant
- Mobile app
