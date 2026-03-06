-- ============================================================
-- 016_add_employees_user_id_if_missing.sql
-- Ensures employees.user_id exists (links auth user to employee).
-- Required for: employees_select_own RLS, useCurrentEmployee, payslips RLS.
-- ============================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for RLS policy: employees_select_own USING (user_id = auth.uid())
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_id
  ON employees (user_id)
  WHERE deleted_at IS NULL AND user_id IS NOT NULL;
