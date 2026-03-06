-- ============================================================
-- 017_fix_payslips_select_own_uuid.sql
-- Match by employees.employee_id (TEXT) — aligns with migration 012 and
-- schemas where payslips.employee_id stores the human-readable ID (e.g. EMP001).
-- Requires employees.user_id to be populated (auth callback links on sign-in).
-- ============================================================

DROP POLICY IF EXISTS "payslips_select_own" ON payslips;

-- TEXT = TEXT: both payslips.employee_id and employees.employee_id
CREATE POLICY "payslips_select_own"
  ON payslips FOR SELECT
  USING (
    employee_id = (
      SELECT employee_id FROM employees
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );
