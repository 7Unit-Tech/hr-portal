# HR Portal

An internal HR portal for payslip management and payroll operations. Built for 7Unit Softwares India—a small team (~15 employees)—to replace manual PDF emails with a self-service web app.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-green?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

---

## Features

### Employee
- **Magic-link sign-in** — Email-based auth, no passwords
- **Dashboard** — View payslips by month
- **Payslip detail** — Earnings, deductions, net pay breakdown
- **PDF download** — Client-side generation (no server cost)
- **Personalised greeting** — Uses employee name from directory

### Admin
- **Employee directory** — Add, edit, soft-delete, restore
- **CSV import** — Bulk add employees from template
- **Payslip entry** — Monthly salary data per employee (earnings, deductions, paid days)
- **Payout export** — Bank-transfer CSV for HDFC / NEFT format
- **Admin promotion** — Promote employees to admin (in-app or via SQL)
- **Welcome emails** — Optional Resend integration when adding employees

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + RLS + Auth) |
| UI | Tailwind CSS, shadcn/ui, Radix primitives |
| Forms | react-hook-form + Zod |
| PDF | jsPDF (client-side) |
| Email | Resend (optional) |
| Hosting | Vercel |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (employee)/dashboard/, payslips/[month]/
│   ├── (admin)/admin/employees/, admin/payslips/
│   ├── auth/callback/          # PKCE code exchange + employee linking
│   └── api/
│       ├── payslips/upsert     # Admin-only payslip save
│       ├── admin/promote       # Admin promotion
│       └── send-welcome-email  # Admin-only welcome emails
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── payslip/                # PayslipCard, PayslipDetail, DownloadButton
│   └── admin/                  # PayslipForm, EmployeeTable, ExportCsvButton
├── hooks/                      # useAuth, usePayslips, useEmployees, useCurrentEmployee
├── lib/
│   ├── supabase/               # client, server, admin (service-role)
│   ├── pdf/                    # jsPDF generation
│   └── csv/                    # Payout CSV
└── middleware.ts               # Auth + role-based routing
```

### Auth & Security
- **Supabase Auth** — Magic link (OTP) login
- **Roles** — `admin` \| `employee` in `user_metadata.role`
- **RLS** — Employees see only their own payslips; admins have full access
- **Middleware** — Protects routes; `/admin/*` requires admin role
- **API routes** — All privileged endpoints verify `role === 'admin'` before proceeding

### Data
- **Money** — Stored in cents (integers) to avoid floating-point issues
- **Soft delete** — `deleted_at` on employees; payslips remain for audit
- **Employee–Auth link** — `employees.user_id` set on first sign-in (auth callback) for RLS

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project

### 1. Clone and install
```bash
git clone https://github.com/your-username/hr-portal.git
cd hr-portal
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role (server-only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL (e.g. `http://localhost:3000`) |
| `RESEND_API_KEY` | Optional | Welcome emails |
| `RESEND_FROM_EMAIL` | Optional | From address for Resend |
| `NEXT_PUBLIC_PAYSLIP_*` | Optional | PDF branding (logo, company name) |

### 3. Database
```bash
# Apply migrations in Supabase Dashboard SQL Editor
# (or use Supabase CLI)
# See supabase/migrations/
```

### 4. First admin
After the first user signs in via magic link:

```sql
-- Supabase Dashboard → SQL Editor
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@company.com';
```

### 5. Run
```bash
npm run dev    # http://localhost:3000
npm run build  # Production build
npm run lint   # ESLint
```

---

## Code Quality & Practices

### Security
- ✅ No secrets in client code; service role used only server-side
- ✅ All privileged API routes check `role === 'admin'`
- ✅ RLS enforced at DB; anon key + RLS protect data
- ✅ HTML escaping in email templates
- ✅ `.env*` in `.gitignore`

### TypeScript
- ✅ Strict mode; shared types in `lib/supabase/types.ts`
- ✅ DB Row/Insert/Update types aligned with schema

### Forms & Validation
- ✅ PayslipForm uses Zod schema with react-hook-form
- ✅ Money fields validated (min 0, paid_days 0–31)

### React / Next.js
- ✅ `useSearchParams` wrapped in Suspense (login page)
- ✅ `getUser()` (not `getSession()`) for JWT validation in middleware
- ✅ Cancellation in `usePayslip` effect to avoid race conditions

### UI / Accessibility
- ✅ `aria-label` on forms and nav
- ✅ Focus-visible styles on interactive elements
- ✅ Semantic HTML (labels, roles)

### Money Handling
- ✅ All amounts in cents (integers)
- ✅ `formatRupees` centralises display logic
- ✅ `formatRupeesForPDF` for jsPDF (Latin-1 safe)

### Testing
- Manual testing; no E2E suite in this version.

---

## Deployment (Vercel)

1. Connect repo to Vercel
2. Add env vars (see `.env.example`)
3. Configure Supabase Auth:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`
4. Run migrations on production Supabase
5. Deploy

---

## Docs

- [Architecture](docs/architecture.md) — Flows, data model, admin setup

---

## License

MIT
