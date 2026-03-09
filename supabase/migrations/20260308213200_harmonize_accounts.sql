-- Migration to harmonize accounts table
-- Renaming legacy columns to standardized names used in the Ledger module.

DO $$ 
BEGIN
    -- Rename bank_name to name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='bank_name') THEN
        ALTER TABLE public.accounts RENAME COLUMN bank_name TO name;
    END IF;

    -- Rename account_type to type if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='account_type') THEN
        ALTER TABLE public.accounts RENAME COLUMN account_type TO type;
    END IF;

    -- Ensure 'code' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='accounts' AND column_name='code') THEN
        ALTER TABLE public.accounts ADD COLUMN code TEXT;
    END IF;
END $$;
