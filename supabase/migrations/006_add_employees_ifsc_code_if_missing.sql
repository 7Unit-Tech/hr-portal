-- ============================================================
-- 006_add_employees_ifsc_code_if_missing.sql
-- Ensures employees.ifsc_code exists (schema cache error fix).
-- Safe to run if the column already exists.
-- ============================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

-- Backfill with a valid placeholder so NOT NULL + format check can apply
UPDATE employees SET ifsc_code = 'HDFC0000000' WHERE ifsc_code IS NULL;

ALTER TABLE employees ALTER COLUMN ifsc_code SET NOT NULL;

-- Add format check only if missing (e.g. HDFC0001234)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employees_ifsc_format' AND conrelid = 'public.employees'::regclass
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_ifsc_format
      CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$');
  END IF;
END
$$;
