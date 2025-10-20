-- ============================================================================
-- FIX ENUM ISSUES - Convert to dynamic tables for better flexibility
-- ============================================================================

-- Create seasons table (dynamic like categories)
CREATE TABLE public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert season data with consistent naming
INSERT INTO public.seasons (name, display_name, display_order) VALUES
('spring', 'Spring', 1),
('summer', 'Summer', 2),
('fall', 'Fall', 3),
('winter', 'Winter', 4),
('all_season', 'All Season', 5);

-- Create fit preferences table
CREATE TABLE public.fit_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert fit preference data
INSERT INTO public.fit_preferences (name, display_name, display_order) VALUES
('tight', 'Tight', 1),
('fitted', 'Fitted', 2),
('regular', 'Regular', 3),
('loose', 'Loose', 4),
('oversized', 'Oversized', 5);

-- Add new columns to clothing_items
ALTER TABLE public.clothing_items 
ADD COLUMN season_names TEXT[] DEFAULT '{}',
ADD COLUMN fit_name TEXT DEFAULT 'regular';

-- Migrate existing data (convert enum arrays to text arrays)
UPDATE public.clothing_items 
SET season_names = ARRAY(
    SELECT unnest(season)::text
), fit_name = fit::text;

-- Drop old enum columns
ALTER TABLE public.clothing_items 
DROP COLUMN season,
DROP COLUMN fit;

-- Update user_profiles fit preference
ALTER TABLE public.user_profiles 
ADD COLUMN preferred_fit_name TEXT DEFAULT 'regular';

UPDATE public.user_profiles 
SET preferred_fit_name = preferred_fit::text;

ALTER TABLE public.user_profiles 
DROP COLUMN preferred_fit;

-- Create RPC functions for season management
CREATE OR REPLACE FUNCTION find_or_create_season(season_name TEXT)
RETURNS UUID AS $$
DECLARE
    season_id UUID;
    clean_name TEXT;
BEGIN
    -- Clean and normalize the season name
    clean_name := lower(trim(season_name));
    clean_name := replace(clean_name, '-', '_');
    clean_name := replace(clean_name, ' ', '_');
    
    -- Try to find existing season
    SELECT id INTO season_id 
    FROM public.seasons 
    WHERE name = clean_name;
    
    -- Create if not found
    IF season_id IS NULL THEN
        INSERT INTO public.seasons (name, display_name) 
        VALUES (clean_name, initcap(replace(clean_name, '_', ' ')))
        RETURNING id INTO season_id;
    END IF;
    
    RETURN season_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create RPC function for fit preference management
CREATE OR REPLACE FUNCTION find_or_create_fit_preference(fit_name TEXT)
RETURNS UUID AS $$
DECLARE
    fit_id UUID;
    clean_name TEXT;
BEGIN
    -- Clean and normalize the fit name
    clean_name := lower(trim(fit_name));
    
    -- Try to find existing fit preference
    SELECT id INTO fit_id 
    FROM public.fit_preferences 
    WHERE name = clean_name;
    
    -- Create if not found
    IF fit_id IS NULL THEN
        INSERT INTO public.fit_preferences (name, display_name) 
        VALUES (clean_name, initcap(clean_name))
        RETURNING id INTO fit_id;
    END IF;
    
    RETURN fit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add indexes
CREATE INDEX idx_seasons_name ON public.seasons(name);
CREATE INDEX idx_seasons_active ON public.seasons(is_active);
CREATE INDEX idx_fit_preferences_name ON public.fit_preferences(name);
CREATE INDEX idx_fit_preferences_active ON public.fit_preferences(is_active);
CREATE INDEX idx_clothing_season_names ON public.clothing_items USING GIN(season_names);
CREATE INDEX idx_clothing_fit_name ON public.clothing_items(fit_name);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Anyone can view fit preferences" ON public.fit_preferences FOR SELECT USING (true);

-- Update seasonal_trends table
ALTER TABLE public.seasonal_trends 
ADD COLUMN season_name TEXT;

-- Migrate existing season enum data
UPDATE public.seasonal_trends 
SET season_name = season::text;

-- Drop old enum column
ALTER TABLE public.seasonal_trends 
DROP COLUMN season;

-- Update outfit_recommendations table
ALTER TABLE public.outfit_recommendations 
ADD COLUMN season_name TEXT;

-- Migrate existing season enum data
UPDATE public.outfit_recommendations 
SET season_name = season::text;

-- Drop old enum column
ALTER TABLE public.outfit_recommendations 
DROP COLUMN season;

-- Update function signature to use TEXT instead of season enum
CREATE OR REPLACE FUNCTION get_trending_categories_for_season(target_season TEXT, target_year INTEGER)
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
        WHERE st.season_name = target_season 
        AND st.year = target_year
        AND CURRENT_DATE BETWEEN st.valid_from AND st.valid_until
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Update diversity calculation function
CREATE OR REPLACE FUNCTION calculate_wardrobe_diversity(target_user_id UUID) 
RETURNS DECIMAL AS $$
DECLARE 
    diversity_score DECIMAL;
BEGIN
SELECT
    (
        COUNT(DISTINCT category_id) * 10 + 
        COUNT(DISTINCT primary_color) * 5 + 
        COUNT(DISTINCT subcategory_id) * 3 + 
        CASE
            WHEN array_length(array_agg(DISTINCT unnest_season), 1) > 1 THEN 20
            ELSE 0
        END
    ) :: DECIMAL / 100.0 INTO diversity_score
FROM
    public.clothing_items,
    LATERAL unnest(season_names) AS unnest_season
WHERE
    user_id = target_user_id
    AND is_archived = FALSE
    AND deleted_at IS NULL;

    RETURN LEAST(diversity_score, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add indexes for new columns
CREATE INDEX idx_seasonal_trends_season_name ON public.seasonal_trends(season_name);
CREATE INDEX idx_outfit_recommendations_season_name ON public.outfit_recommendations(season_name);

-- Comments
COMMENT ON TABLE public.seasons IS 'Dynamic seasons table replacing season enum';
COMMENT ON TABLE public.fit_preferences IS 'Dynamic fit preferences table replacing fit_preference enum';