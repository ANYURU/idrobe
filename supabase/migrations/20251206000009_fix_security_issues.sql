-- Fix security issue with levenshtein function search path
BEGIN;

-- Drop and recreate levenshtein function with secure search_path
DROP FUNCTION IF EXISTS public.levenshtein(text, text);

CREATE OR REPLACE FUNCTION public.levenshtein(text, text)
RETURNS integer 
SET search_path = ''
AS $$
BEGIN
    RETURN extensions.levenshtein($1, $2);
EXCEPTION
    WHEN OTHERS THEN
        RETURN CASE WHEN $1 = $2 THEN 0 ELSE 1 END;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SECURITY DEFINER;

COMMIT;