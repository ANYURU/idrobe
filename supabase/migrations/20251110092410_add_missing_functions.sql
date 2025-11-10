-- Add missing functions that are required by the application

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_active_categories_for_prompt();
DROP FUNCTION IF EXISTS public.add_style_tags_to_item(UUID, TEXT[]);

-- Function to get active categories for AI prompts
CREATE OR REPLACE FUNCTION public.get_active_categories_for_prompt()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    RETURN json_build_object(
        'categories', (
            SELECT json_agg(name ORDER BY display_order)
            FROM public.clothing_categories 
            WHERE is_active = TRUE
        ),
        'subcategories', (
            SELECT json_object_agg(
                cc.name,
                json_agg(cs.name ORDER BY cs.name)
            )
            FROM public.clothing_categories cc
            JOIN public.clothing_subcategories cs ON cc.id = cs.category_id
            WHERE cc.is_active = TRUE AND cs.is_active = TRUE
            GROUP BY cc.name
        ),
        'style_tags', (
            SELECT json_agg(name ORDER BY popularity_score DESC)
            FROM public.style_tags
            WHERE is_active = TRUE
        )
    );
END;
$function$;

-- Function to add style tags to clothing items
CREATE OR REPLACE FUNCTION public.add_style_tags_to_item(item_id UUID, tag_names TEXT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Find or create the style tag
        SELECT id INTO tag_id
        FROM public.style_tags
        WHERE LOWER(name) = LOWER(TRIM(tag_name));
        
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name, is_active)
            VALUES (TRIM(tag_name), TRUE)
            RETURNING id INTO tag_id;
        END IF;
        
        -- Link the tag to the item (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT (clothing_item_id, style_tag_id) DO NOTHING;
    END LOOP;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_active_categories_for_prompt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_categories_for_prompt() TO anon;
GRANT EXECUTE ON FUNCTION public.add_style_tags_to_item(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_style_tags_to_item(UUID, TEXT[]) TO anon;