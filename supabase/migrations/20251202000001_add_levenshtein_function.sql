-- Add levenshtein function for category matching
-- The fuzzystrmatch extension provides levenshtein function
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;

-- Create wrapper function in public schema
CREATE OR REPLACE FUNCTION public.levenshtein(text, text)
RETURNS integer AS $$
BEGIN
    RETURN extensions.levenshtein($1, $2);
EXCEPTION
    WHEN OTHERS THEN
        RETURN CASE WHEN $1 = $2 THEN 0 ELSE 1 END;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SECURITY DEFINER SET search_path = 'public, extensions';