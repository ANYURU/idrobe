-- ============================================================================
-- UPDATE CLOTHING ITEMS TO USE REFERENCE TABLES
-- Replace enum columns with foreign key references
-- ============================================================================

-- Add new columns that reference the dynamic tables
ALTER TABLE public.clothing_items 
ADD COLUMN category_id UUID REFERENCES public.clothing_categories(id),
ADD COLUMN subcategory_id UUID REFERENCES public.clothing_subcategories(id);

-- Create junction table for style tags (many-to-many relationship)
CREATE TABLE public.clothing_item_style_tags (
    clothing_item_id UUID,
    style_tag_id UUID REFERENCES public.style_tags(id),
    PRIMARY KEY (clothing_item_id, style_tag_id)
);

-- Add indexes for the new foreign keys
CREATE INDEX idx_clothing_items_category ON public.clothing_items(category_id);
CREATE INDEX idx_clothing_items_subcategory ON public.clothing_items(subcategory_id);
CREATE INDEX idx_style_tags_junction_item ON public.clothing_item_style_tags(clothing_item_id);
CREATE INDEX idx_style_tags_junction_tag ON public.clothing_item_style_tags(style_tag_id);

-- RLS for junction table
ALTER TABLE public.clothing_item_style_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own item style tags" ON public.clothing_item_style_tags
FOR ALL USING (
    clothing_item_id IN (
        SELECT id FROM public.clothing_items WHERE user_id = auth.uid()
    )
);

-- Helper function to get clothing item with all related data
CREATE OR REPLACE FUNCTION get_clothing_item_with_categories(item_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', ci.id,
        'name', ci.name,
        'category', CASE 
            WHEN cc.id IS NOT NULL THEN json_build_object('id', cc.id, 'name', cc.name)
            ELSE NULL 
        END,
        'subcategory', CASE 
            WHEN cs.id IS NOT NULL THEN json_build_object('id', cs.id, 'name', cs.name)
            ELSE NULL 
        END,
        'style_tags', COALESCE((
            SELECT json_agg(json_build_object('id', st.id, 'name', st.name))
            FROM public.clothing_item_style_tags cist
            JOIN public.style_tags st ON cist.style_tag_id = st.id
            WHERE cist.clothing_item_id = ci.id
        ), '[]'::json),
        'primary_color', ci.primary_color,
        'secondary_colors', ci.secondary_colors,
        'material', ci.material,
        'pattern', ci.pattern,
        'image_url', ci.image_url,
        'thumbnail_url', ci.thumbnail_url,
        'times_worn', ci.times_worn,
        'is_favorite', ci.is_favorite,
        'created_at', ci.created_at
    ) INTO result
    FROM public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
    LEFT JOIN public.clothing_subcategories cs ON ci.subcategory_id = cs.id
    WHERE ci.id = item_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to add style tags to clothing item
CREATE OR REPLACE FUNCTION add_style_tags_to_item(item_id UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Find or create style tag
        SELECT id INTO tag_id FROM public.style_tags WHERE name = tag_name;
        
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name, source) 
            VALUES (tag_name, 'ai_suggested') 
            RETURNING id INTO tag_id;
        END IF;
        
        -- Link to clothing item (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active categories for Gemini prompts
CREATE OR REPLACE FUNCTION get_active_categories_for_prompt()
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_clothing_item_with_categories IS 'Returns clothing item with all category and style tag data as JSON';
COMMENT ON FUNCTION add_style_tags_to_item IS 'Adds multiple style tags to a clothing item, creating new tags if needed';
COMMENT ON FUNCTION get_active_categories_for_prompt IS 'Returns all active categories/subcategories/tags for AI prompts';