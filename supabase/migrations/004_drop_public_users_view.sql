-- ============================================================
-- 004_drop_public_users_view.sql
-- Fixes "permission denied for table users".
-- A public.users view (common in Supabase templates) selects from
-- auth.users; the authenticated role has no SELECT there.
-- The HR Portal uses auth.uid()/auth.jwt() and employees — it
-- does not use a users view. Safe to drop if present.
-- ============================================================

DROP VIEW IF EXISTS public.users;
