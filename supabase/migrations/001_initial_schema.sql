-- ============================================================
-- 001_initial_schema.sql
-- HR Portal — Initial Schema
-- Tables: employees, payslips, refresh_tokens
--
-- Rollback:
--   DROP TABLE IF EXISTS refresh_tokens;
--   DROP TABLE IF EXISTS payslips;
--   DROP TABLE IF EXISTS employees;
--   DROP FUNCTION IF EXISTS trigger_set_updated_at();
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- Shared: auto-update updated_at on every row change
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ────────────────────────────────────────────────────────────
-- employees
-- ────────────────────────────────────────────────────────────

CREATE TABLE employees (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id    TEXT        NOT NULL,                        -- human-readable, e.g. EMP001
  email          TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  designation    TEXT        NOT NULL,
  department     TEXT        NOT NULL,
  bank_account   TEXT        NOT NULL,
  ifsc_code      TEXT        NOT NULL,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT employees_employee_id_unique UNIQUE (employee_id),
  CONSTRAINT employees_email_unique       UNIQUE (email),
  CONSTRAINT employees_ifsc_format        CHECK  (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

CREATE TRIGGER set_updated_at_employees
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- One auth user maps to at most one active employee record
CREATE UNIQUE INDEX idx_employees_user_id
  ON employees (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_employees_email
  ON employees (email)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_employees_is_active
  ON employees (is_active)
  WHERE deleted_at IS NULL;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

-- Employees: read their own profile only
CREATE POLICY "employees_select_own"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

-- Admins: unrestricted access (role stored in Supabase user_metadata)
CREATE POLICY "employees_admin_all"
  ON employees FOR ALL
  USING      ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ────────────────────────────────────────────────────────────
-- payslips
-- ────────────────────────────────────────────────────────────
-- `month` is stored as the first day of the month (e.g. 2025-01-01 = January 2025).
-- All monetary values are in paise / cents (BIGINT integers). Never floats.
-- Gross earnings and net pay are derived at query/display time.
-- ────────────────────────────────────────────────────────────

CREATE TABLE payslips (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id              UUID        NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  month                    DATE        NOT NULL,     -- first-of-month only; enforced below

  -- Earnings
  basic_pay_cents          BIGINT      NOT NULL DEFAULT 0,
  hra_cents                BIGINT      NOT NULL DEFAULT 0,
  special_allowance_cents  BIGINT      NOT NULL DEFAULT 0,

  -- Deductions
  income_tax_cents         BIGINT      NOT NULL DEFAULT 0,
  pf_cents                 BIGINT      NOT NULL DEFAULT 0,
  professional_tax_cents   BIGINT      NOT NULL DEFAULT 0,

  -- Days
  paid_days                INTEGER     NOT NULL,
  lop_days                 INTEGER     NOT NULL DEFAULT 0,

  pay_date                 DATE        NOT NULL,

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ,

  -- One payslip per employee per month
  CONSTRAINT payslips_employee_month_unique     UNIQUE  (employee_id, month),

  -- month must be the first day of the month
  CONSTRAINT payslips_month_first_of_month      CHECK   (EXTRACT(DAY FROM month) = 1),

  -- Monetary values must be non-negative
  CONSTRAINT payslips_basic_pay_positive        CHECK   (basic_pay_cents >= 0),
  CONSTRAINT payslips_hra_positive              CHECK   (hra_cents >= 0),
  CONSTRAINT payslips_special_allowance_positive CHECK  (special_allowance_cents >= 0),
  CONSTRAINT payslips_income_tax_positive       CHECK   (income_tax_cents >= 0),
  CONSTRAINT payslips_pf_positive               CHECK   (pf_cents >= 0),
  CONSTRAINT payslips_professional_tax_positive CHECK   (professional_tax_cents >= 0),

  -- Day counts must be sane
  CONSTRAINT payslips_paid_days_valid           CHECK   (paid_days >= 0 AND paid_days <= 31),
  CONSTRAINT payslips_lop_days_valid            CHECK   (lop_days  >= 0 AND lop_days  <= 31)
);

CREATE TRIGGER set_updated_at_payslips
  BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- FK: always index the FK column
CREATE INDEX idx_payslips_employee_id
  ON payslips (employee_id);

-- Primary query pattern: list payslips for a given employee, newest first
CREATE INDEX idx_payslips_employee_month
  ON payslips (employee_id, month DESC)
  WHERE deleted_at IS NULL;

-- Admin query pattern: all payslips for a given month
CREATE INDEX idx_payslips_month
  ON payslips (month DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips FORCE ROW LEVEL SECURITY;

-- Employees: select only their own payslips (resolved via employees.user_id)
CREATE POLICY "payslips_select_own"
  ON payslips FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Admins: unrestricted access
CREATE POLICY "payslips_admin_all"
  ON payslips FOR ALL
  USING      ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ────────────────────────────────────────────────────────────
-- refresh_tokens
-- Tracks issued tokens for revocation support.
-- `revoked_at` serves as the soft-delete sentinel (no deleted_at needed).
-- ────────────────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL,    -- SHA-256 of raw token; never store raw
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,             -- NULL = active
  user_agent  TEXT,
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

CREATE TRIGGER set_updated_at_refresh_tokens
  BEFORE UPDATE ON refresh_tokens
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX idx_refresh_tokens_user_id
  ON refresh_tokens (user_id);

-- Active-token lookup: narrow to non-expired, non-revoked rows only
CREATE INDEX idx_refresh_tokens_active
  ON refresh_tokens (expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY;

-- Users: manage only their own tokens
CREATE POLICY "refresh_tokens_select_own"
  ON refresh_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "refresh_tokens_insert_own"
  ON refresh_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "refresh_tokens_update_own"
  ON refresh_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "refresh_tokens_delete_own"
  ON refresh_tokens FOR DELETE
  USING (user_id = auth.uid());

-- Admins: full visibility (for support / audit)
CREATE POLICY "refresh_tokens_admin_all"
  ON refresh_tokens FOR ALL
  USING      ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
