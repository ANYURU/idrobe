-- ============================================================================
-- COMPLETE ENUM MIGRATION
-- Migrate remaining tables from enums to foreign key references
-- ============================================================================

-- Update wardrobe_gaps table
ALTER TABLE public.wardrobe_gaps 
ADD COLUMN category_id UUID REFERENCES public.clothing_categories(id);

-- Update seasonal_trends table
ALTER TABLE public.seasonal_trends 
ADD COLUMN trending_category_ids UUID[];

-- Create junction table for seasonal trends categories (many-to-many)
CREATE TABLE public.seasonal_trend_categories (
    trend_id UUID REFERENCES public.seasonal_trends(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.clothing_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (trend_id, category_id)
);

-- Migrate existing data in seasonal_trends
INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
SELECT DISTINCT 
    st.id,
    cc.id
FROM public.seasonal_trends st
CROSS JOIN LATERAL unnest(st.trending_categories) AS trend_cat
JOIN public.clothing_categories cc ON cc.name = trend_cat::text
WHERE st.trending_categories IS NOT NULL;

-- Update seasonal_trends with new array format
UPDATE public.seasonal_trends 
SET trending_category_ids = (
    SELECT array_agg(stc.category_id)
    FROM public.seasonal_trend_categories stc
    WHERE stc.trend_id = seasonal_trends.id
);

-- Drop old enum column from seasonal_trends
ALTER TABLE public.seasonal_trends 
DROP COLUMN IF EXISTS trending_categories;

-- Add indexes for new foreign keys
CREATE INDEX idx_wardrobe_gaps_category_id ON public.wardrobe_gaps(category_id);
CREATE INDEX idx_seasonal_trends_category_ids ON public.seasonal_trends USING GIN(trending_category_ids);
CREATE INDEX idx_seasonal_trend_categories_trend ON public.seasonal_trend_categories(trend_id);
CREATE INDEX idx_seasonal_trend_categories_category ON public.seasonal_trend_categories(category_id);

-- RLS for junction table
ALTER TABLE public.seasonal_trend_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trend categories" ON public.seasonal_trend_categories 
FOR SELECT USING (true);

-- Update helper functions to work with new structure
CREATE OR REPLACE FUNCTION get_trending_categories_for_season(target_season season, target_year INTEGER)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            json_build_object(
                'id', cc.id,
                'name', cc.name,
                'trend_description', st.trend_description
            )
        )
        FROM public.seasonal_trends st
        JOIN public.seasonal_trend_categories stc ON st.id = stc.trend_id
        JOIN public.clothing_categories cc ON stc.category_id = cc.id
        WHERE st.season = target_season 
        AND st.year = target_year
        AND CURRENT_DATE BETWEEN st.valid_from AND st.valid_until
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add trending categories to seasonal trend
CREATE OR REPLACE FUNCTION add_trending_categories_to_trend(
    trend_id UUID, 
    category_names TEXT[]
)
RETURNS VOID AS $$
DECLARE
    category_name TEXT;
    category_id UUID;
BEGIN
    FOREACH category_name IN ARRAY category_names
    LOOP
        -- Find or create category
        SELECT id INTO category_id 
        FROM public.clothing_categories 
        WHERE name = category_name;
        
        IF category_id IS NULL THEN
            INSERT INTO public.clothing_categories (name, source) 
            VALUES (category_name, 'trend_analysis') 
            RETURNING id INTO category_id;
        END IF;
        
        -- Link to trend (ignore if already exists)
        INSERT INTO public.seasonal_trend_categories (trend_id, category_id)
        VALUES (trend_id, category_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Update the array column for backward compatibility
    UPDATE public.seasonal_trends 
    SET trending_category_ids = (
        SELECT array_agg(stc.category_id)
        FROM public.seasonal_trend_categories stc
        WHERE stc.trend_id = add_trending_categories_to_trend.trend_id
    )
    WHERE id = add_trending_categories_to_trend.trend_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now we can safely drop the enum types
DROP TYPE IF EXISTS clothing_category CASCADE;
DROP TYPE IF EXISTS clothing_subcategory CASCADE;

-- Comments
COMMENT ON TABLE public.seasonal_trend_categories IS 'Junction table linking seasonal trends to clothing categories';
COMMENT ON FUNCTION get_trending_categories_for_season IS 'Returns trending categories for a specific season and year';
COMMENT ON FUNCTION add_trending_categories_to_trend IS 'Adds multiple categories to a seasonal trend';