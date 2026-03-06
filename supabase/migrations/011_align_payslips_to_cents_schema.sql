-- ============================================================
-- 011_align_payslips_to_cents_schema.sql
-- Drop duplicate non-_cents columns so only _cents remain.
-- Table has both basic_pay and basic_pay_cents — keep _cents, drop the rest.
-- ============================================================

DO $$
BEGIN
  -- When both exist: copy data, drop non-_cents. When only non-_cents exists: rename.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'basic_pay') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'basic_pay_cents') THEN
      UPDATE payslips SET basic_pay_cents = COALESCE(basic_pay_cents, basic_pay);
      ALTER TABLE payslips DROP COLUMN basic_pay;
    ELSE
      ALTER TABLE payslips RENAME COLUMN basic_pay TO basic_pay_cents;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'hra') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'hra_cents') THEN
      UPDATE payslips SET hra_cents = COALESCE(hra_cents, hra);
      ALTER TABLE payslips DROP COLUMN hra;
    ELSE
      ALTER TABLE payslips RENAME COLUMN hra TO hra_cents;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'special_allowance') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'special_allowance_cents') THEN
      UPDATE payslips SET special_allowance_cents = COALESCE(special_allowance_cents, special_allowance);
      ALTER TABLE payslips DROP COLUMN special_allowance;
    ELSE
      ALTER TABLE payslips RENAME COLUMN special_allowance TO special_allowance_cents;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'income_tax') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'income_tax_cents') THEN
      UPDATE payslips SET income_tax_cents = COALESCE(income_tax_cents, income_tax);
      ALTER TABLE payslips DROP COLUMN income_tax;
    ELSE
      ALTER TABLE payslips RENAME COLUMN income_tax TO income_tax_cents;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'pf') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'pf_cents') THEN
      UPDATE payslips SET pf_cents = COALESCE(pf_cents, pf);
      ALTER TABLE payslips DROP COLUMN pf;
    ELSE
      ALTER TABLE payslips RENAME COLUMN pf TO pf_cents;
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'professional_tax') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'professional_tax_cents') THEN
      UPDATE payslips SET professional_tax_cents = COALESCE(professional_tax_cents, professional_tax);
      ALTER TABLE payslips DROP COLUMN professional_tax;
    ELSE
      ALTER TABLE payslips RENAME COLUMN professional_tax TO professional_tax_cents;
    END IF;
  END IF;
END
$$;
