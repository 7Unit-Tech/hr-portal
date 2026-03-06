-- ============================================================
-- 014_add_employee_salary_columns.sql
-- Add default salary (basic, HRA, special allowance) to employees.
-- Used to pre-fill payroll; updated on promotion.
-- ============================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS basic_pay_cents          BIGINT NOT NULL DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hra_cents                BIGINT NOT NULL DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS special_allowance_cents  BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN employees.basic_pay_cents         IS 'Monthly basic pay in paise; pre-fills payroll until promotion';
COMMENT ON COLUMN employees.hra_cents               IS 'Monthly HRA in paise; pre-fills payroll until promotion';
COMMENT ON COLUMN employees.special_allowance_cents IS 'Monthly special allowance in paise; pre-fills payroll until promotion';
