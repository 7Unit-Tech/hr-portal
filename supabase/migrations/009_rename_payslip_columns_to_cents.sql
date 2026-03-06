-- ============================================================
-- 009_rename_payslip_columns_to_cents.sql
-- Fixes "null value in column basic_pay" — some setups have columns
-- named basic_pay, hra, etc. instead of basic_pay_cents, hra_cents.
-- Renames them and ensures BIGINT type. If original stored rupees
-- (numeric with decimals), multiply by 100 when converting.
-- ============================================================

DO $$
DECLARE
  col_type text;
BEGIN
  -- basic_pay → basic_pay_cents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'basic_pay')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'basic_pay_cents') THEN
    SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'basic_pay';
    ALTER TABLE payslips RENAME COLUMN basic_pay TO basic_pay_cents;
    IF col_type IN ('numeric', 'decimal', 'real', 'double precision') THEN
      ALTER TABLE payslips ALTER COLUMN basic_pay_cents TYPE BIGINT USING (COALESCE(ROUND(basic_pay_cents * 100), 0)::bigint);
    ELSE
      ALTER TABLE payslips ALTER COLUMN basic_pay_cents TYPE BIGINT USING (COALESCE(basic_pay_cents, 0)::bigint);
    END IF;
    ALTER TABLE payslips ALTER COLUMN basic_pay_cents SET NOT NULL;
    ALTER TABLE payslips ALTER COLUMN basic_pay_cents SET DEFAULT 0;
  END IF;

  -- hra → hra_cents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'hra')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'hra_cents') THEN
    SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'hra';
    ALTER TABLE payslips RENAME COLUMN hra TO hra_cents;
    IF col_type IN ('numeric', 'decimal', 'real', 'double precision') THEN
      ALTER TABLE payslips ALTER COLUMN hra_cents TYPE BIGINT USING (COALESCE(ROUND(hra_cents * 100), 0)::bigint);
    ELSE
      ALTER TABLE payslips ALTER COLUMN hra_cents TYPE BIGINT USING (COALESCE(hra_cents, 0)::bigint);
    END IF;
    ALTER TABLE payslips ALTER COLUMN hra_cents SET NOT NULL;
    ALTER TABLE payslips ALTER COLUMN hra_cents SET DEFAULT 0;
  END IF;

  -- special_allowance → special_allowance_cents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'special_allowance')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'special_allowance_cents') THEN
    SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'special_allowance';
    ALTER TABLE payslips RENAME COLUMN special_allowance TO special_allowance_cents;
    IF col_type IN ('numeric', 'decimal', 'real', 'double precision') THEN
      ALTER TABLE payslips ALTER COLUMN special_allowance_cents TYPE BIGINT USING (COALESCE(ROUND(special_allowance_cents * 100), 0)::bigint);
    ELSE
      ALTER TABLE payslips ALTER COLUMN special_allowance_cents TYPE BIGINT USING (COALESCE(special_allowance_cents, 0)::bigint);
    END IF;
    ALTER TABLE payslips ALTER COLUMN special_allowance_cents SET NOT NULL;
    ALTER TABLE payslips ALTER COLUMN special_allowance_cents SET DEFAULT 0;
  END IF;

  -- income_tax → income_tax_cents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'income_tax')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'income_tax_cents') THEN
    SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'income_tax';
    ALTER TABLE payslips RENAME COLUMN income_tax TO income_tax_cents;
    IF col_type IN ('numeric', 'decimal', 'real', 'double precision') THEN
      ALTER TABLE payslips ALTER COLUMN income_tax_cents TYPE BIGINT USING (COALESCE(ROUND(income_tax_cents * 100), 0)::bigint);
    ELSE
      ALTER TABLE payslips ALTER COLUMN income_tax_cents TYPE BIGINT USING (COALESCE(income_tax_cents, 0)::bigint);
    END IF;
    ALTER TABLE payslips ALTER COLUMN income_tax_cents SET NOT NULL;
    ALTER TABLE payslips ALTER COLUMN income_tax_cents SET DEFAULT 0;
  END IF;

  -- pf → pf_cents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'pf')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'pf_cents') THEN
    SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'pf';
    ALTER TABLE payslips RENAME COLUMN pf TO pf_cents;
    IF col_type IN ('numeric', 'decimal', 'real', 'double precision') THEN
      ALTER TABLE payslips ALTER COLUMN pf_cents TYPE BIGINT USING (COALESCE(ROUND(pf_cents * 100), 0)::bigint);
    ELSE
      ALTER TABLE payslips ALTER COLUMN pf_cents TYPE BIGINT USING (COALESCE(pf_cents, 0)::bigint);
    END IF;
    ALTER TABLE payslips ALTER COLUMN pf_cents SET NOT NULL;
    ALTER TABLE payslips ALTER COLUMN pf_cents SET DEFAULT 0;
  END IF;

  -- professional_tax → professional_tax_cents
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'professional_tax')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'professional_tax_cents') THEN
    SELECT data_type INTO col_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payslips' AND column_name = 'professional_tax';
    ALTER TABLE payslips RENAME COLUMN professional_tax TO professional_tax_cents;
    IF col_type IN ('numeric', 'decimal', 'real', 'double precision') THEN
      ALTER TABLE payslips ALTER COLUMN professional_tax_cents TYPE BIGINT USING (COALESCE(ROUND(professional_tax_cents * 100), 0)::bigint);
    ELSE
      ALTER TABLE payslips ALTER COLUMN professional_tax_cents TYPE BIGINT USING (COALESCE(professional_tax_cents, 0)::bigint);
    END IF;
    ALTER TABLE payslips ALTER COLUMN professional_tax_cents SET NOT NULL;
    ALTER TABLE payslips ALTER COLUMN professional_tax_cents SET DEFAULT 0;
  END IF;
END
$$;
