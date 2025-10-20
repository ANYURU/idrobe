-- Fix find_or_create_subcategory to handle duplicates properly
CREATE OR REPLACE FUNCTION find_or_create_subcategory(subcategory_name TEXT, parent_category_id UUID)
RETURNS UUID AS $$
DECLARE
    subcategory_id UUID;
BEGIN
    -- Try to find existing subcategory first
    SELECT id INTO subcategory_id 
    FROM public.clothing_subcategories 
    WHERE name = subcategory_name 
    AND category_id = parent_category_id 
    AND is_active = TRUE;
    
    -- If found, return it
    IF subcategory_id IS NOT NULL THEN
        RETURN subcategory_id;
    END IF;
    
    -- If not found, try to create it with ON CONFLICT handling
    INSERT INTO public.clothing_subcategories (name, category_id, is_active, source)
    VALUES (subcategory_name, parent_category_id, FALSE, 'ai_suggested')
    ON CONFLICT (name, category_id) DO UPDATE SET
        is_active = EXCLUDED.is_active,
        source = EXCLUDED.source
    RETURNING id INTO subcategory_id;
    
    RETURN subcategory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';