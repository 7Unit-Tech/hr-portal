-- ============================================================
-- 013_add_employees_doj_pf_uan.sql
-- Add optional Date of Joining and PF UAN to employees
-- ============================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS date_of_joining DATE,
  ADD COLUMN IF NOT EXISTS pf_uan         TEXT;

COMMENT ON COLUMN employees.date_of_joining IS 'Date of joining (optional)';
COMMENT ON COLUMN employees.pf_uan IS 'Provident Fund UAN (optional)';
