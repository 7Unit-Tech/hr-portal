-- ============================================================
-- 012_fix_payslips_select_own_rls.sql
-- payslip.employee_id references employees.employee_id (TEXT).
-- Use SECURITY DEFINER to bypass employees RLS when resolving
-- the current user's employee_id by email.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employee_id FROM employees
  WHERE email = (auth.jwt()->>'email')
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "payslips_select_own" ON payslips;

CREATE POLICY "payslips_select_own"
  ON payslips FOR SELECT
  USING (employee_id = public.get_my_employee_id());
