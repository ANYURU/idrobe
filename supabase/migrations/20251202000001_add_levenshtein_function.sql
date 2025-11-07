-- Add levenshtein function for category matching
-- The fuzzystrmatch extension provides levenshtein function
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- The levenshtein function is now available in the public schema
-- No need to create a wrapper function