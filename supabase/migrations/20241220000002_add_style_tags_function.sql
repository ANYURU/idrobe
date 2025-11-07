-- Create function to add style tags to clothing items
CREATE OR REPLACE FUNCTION public.add_style_tags_to_item(
    item_id UUID,
    tag_names TEXT[]
)
RETURNS void AS $$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    -- Loop through each tag name
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Skip empty or null tag names
        IF tag_name IS NULL OR trim(tag_name) = '' THEN
            CONTINUE;
        END IF;
        
        -- Find or create the style tag
        SELECT id INTO tag_id 
        FROM public.style_tags 
        WHERE lower(name) = lower(trim(tag_name));
        
        -- If tag doesn't exist, create it
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name, is_active)
            VALUES (trim(tag_name), TRUE)
            RETURNING id INTO tag_id;
        END IF;
        
        -- Add the tag to the item (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT (clothing_item_id, style_tag_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_style_tags_to_item(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_style_tags_to_item(UUID, TEXT[]) TO anon;