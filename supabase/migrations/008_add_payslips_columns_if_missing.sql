-- ============================================================
-- 008_add_payslips_columns_if_missing.sql
-- Ensures all payslip columns exist (fixes schema cache errors
-- like "Could not find the 'basic_pay_cents' column").
-- Safe to run if columns already exist.
-- ============================================================

ALTER TABLE payslips ADD COLUMN IF NOT EXISTS basic_pay_cents          BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS hra_cents                BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS special_allowance_cents  BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS income_tax_cents         BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS pf_cents                 BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS professional_tax_cents    BIGINT NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS paid_days                INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS lop_days                 INTEGER NOT NULL DEFAULT 0;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS pay_date                 DATE;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ;

-- Backfill pay_date if null (use month column if present)
UPDATE payslips SET pay_date = month WHERE pay_date IS NULL AND month IS NOT NULL;
