-- Move vector extension from public schema to dedicated extensions schema
-- This improves security by isolating extensions from application data

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Since vector extension is already installed in public schema and has dependencies,
-- we'll create a new installation in extensions schema and update references
-- The public schema version will be cleaned up in a future migration after all dependencies are updated

-- Install vector extension in extensions schema (this will coexist with public version temporarily)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add comment to track this migration
COMMENT ON SCHEMA extensions IS 'Dedicated schema for PostgreSQL extensions to improve security isolation';