-- ============================================================
-- 003_fix_profiles_rls_recursion.sql
-- Fixes "infinite recursion detected in policy for relation profiles".
-- The HR Portal uses employees, not profiles — this table may exist
-- from a Supabase template. We replace recursive policies with
-- simple, direct checks.
-- ============================================================

-- Skip if profiles table doesn't exist (app doesn't use it)
DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Drop all existing policies (they may cause recursion)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;

    -- Add simple non-recursive policies (id = auth.uid(), no subqueries)
    -- Assumes profiles.id matches auth.users(id)
    CREATE POLICY "profiles_select_own"
      ON public.profiles FOR SELECT
      USING (id = auth.uid());

    CREATE POLICY "profiles_update_own"
      ON public.profiles FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());

    CREATE POLICY "profiles_insert_own"
      ON public.profiles FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
END
$$;
