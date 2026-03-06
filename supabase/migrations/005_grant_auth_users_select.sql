-- ============================================================
-- 005_grant_auth_users_select.sql
-- Fixes "permission denied for table users" when PostgREST/RLS
-- evaluates policies on payslips/employees. In some Supabase
-- setups the session or auth resolution touches auth.users; the
-- authenticated role has no SELECT by default.
--
-- Trade-off: authenticated users can in theory SELECT from
-- auth.users (e.g. list emails). For an internal HR portal with
-- trusted employees this is acceptable; RLS still protects
-- public.employees and public.payslips.
-- ============================================================

GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
