-- Enable http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;

-- Grant usage to authenticated users (only if net schema exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'net') THEN
        GRANT USAGE ON SCHEMA net TO authenticated;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO authenticated;
    END IF;
END $$;