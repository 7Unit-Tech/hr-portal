# HR Portal — Architecture Document

## Purpose
Internal payslip management for 7Unit Softwares India (15 employees).
Replaces manual PDF emails. Zero-cost infrastructure on free tiers.

## User Roles

| Role | Access | How assigned |
|---|---|---|
| `admin` | Everything | Manually set in Supabase Auth user_metadata |
| `employee` | Own payslips + own profile | Default for all employees |

## Core User Flows

### Employee Flow
```
Login (magic link email)
  → Dashboard: list of payslips by month
  → Click month → Payslip detail view
  → Download PDF (client-side generation, matches 7Unit template)
```

### Admin Flow
```
Login
  → Employees: view team directory, add new employee
  → Payslips: select month → enter salary data per employee → save
  → Export CSV: select month → download payout CSV (bank transfer format)
```

## Payslip Fields (from 7Unit Template)

### Earnings
| Field | Storage | Notes |
|---|---|---|
| Basic Pay | `basic_pay_cents` | Base salary |
| HRA | `hra_cents` | House rent allowance |
| Special Allowance | `special_allowance_cents` | Variable |
| **Gross Earnings** | Derived | Sum of above |

### Deductions
| Field | Storage | Notes |
|---|---|---|
| Income Tax | `income_tax_cents` | TDS |
| Provident Fund | `pf_cents` | 12% of basic |
| Professional Tax | `professional_tax_cents` | State-specific |
| **Total Deductions** | Derived | Sum of above |

### Summary
| Field | Storage | Notes |
|---|---|---|
| Paid Days | `paid_days` | Integer |
| LOP Days | `lop_days` | Loss of pay |
| Pay Date | `pay_date` | DATE |
| **Net Pay** | Derived | Gross - Deductions |

## CSV Export Format (Bank Transfer)
```csv
Employee Name,Bank Account,IFSC Code,Net Amount (INR)
John Doe,1234567890,HDFC0001234,45000.00
```

## PDF Generation
Client-side using jsPDF. No server, no storage cost.
Template mirrors the 7Unit PaySlip_7Unit_Template.docx format.
Generated on-demand when employee clicks Download.

## Admin setup

Apply migrations first (see `supabase/migrations/`), especially `005_grant_auth_users_select.sql` if you see "permission denied for table users".

### Option A: SQL (first admin or external users)
For the first admin (e.g. CEO) or anyone not in the employees table:

1. User signs in once via magic link (creates the auth account).
2. In Supabase Dashboard → **SQL Editor**:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
   WHERE email = 'ceo@company.com';
   ```
3. User logs in again; they now have admin access.

### Option B: In-app (employees in the directory)
Any existing admin can promote employees from **Admin → Employees**:

- Open the ⋮ menu for an employee → **Make admin**.
- That user must have signed in at least once (magic link) for the promotion to succeed.

## Supabase Setup
- Auth: Email magic link (no passwords)
- Database: PostgreSQL with RLS
- Storage: Not needed (PDFs generated client-side)
- Edge Functions: Not needed (v1)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL          ← Public (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY     ← Public (safe to expose, RLS protects data)
SUPABASE_SERVICE_ROLE_KEY         ← Secret (server-side only, never in client)
NEXT_PUBLIC_APP_URL               ← Portal base URL for emails (e.g. https://hr.7unit.in)
RESEND_API_KEY                    ← Resend API key (welcome email when adding employee)
RESEND_FROM_EMAIL                 ← From address for Resend (default: onboarding@resend.dev)
```

## Performance Expectations
- 15 employees, ~180 payslips/year (15 × 12)
- Supabase free tier: 500MB storage, 2GB bandwidth — more than enough
- Expected: < 500ms page loads, < 2s PDF generation
