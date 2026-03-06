-- ============================================================
-- 015_add_employee_deduction_columns.sql
-- Add default deductions (income tax, PF, professional tax) to employees.
-- Pre-fills payroll; admin can override per month.
-- ============================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_cents         BIGINT NOT NULL DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pf_cents                 BIGINT NOT NULL DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS professional_tax_cents   BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN employees.income_tax_cents       IS 'Default monthly income tax in paise; pre-fills payroll';
COMMENT ON COLUMN employees.pf_cents               IS 'Default monthly PF in paise; pre-fills payroll';
COMMENT ON COLUMN employees.professional_tax_cents IS 'Default monthly professional tax in paise; pre-fills payroll';
