-- Properly move vector extension from public to extensions schema
-- This requires updating the extension's schema directly

ALTER EXTENSION vector SET SCHEMA extensions;