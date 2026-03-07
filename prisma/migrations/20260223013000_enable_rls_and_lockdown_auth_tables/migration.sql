-- Enable RLS and lock down Better Auth tables exposed in public schema.
-- This migration is idempotent so it can run safely in environments where
-- the same hardening may already have been applied manually.
DO $$
DECLARE
  target_table TEXT;
  target_tables TEXT[] := ARRAY[
    '_prisma_migrations',
    'account',
    'invitation',
    'member',
    'organization',
    'passkey',
    'session',
    'twoFactor',
    'user',
    'verification'
  ];
BEGIN
  FOREACH target_table IN ARRAY target_tables
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      target_table
    );

    EXECUTE format(
      'REVOKE ALL ON TABLE public.%I FROM anon, authenticated',
      target_table
    );

    EXECUTE format(
      'DROP POLICY IF EXISTS deny_anon_authenticated ON public.%I',
      target_table
    );

    EXECUTE format(
      'CREATE POLICY deny_anon_authenticated ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      target_table
    );
  END LOOP;
END $$;
