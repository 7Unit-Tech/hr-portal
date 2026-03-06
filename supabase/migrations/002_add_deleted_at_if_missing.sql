-- ============================================================
-- 002_add_deleted_at_if_missing.sql
-- Ensures deleted_at exists on payslips and employees.
-- Safe to run even if columns already exist (no-op).
-- ============================================================

-- payslips
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- employees (in case it was also missing)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
