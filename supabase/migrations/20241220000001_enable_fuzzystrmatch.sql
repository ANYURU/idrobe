-- Enable fuzzystrmatch extension for levenshtein function
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- The levenshtein function is now available in the public schema
-- Test that it works
SELECT levenshtein('test', 'test') AS should_be_zero;