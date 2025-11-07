-- Fix problematic functions and improve error handling
BEGIN;

-- The levenshtein function is provided by the fuzzystrmatch extension
-- No need to create a wrapper function

-- Improve find_or_create_category with better validation
CREATE OR REPLACE FUNCTION public.find_or_create_category(category_name TEXT)
RETURNS UUID AS $$
DECLARE
    category_id UUID;
    clean_name TEXT;
BEGIN
    IF category_name IS NULL OR trim(category_name) = '' THEN
        RAISE EXCEPTION 'Category name cannot be null or empty';
    END IF;
    
    clean_name := lower(trim(regexp_replace(category_name, '[^a-zA-Z0-9\s\-]', '', 'g')));
    
    SELECT id INTO category_id FROM public.clothing_categories WHERE lower(name) = clean_name;
    
    IF category_id IS NULL THEN
        INSERT INTO public.clothing_categories (name, is_active, source)
        VALUES (clean_name, TRUE, 'ai_suggested')
        RETURNING id INTO category_id;
    END IF;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add wardrobe diversity calculation
CREATE OR REPLACE FUNCTION public.calculate_wardrobe_diversity(target_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
    SELECT
        (COUNT(DISTINCT category_id) * 10 + 
         COUNT(DISTINCT primary_color) * 5 + 
         COUNT(DISTINCT subcategory_id) * 3)::DECIMAL / 100.0 
    INTO diversity_score
    FROM public.clothing_items
    WHERE user_id = target_user_id AND is_archived = FALSE AND deleted_at IS NULL;

    RETURN LEAST(COALESCE(diversity_score, 0), 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;