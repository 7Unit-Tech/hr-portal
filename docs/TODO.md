# HR Portal — TODO / Roadmap

---

## ✅ Completed

### Auth & access
- Magic link sign-in (Supabase Auth, no passwords)
- Role-based access: `admin` | `employee`
- Middleware protection; employees blocked from `/admin/*`
- Admin promotion in-app (Admin → Employees → Make admin) or via SQL

### Employee
- Dashboard with payslips by month
- Payslip detail view (earnings, deductions, net pay)
- Download PDF (client-side jsPDF, 7Unit template)
- PDF download on payslip card (without navigating to detail)
- Personalised greeting (name from employee directory)

### Admin
- **Employees**: Team directory, add/edit, soft delete, restore, CSV import
- **Payslips**: Per-month salary entry, form pre-fill from employee defaults, Saved indicator
- **Export**: Payout CSV for bank transfers (HDFC / NEFT format)
- **Welcome email**: Resend integration when adding a new employee

### Infrastructure
- Next.js 16, Supabase (PostgreSQL + RLS), Tailwind, shadcn/ui
- Deployed to Vercel
- Custom magic-link email template (domain-masked redirect)
- `NEXT_PUBLIC_APP_URL` used for auth redirects in production

---

## 🐛 Bug Fixes

### Non-admin user: payslip list and detail load blank

- **Symptom:** Employees see blank/loading state; payslips and slip details do not appear.
- **Affected:** Non-admin users (employee role).
- **Likely causes:** RLS policy, `usePayslips` / `usePayslip` filtering, or `employees.user_id` not linked to auth user.

---

## 1. Employee Verification Document

**Flow:** Request → Admin approval → Document available for download

| Step | Actor | Action |
|------|-------|--------|
| 1 | Employee | Request verification document from dashboard |
| 2 | System | Notify admin (e.g. in-app notification or email) |
| 3 | Admin | Review request, approve document generation |
| 4 | System | Generate document (PDF) |
| 5 | Employee | See document in dashboard, download |

**Out of scope (current):** Leave, attendance, performance reviews, multi-tenant.

---

## 2. Recruitment Module

**Admin-only module for hiring: open positions, JDs, candidate pipeline, AI-assisted evaluation.**

### 2.1 Open Position & Job Description

- Admin can create an open position
- JD input options:
  - **Paste** — Admin pastes existing JD text
  - **AI generate** — AI generates JD from brief requirement/description
- JD stored and linked to position

### 2.2 Candidate Management

- Admin adds candidate resume (upload or paste)
- **AI extraction** — Extract candidate info (name, contact, experience, skills, education, etc.) from resume
- **AI scoring** — Rate CV against JD (score 1–10)
- **AI output:**
  - Skill gaps vs JD
  - Interview questions to ask
  - Observations to note during interview
- Optional: Track interview process, update status (e.g. Scheduled → Completed → Offered / Rejected)

### 2.3 Data Model (to be designed)

- `positions` — Open roles, JD, status
- `candidates` — Resume, extracted info, score, status
- `candidate_positions` — Link candidate to position, interview status, notes

### 2.4 AI Integration

- Provider TBD (OpenAI, Anthropic, etc.)
- API key and costs to consider
- Prompt design for JD generation, CV extraction, scoring, and interview prep

---

## 3. Audit Log

**Requirement:** Log every user action for audit and compliance.

**Schema: `activity_logs`**

| Column     | Type        | Description                                |
|------------|-------------|--------------------------------------------|
| id         | UUID        | Primary key                                |
| user_id    | UUID        | References auth.users                      |
| action     | TEXT        | e.g. `create`, `update`, `delete`, `view`  |
| entity     | TEXT        | e.g. `payslip`, `employee`, `admin.promote`|
| entity_id  | TEXT        | ID of the affected record (nullable)       |
| timestamp  | TIMESTAMPTZ | When the action occurred                   |
| metadata   | JSONB       | Extra context (old/new values, IP, etc.)   |

**Implementation notes**

- Insert on every significant action (CRUD, auth changes, exports)
- RLS: admins read all; employees read own logs only (or admins-only)
- Index on `user_id`, `timestamp`, `entity` for queries

---

## 4. Resource Mapping View

**Requirement:** One-step dashboard for who is working on what, allocation size, and key attributes.

**Data shown**

| Field            | Description                                |
|------------------|--------------------------------------------|
| Employee         | Name, link to profile                      |
| Project          | Project(s) they are assigned to            |
| Allocation %     | % time allocated to each project           |
| Type             | Full-time employee / Consultant            |
| Skill set        | Skills (tags or list)                      |
| Other attributes | Designation, department, etc.              |

**View format**

- Single dashboard (Admin only)
- Filter by project, department, type
- Aggregate: total allocation, headcount by project, skill coverage
- Export to CSV optional

**Data model (to be designed)**

- `projects` — Project name, status, etc.
- `employee_projects` — employee_id, project_id, allocation_pct, role
- Extend `employees`: employment_type (fulltime/consultant), skills (array or JSONB)

---

## Notes

- Both features are additive; existing payslip flow unchanged
- Auth roles (`admin`, `employee`) already in place
- Consider notification mechanism (in-app vs email) for verification doc requests
