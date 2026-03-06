-- ============================================================
-- 007_admin_policy_via_is_admin_function.sql
-- Fixes "new row violates row-level security policy" when admin
-- inserts into employees. Admin check is done via SECURITY DEFINER
-- reading auth.users so it does not depend on JWT (avoids caching
-- or user_metadata path issues).
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT (raw_user_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;

-- employees: replace admin policy to use is_admin()
DROP POLICY IF EXISTS "employees_admin_all" ON employees;
CREATE POLICY "employees_admin_all"
  ON employees FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- payslips: same
DROP POLICY IF EXISTS "payslips_admin_all" ON payslips;
CREATE POLICY "payslips_admin_all"
  ON payslips FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- refresh_tokens: same (only if table exists — not all setups have it)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'refresh_tokens') THEN
    DROP POLICY IF EXISTS "refresh_tokens_admin_all" ON refresh_tokens;
    CREATE POLICY "refresh_tokens_admin_all"
      ON refresh_tokens FOR ALL
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END
$$;
