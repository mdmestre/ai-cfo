-- Supabase Auth Compatibility Shim for Local Postgres
-- This creates the 'auth' schema and a dummy 'uid()' function 
-- so that RLS policies using Supabase syntax can be applied locally.

CREATE SCHEMA IF NOT EXISTS auth;

-- Mock auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    raw_user_meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
    -- This is a dummy function. In local dev, you might return the current_user 
    -- or a hardcoded ID if you aren't actually using Supabase auth yet.
    -- For now, we return NULL or a placeholder.
    RETURN (SELECT id FROM public.users LIMIT 1); 
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
BEGIN
    RETURN 'authenticated';
END;
$$ LANGUAGE plpgsql STABLE;
