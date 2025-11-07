-- ============================================================================
-- FIX MIGRATION CONFLICTS
-- Consolidate and fix all migration conflicts identified
-- ============================================================================

-- Set the search path to include 'extensions' schema explicitly
-- This ensures that operator classes like "vector_cosine_ops" are found
-- when creating indexes later in the script.
SET search_path TO public, extensions, pg_catalog;


-- 1. EXTENSIONS (only create if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the vector extension is created within the 'extensions' schema as intended
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions;

-- 2. DROP ENUM TYPES (if they exist from previous runs)
DROP TYPE IF EXISTS clothing_category CASCADE;
DROP TYPE IF EXISTS clothing_subcategory CASCADE;

-- 3. ENSURE CLOTHING_ITEMS HAS PROPER FOREIGN KEY COLUMNS
-- Add foreign key columns if they don't exist
DO $$
BEGIN
    -- Add category_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clothing_items' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.clothing_items ADD COLUMN category_id UUID REFERENCES public.clothing_categories(id);
    END IF;
    
    -- Add subcategory_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clothing_items' 
        AND column_name = 'subcategory_id'
    ) THEN
        ALTER TABLE public.clothing_items ADD COLUMN subcategory_id UUID REFERENCES public.clothing_subcategories(id);
    END IF;
END $$;

-- 4. CREATE STYLE TAGS JUNCTION TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.clothing_item_style_tags (
    clothing_item_id UUID NOT NULL,
    style_tag_id UUID NOT NULL REFERENCES public.style_tags(id),
    PRIMARY KEY (clothing_item_id, style_tag_id)
);

-- 5. ADD CURRENCY COLUMNS (only if they don't exist)
DO $$
BEGIN
    -- Add currency to clothing_items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clothing_items' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.clothing_items ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
    
    -- Add currency to user_profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'preferred_currency'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
    END IF;
END $$;

-- 6. CREATE ERROR LOGS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ENSURE PROPER INDEXES EXIST
-- These indexes now execute successfully because 'extensions' is in the search_path
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_category ON public.clothing_items(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_active ON public.clothing_items(user_id, is_archived, deleted_at);
CREATE INDEX IF NOT EXISTS idx_clothing_embedding ON public.clothing_items USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- 8. ENSURE RLS IS ENABLED ON ALL USER TABLES
ALTER TABLE public.clothing_item_style_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- 9. CREATE RLS POLICIES FOR NEW TABLES
DO $$
BEGIN
    -- Style tags junction table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clothing_item_style_tags' 
        AND policyname = 'Users can manage own item style tags'
    ) THEN
        CREATE POLICY "Users can manage own item style tags" ON public.clothing_item_style_tags
        FOR ALL USING (
            clothing_item_id IN (
                SELECT id FROM public.clothing_items WHERE user_id = auth.uid()
            )
        );
    END IF;
    
    -- Error logs policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'error_logs' 
        AND policyname = 'Users can view own errors'
    ) THEN
        CREATE POLICY "Users can view own errors" ON public.error_logs
        FOR SELECT USING (user_id = auth.uid());
        
        CREATE POLICY "Users can insert own errors" ON public.error_logs
        FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- 10. CREATE HELPER FUNCTIONS (with proper error handling)
CREATE OR REPLACE FUNCTION get_clothing_item_with_categories(item_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', ci.id,
        'name', ci.name,
        'category', json_build_object('id', cc.id, 'name', cc.name),
        'subcategory', json_build_object('id', cs.id, 'name', cs.name),
        'style_tags', COALESCE(
            (SELECT json_agg(json_build_object('id', st.id, 'name', st.name))
             FROM public.style_tags st
             JOIN public.clothing_item_style_tags cist ON st.id = cist.style_tag_id
             WHERE cist.clothing_item_id = ci.id), '[]'::json
        ),
        'primary_color', ci.primary_color,
        'brand', ci.brand,
        'image_url', ci.image_url
    ) INTO result
    FROM public.clothing_items ci
    LEFT JOIN public.clothing_categories cc ON ci.category_id = cc.id
    LEFT JOIN public.clothing_subcategories cs ON ci.subcategory_id = cs.id
    WHERE ci.id = item_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS add_style_tags_to_item(UUID, TEXT[]);
CREATE FUNCTION add_style_tags_to_item(item_id UUID, tag_names TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    tag_name TEXT;
    tag_id UUID;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        -- Find or create style tag
        SELECT id INTO tag_id FROM public.style_tags WHERE name = tag_name;
        
        IF tag_id IS NULL THEN
            INSERT INTO public.style_tags (name) VALUES (tag_name) RETURNING id INTO tag_id;
        END IF;
        
        -- Add to junction table (ignore if already exists)
        INSERT INTO public.clothing_item_style_tags (clothing_item_id, style_tag_id)
        VALUES (item_id, tag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_categories_for_prompt()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'categories', (
            SELECT json_agg(json_build_object('id', id, 'name', name))
            FROM public.clothing_categories 
            WHERE is_active = TRUE 
            ORDER BY display_order
        ),
        'subcategories', (
            SELECT json_agg(json_build_object('id', cs.id, 'name', cs.name, 'category_id', cs.category_id))
            FROM public.clothing_subcategories cs
            JOIN public.clothing_categories cc ON cs.category_id = cc.id
            WHERE cs.is_active = TRUE AND cc.is_active = TRUE
            ORDER BY cc.display_order, cs.name
        ),
        'style_tags', (
            SELECT json_agg(json_build_object('id', id, 'name', name))
            FROM public.style_tags 
            WHERE is_active = TRUE 
            ORDER BY popularity_score DESC
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. REFRESH MATERIALIZED VIEW (only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE matviewname = 'user_wardrobe_analytics'
    ) THEN
        REFRESH MATERIALIZED VIEW public.user_wardrobe_analytics;
    END IF;
END $$;

-- 12. COMMENTS
COMMENT ON TABLE public.clothing_item_style_tags IS 'Junction table linking clothing items to style tags';
COMMENT ON TABLE public.error_logs IS 'System error logging for debugging and monitoring';
COMMENT ON FUNCTION get_clothing_item_with_categories(UUID) IS 'Returns clothing item with all related category and tag data';
COMMENT ON FUNCTION add_style_tags_to_item(UUID, TEXT[]) IS 'Adds multiple style tags to a clothing item';
COMMENT ON FUNCTION get_active_categories_for_prompt() IS 'Returns all active categories, subcategories, and tags for AI prompts';
